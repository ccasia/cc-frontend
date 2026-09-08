import { useRef, useMemo, useEffect, useReducer, useCallback } from 'react';

import { validateProfileLink } from './profile-link-validation';
import {
  forgetRow,
  readMapping,
  rememberRow,
  writeMapping,
  reconcileMapping,
} from './extraction-session-store';
import {
  DRAFT_KIND,
  readDraft,
  clearDraft,
  persistOpenDraft,
  stampDraftExpiry,
  withKeptFirstId,
} from './creator-draft-store';
import {
  getExtraction,
  startExtraction,
  newIdempotencyKey,
  listResumableExtractions,
} from './guest-extraction-api';
import {
  ACTIONS,
  ROW_STATUS,
  canFetchRow,
  isRowActive,
  duplicateRowIds,
  submittableRows,
  creatorRowReducer,
  createInitialState,
} from './creator-row-machine';

/**
 * Wires the row state machine to the API.
 *
 * A valid profile link starts the fetch after debounce. The debounce still
 * only validates; paid work begins once the accepted link is on the row.
 */

const VALIDATION_DEBOUNCE_MS = 350;
const POLL_INTERVAL_MS = 2000;

const RUNNING_STATUSES = {
  QUEUED: ROW_STATUS.QUEUED,
  RUNNING: ROW_STATUS.RUNNING,
  POLLING: ROW_STATUS.POLLING,
  REQUIRES_RECONCILIATION: ROW_STATUS.POLLING,
};

const TERMINAL_STATUSES = new Set([
  ROW_STATUS.READY,
  ROW_STATUS.INSUFFICIENT_DATA,
  ROW_STATUS.FAILED,
  ROW_STATUS.CANCELLED,
  ROW_STATUS.STALE,
]);

export default function useGuestExtraction({
  campaignId,
  enabled,
  kind = DRAFT_KIND.GUEST,
  skipDraftRow,
}) {
  const [state, dispatch] = useReducer(creatorRowReducer, undefined, createInitialState);

  const timers = useRef(new Map());
  const polls = useRef(new Map());
  const mounted = useRef(true);
  const skipDraftRowRef = useRef(skipDraftRow);
  skipDraftRowRef.current = skipDraftRow;

  /**
   * On open, restore a live scrape draft or start empty.
   *
   * MUI keeps a closed `Dialog` mounted, so the reducer state outlives the
   * close. Hydrate during render on the closed-to-open edge, not in an
   * effect: an effect runs after paint, so the first frame would flash the
   * wrong rows and AnimatePresence would play an enter on the replacement.
   * On close, start the 1-minute clock.
   *
   * A first mount that is already open (refresh with the modal up) never
   * sees a closed-to-open edge, so that path reads the draft once here too.
   */
  const wasEnabled = useRef(enabled);
  const initialOpenHandled = useRef(false);
  if (!initialOpenHandled.current) {
    initialOpenHandled.current = true;
    if (enabled && campaignId) {
      const draft = readDraft(kind, campaignId);
      if (draft?.rows?.length) {
        dispatch({
          type: ACTIONS.RESTORE_ROWS,
          rows: withKeptFirstId(draft.rows, state.rows[0]?.id),
        });
      }
    }
  }
  if (enabled !== wasEnabled.current) {
    const opening = enabled && !wasEnabled.current;
    const closing = !enabled && wasEnabled.current;
    wasEnabled.current = enabled;
    if (opening) {
      const keepId = state.rows[0]?.id;
      const draft = campaignId ? readDraft(kind, campaignId) : null;
      if (draft?.rows?.length) {
        dispatch({
          type: ACTIONS.RESTORE_ROWS,
          rows: withKeptFirstId(draft.rows, keepId),
        });
      } else {
        dispatch({ type: ACTIONS.RESET });
      }
    } else if (closing && campaignId) {
      stampDraftExpiry(kind, campaignId);
    }
  }

  /** Row ids waiting for VALIDATION_RESULT to land before auto-fetch. */
  const pendingFetch = useRef(new Map());

  useEffect(
    () => () => {
      mounted.current = false;
      timers.current.forEach(clearTimeout);
      polls.current.forEach(clearInterval);
    },
    []
  );

  const stopPolling = useCallback((rowId) => {
    const handle = polls.current.get(rowId);
    if (handle) {
      clearInterval(handle);
      polls.current.delete(rowId);
    }
  }, []);

  /** Read one result and move the row to its terminal state. */
  const applyResult = useCallback(
    (rowId, record) => {
      if (!mounted.current) return;

      switch (record.status) {
        case 'READY':
          stopPolling(rowId);
          dispatch({
            type: ACTIONS.EXTRACTION_READY,
            rowId,
            name: record.name ?? '',
            followerCount: record.followerCount == null ? '' : String(record.followerCount),
            engagementRate: record.engagementRate ?? '',
            completionReceipt: record.completionReceipt,
            sampleSize: record.sampleSize,
            fetchedAt: record.fetchedAt,
            selectedPosts: record.selectedPosts,
            formulaVersion: record.formulaVersion,
          });
          break;
        case 'INSUFFICIENT_DATA':
          stopPolling(rowId);
          dispatch({
            type: ACTIONS.EXTRACTION_INSUFFICIENT,
            rowId,
            validCount: record.sampleSize ?? 0,
          });
          break;
        case 'FAILED':
          stopPolling(rowId);
          dispatch({
            type: ACTIONS.EXTRACTION_FAILED,
            rowId,
            error: {
              code: record.failureCode ?? 'UNKNOWN',
              message: record.failureMessage ?? 'The fetch failed.',
              retryable: !['PRIVATE_PROFILE', 'PROFILE_NOT_FOUND'].includes(record.failureCode),
            },
          });
          break;
        case 'CANCELLED':
        case 'STALE':
          stopPolling(rowId);
          dispatch({ type: ACTIONS.MARK_STALE, rowId });
          break;
        case 'RUNNING':
          dispatch({ type: ACTIONS.EXTRACTION_RUNNING, rowId });
          break;
        default:
          dispatch({ type: ACTIONS.EXTRACTION_POLLING, rowId });
      }
    },
    [stopPolling]
  );

  const pollRow = useCallback(
    (rowId, extractionId) => {
      stopPolling(rowId);
      const tick = async () => {
        try {
          const record = await getExtraction(extractionId);
          applyResult(rowId, record);
        } catch (error) {
          stopPolling(rowId);
          if (!mounted.current) return;
          dispatch({
            type: ACTIONS.EXTRACTION_FAILED,
            rowId,
            error: {
              code: error?.response?.data?.code ?? 'NETWORK',
              message: error?.response?.data?.message ?? 'The result could not be read.',
              retryable: true,
            },
          });
        }
      };

      polls.current.set(rowId, setInterval(tick, POLL_INTERVAL_MS));
      tick();
    },
    [applyResult, stopPolling]
  );

  /* ------------------------------------------------------------ the link */

  const stopTimer = useCallback((rowId) => {
    const handle = timers.current.get(rowId);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(rowId);
    }
  }, []);

  const setLink = useCallback(
    (rowId, value) => {
      // A link change kills the old work for this row straight away.
      stopPolling(rowId);
      forgetRow(campaignId, rowId);
      pendingFetch.current.delete(rowId);
      dispatch({ type: ACTIONS.SET_LINK, rowId, value });

      stopTimer(rowId);
      if (!value.trim()) return;

      timers.current.set(
        rowId,
        setTimeout(() => {
          const result = validateProfileLink(value);
          dispatch({
            type: ACTIONS.VALIDATION_RESULT,
            rowId,
            ok: result.ok,
            canonicalProfileUrl: result.ok ? result.profile.canonicalUrl : null,
            canonicalProfileKey: result.ok ? result.profile.canonicalKey : null,
            platform: result.ok ? result.profile.platform : null,
            error: result.ok ? null : { code: result.code, message: result.message },
          });
          if (result.ok) {
            pendingFetch.current.set(rowId, result.profile.canonicalKey);
          } else {
            pendingFetch.current.delete(rowId);
          }
        }, VALIDATION_DEBOUNCE_MS)
      );
    },
    [campaignId, stopPolling, stopTimer]
  );

  /* ------------------------------------------- fetch after a valid link */

  const fetchRow = useCallback(
    async (rowId) => {
      const row = state.rows.find((r) => r.id === rowId);
      if (!row || !canFetchRow(row, { duplicateIds: duplicateRowIds(state.rows) })) return;

      dispatch({ type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: null });

      try {
        const result = await startExtraction({
          campaignId,
          clientRowId: rowId,
          profileLink: row.profileLink,
          idempotencyKey: newIdempotencyKey(),
        });

        if (!mounted.current) return;
        dispatch({ type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: result.extractionId });
        rememberRow(campaignId, rowId, {
          extractionId: result.extractionId,
          profileLink: row.profileLink,
        });
        pollRow(rowId, result.extractionId);
      } catch (error) {
        if (!mounted.current) return;
        dispatch({
          type: ACTIONS.EXTRACTION_FAILED,
          rowId,
          error: {
            code: error?.response?.data?.code ?? 'START_FAILED',
            message: error?.response?.data?.message ?? 'The fetch could not be started.',
            retryable: true,
          },
        });
      }
    },
    [campaignId, pollRow, state.rows]
  );

  useEffect(() => {
    if (pendingFetch.current.size === 0) return;

    pendingFetch.current.forEach((key, rowId) => {
      const row = state.rows.find((entry) => entry.id === rowId);
      if (!row) {
        pendingFetch.current.delete(rowId);
        return;
      }
      if (row.status === ROW_STATUS.VALIDATING) return;

      pendingFetch.current.delete(rowId);
      if (row.canonicalProfileKey === key) {
        fetchRow(rowId);
      }
    });
  }, [state.rows, fetchRow]);

  const cancelRow = useCallback(
    (rowId) => {
      stopTimer(rowId);
      stopPolling(rowId);
      pendingFetch.current.delete(rowId);
      dispatch({ type: ACTIONS.EXTRACTION_CANCELLED, rowId });
    },
    [stopPolling, stopTimer]
  );

  const removeRow = useCallback(
    (rowId) => {
      stopTimer(rowId);
      stopPolling(rowId);
      pendingFetch.current.delete(rowId);
      forgetRow(campaignId, rowId);
      dispatch({ type: ACTIONS.REMOVE_ROW, rowId });
    },
    [campaignId, stopPolling, stopTimer]
  );

  const clearPersistedDraft = useCallback(() => {
    if (campaignId) clearDraft(kind, campaignId);
  }, [campaignId, kind]);

  /* ------------------------------------------- scrape draft persistence */

  useEffect(() => {
    if (!enabled || !campaignId) return;
    persistOpenDraft(kind, campaignId, state.rows, skipDraftRowRef.current);
    state.rows.forEach((row) => {
      if (TERMINAL_STATUSES.has(row.status)) forgetRow(campaignId, row.id);
    });
  }, [enabled, campaignId, kind, state.rows]);

  /* --------------------------------------------------- refresh recovery */

  useEffect(() => {
    if (!enabled || !campaignId) return undefined;

    let cancelled = false;
    (async () => {
      const mapping = readMapping(campaignId);
      if (Object.keys(mapping).length === 0) return;

      try {
        const server = await listResumableExtractions(campaignId);
        if (cancelled || !mounted.current) return;

        const kept = reconcileMapping(mapping, server);
        writeMapping(campaignId, kept);

        const draft = readDraft(kind, campaignId);
        const entries = Object.entries(kept);
        const recoverable = draft?.rows?.length
          ? entries.filter(([, entry]) => RUNNING_STATUSES[entry.status])
          : entries;

        // Re-derive the platform from the saved link. Without this a restored
        // row shows an empty Platform field even though the link is valid.
        const rows = recoverable.map(([rowId, entry]) => {
          const link = validateProfileLink(entry.profileLink);
          return {
            id: rowId,
            profileLink: entry.profileLink,
            extractionId: entry.extractionId,
            status: RUNNING_STATUSES[entry.status] ?? ROW_STATUS.POLLING,
            canonicalProfileUrl: link.ok ? link.profile.canonicalUrl : null,
            canonicalProfileKey: link.ok ? link.profile.canonicalKey : null,
            platform: link.ok ? link.profile.platform : null,
          };
        });
        if (rows.length === 0) return;

        dispatch({
          type: draft?.rows?.length ? ACTIONS.MERGE_ROWS : ACTIONS.RESTORE_ROWS,
          rows,
        });
        // A reused result is re-read, so the receipt is issued fresh and bound
        // to this admin.
        rows.forEach((row) => pollRow(row.id, row.extractionId));
      } catch {
        // Recovery is a convenience. A failure leaves a clean dialog.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [campaignId, enabled, kind, pollRow]);

  /* ------------------------------------------------------------ derived */

  const duplicateIds = useMemo(() => duplicateRowIds(state.rows), [state.rows]);
  const eligible = useMemo(() => submittableRows(state), [state]);
  const activeCount = useMemo(() => state.rows.filter(isRowActive).length, [state.rows]);

  return {
    state,
    dispatch,
    duplicateIds,
    eligibleRows: eligible,
    eligibleCount: eligible.length,
    activeCount,
    setLink,
    fetchRow,
    cancelRow,
    removeRow,
    clearPersistedDraft,
  };
}
