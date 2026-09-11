import { useRef, useMemo, useEffect, useReducer, useCallback } from 'react';

import { validateProfileLink } from './profile-link-validation';
import {
  getExtraction,
  startExtraction,
  newIdempotencyKey,
  listResumableExtractions,
} from './guest-extraction-api';
import {
  forgetRow,
  readMapping,
  rememberRow,
  clearMapping,
  writeMapping,
  reconcileMapping,
} from './extraction-session-store';
import {
  readDraft,
  DRAFT_KIND,
  clearDraft,
  withKeptFirstId,
  persistOpenDraft,
  stampDraftExpiry,
} from './creator-draft-store';
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

const PLATFORM_RECOVERY_STATUSES = new Set([
  ROW_STATUS.READY,
  ROW_STATUS.INSUFFICIENT_DATA,
]);

const hasSameRecoveryIdentity = (left, right) =>
  left?.extractionId === right?.extractionId &&
  left?.profileLink === right?.profileLink &&
  left?.creatorId === right?.creatorId &&
  left?.selectedPlatform === right?.selectedPlatform &&
  left?.sourceMode === right?.sourceMode;

const recoveryIdentityOf = (mapping) =>
  JSON.stringify(
    Object.entries(mapping)
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
      .map(([rowId, entry]) => [
        rowId,
        entry.extractionId,
        entry.profileLink,
        entry.creatorId,
        entry.selectedPlatform,
        entry.sourceMode,
      ])
  );

const getStoredProfileLink = (creator, platform) =>
  (
    (platform === 'tiktok'
      ? creator?.creator?.tiktokProfileLink
      : creator?.creator?.instagramProfileLink) || ''
  ).trim();

const restoreDraftRows = (kind, rows, keepId) =>
  kind === DRAFT_KIND.PLATFORM || rows.some((row) => row.extractionId && isRowActive(row))
    ? rows
    : withKeptFirstId(rows, keepId);

const isMatchingPlatformDraft = (row, entry) =>
  row?.extractionId === entry.extractionId &&
  row?.profileLink === entry.profileLink &&
  row?.creator?.id === entry.creatorId &&
  row?.selectedPlatform === entry.selectedPlatform &&
  row?.sourceMode === entry.sourceMode;

const isAuthoritativePlatformDraft = (row) =>
  (row?.status === ROW_STATUS.READY && Boolean(row.completionReceipt)) ||
  row?.status === ROW_STATUS.INSUFFICIENT_DATA;

export default function useGuestExtraction({
  campaignId,
  enabled,
  kind = DRAFT_KIND.GUEST,
  skipDraftRow,
  resolveCreator,
  recoveryReady = true,
}) {
  const [state, dispatch] = useReducer(creatorRowReducer, undefined, createInitialState);

  const timers = useRef(new Map());
  const polls = useRef(new Map());
  const pendingRecoveryPolls = useRef(new Map());
  const contextVersions = useRef(new Map());
  const mounted = useRef(true);
  const skipDraftRowRef = useRef(skipDraftRow);
  const resolveCreatorRef = useRef(resolveCreator);
  const recoveryAttempts = useRef(new Set());
  skipDraftRowRef.current = skipDraftRow;
  resolveCreatorRef.current = resolveCreator;

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
          rows: restoreDraftRows(kind, draft.rows, state.rows[0]?.id),
        });
      }
    }
  }
  if (enabled !== wasEnabled.current) {
    const opening = enabled && !wasEnabled.current;
    const closing = !enabled && wasEnabled.current;
    wasEnabled.current = enabled;
    if (opening) {
      recoveryAttempts.current.clear();
      const keepId = state.rows[0]?.id;
      const draft = campaignId ? readDraft(kind, campaignId) : null;
      if (draft?.rows?.length) {
        dispatch({
          type: ACTIONS.RESTORE_ROWS,
          rows: restoreDraftRows(kind, draft.rows, keepId),
        });
      } else if (polls.current.size === 0) {
        dispatch({ type: ACTIONS.RESET });
      }
    } else if (closing && campaignId) {
      stampDraftExpiry(kind, campaignId);
    }
  }

  /** Row ids waiting for VALIDATION_RESULT to land before auto-fetch. */
  const pendingFetch = useRef(new Map());

  useEffect(() => {
    const activeTimers = timers.current;
    const activePolls = polls.current;
    mounted.current = true;

    return () => {
      mounted.current = false;
      activeTimers.forEach(clearTimeout);
      activePolls.forEach((session) => clearTimeout(session.timeoutId));
    };
  }, []);

  const stopPolling = useCallback((rowId) => {
    const session = polls.current.get(rowId);
    if (session?.timeoutId) clearTimeout(session.timeoutId);
    polls.current.delete(rowId);
  }, []);

  const isCurrentContext = useCallback(
    (rowId, contextVersion) => contextVersions.current.get(rowId) === contextVersion,
    []
  );

  /** Read one result and move the row to its terminal state. */
  const applyResult = useCallback(
    (rowId, record, contextVersion) => {
      if (!mounted.current || !isCurrentContext(rowId, contextVersion)) return;

      switch (record.status) {
        case 'READY':
          stopPolling(rowId);
          dispatch({
            type: ACTIONS.EXTRACTION_READY,
            rowId,
            contextVersion,
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
            contextVersion,
            validCount: record.sampleSize ?? 0,
          });
          break;
        case 'FAILED':
          stopPolling(rowId);
          dispatch({
            type: ACTIONS.EXTRACTION_FAILED,
            rowId,
            contextVersion,
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
          dispatch({ type: ACTIONS.MARK_STALE, rowId, contextVersion });
          break;
        case 'RUNNING':
          dispatch({ type: ACTIONS.EXTRACTION_RUNNING, rowId, contextVersion });
          break;
        default:
          dispatch({ type: ACTIONS.EXTRACTION_POLLING, rowId, contextVersion });
      }
    },
    [isCurrentContext, stopPolling]
  );

  const pollRow = useCallback(
    (rowId, extractionId, contextVersion) => {
      const activeSession = polls.current.get(rowId);
      if (
        activeSession?.extractionId === extractionId &&
        activeSession?.contextVersion === contextVersion
      ) {
        return;
      }

      stopPolling(rowId);
      contextVersions.current.set(rowId, contextVersion);
      const session = { extractionId, contextVersion, timeoutId: null };
      polls.current.set(rowId, session);

      const tick = async () => {
        if (polls.current.get(rowId) !== session || !isCurrentContext(rowId, contextVersion)) return;

        try {
          const record = await getExtraction(extractionId);
          if (polls.current.get(rowId) !== session || !isCurrentContext(rowId, contextVersion)) return;
          applyResult(rowId, record, contextVersion);
          if (
            polls.current.get(rowId) === session &&
            !['READY', 'INSUFFICIENT_DATA', 'FAILED', 'CANCELLED', 'STALE'].includes(record.status)
          ) {
            session.timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
          }
        } catch (error) {
          if (
            !mounted.current ||
            polls.current.get(rowId) !== session ||
            !isCurrentContext(rowId, contextVersion)
          ) {
            return;
          }
          stopPolling(rowId);
          dispatch({
            type: ACTIONS.EXTRACTION_FAILED,
            rowId,
            contextVersion,
            error: {
              code: error?.response?.data?.code ?? 'NETWORK',
              message: error?.response?.data?.message ?? 'The result could not be read.',
              retryable: true,
            },
          });
        }
      };

      tick();
    },
    [applyResult, isCurrentContext, stopPolling]
  );

  /* ------------------------------------------------------------ the link */

  const stopTimer = useCallback((rowId) => {
    const handle = timers.current.get(rowId);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(rowId);
    }
  }, []);

  const nextContextVersion = useCallback(
    (rowId) => {
      const rowVersion = state.rows.find((row) => row.id === rowId)?.contextVersion ?? 0;
      const next = Math.max(contextVersions.current.get(rowId) ?? 0, rowVersion) + 1;
      contextVersions.current.set(rowId, next);
      return next;
    },
    [state.rows]
  );

  const invalidateWork = useCallback(
    (rowId) => {
      stopPolling(rowId);
      forgetRow(kind, campaignId, rowId);
      pendingFetch.current.delete(rowId);
      pendingRecoveryPolls.current.delete(rowId);
      stopTimer(rowId);
      return nextContextVersion(rowId);
    },
    [campaignId, kind, nextContextVersion, stopPolling, stopTimer]
  );

  const scheduleValidation = useCallback(
    (rowId, value, expectedPlatform, contextVersion) => {
      if (!value.trim()) return;

      timers.current.set(
        rowId,
        setTimeout(() => {
          if (!isCurrentContext(rowId, contextVersion)) return;
          const result = validateProfileLink(value, expectedPlatform);
          if (result.ok) {
            pendingFetch.current.set(rowId, {
              key: result.profile.canonicalKey,
              contextVersion,
            });
          } else {
            pendingFetch.current.delete(rowId);
          }
          dispatch({
            type: ACTIONS.VALIDATION_RESULT,
            rowId,
            contextVersion,
            ok: result.ok,
            canonicalProfileUrl: result.ok ? result.profile.canonicalUrl : null,
            canonicalProfileKey: result.ok ? result.profile.canonicalKey : null,
            platform: result.ok ? result.profile.platform : null,
            error: result.ok ? null : { code: result.code, message: result.message },
          });
        }, VALIDATION_DEBOUNCE_MS)
      );
    },
    [isCurrentContext]
  );

  const setLink = useCallback(
    (rowId, value) => {
      const row = state.rows.find((entry) => entry.id === rowId);
      const contextVersion = invalidateWork(rowId);
      dispatch({ type: ACTIONS.SET_LINK, rowId, value, contextVersion });
      scheduleValidation(rowId, value, row?.creator ? row.selectedPlatform : undefined, contextVersion);
    },
    [invalidateWork, scheduleValidation, state.rows]
  );

  const setCreator = useCallback(
    (rowId, creator, source = {}) => {
      const contextVersion = invalidateWork(rowId);
      dispatch({
        type: ACTIONS.SET_CREATOR,
        rowId,
        creator,
        ...source,
        contextVersion,
      });
    },
    [invalidateWork]
  );

  const setSource = useCallback(
    (rowId, source) => {
      const contextVersion = invalidateWork(rowId);
      dispatch({ type: ACTIONS.SET_SOURCE, rowId, ...source, contextVersion });
      scheduleValidation(
        rowId,
        source.profileLink ?? '',
        source.selectedPlatform,
        contextVersion
      );
      return contextVersion;
    },
    [invalidateWork, scheduleValidation]
  );

  /* ------------------------------------------- fetch after a valid link */

  const fetchRow = useCallback(
    async (rowId) => {
      const row = state.rows.find((r) => r.id === rowId);
      if (!row || !canFetchRow(row, { duplicateIds: duplicateRowIds(state.rows) })) return;
      const { contextVersion } = row;

      dispatch({ type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: null, contextVersion });

      try {
        const result = await startExtraction({
          campaignId,
          clientRowId: rowId,
          profileLink: row.profileLink,
          expectedPlatform: row.creator ? row.selectedPlatform : undefined,
          idempotencyKey: newIdempotencyKey(),
        });

        if (!mounted.current || !isCurrentContext(rowId, contextVersion)) return;
        dispatch({
          type: ACTIONS.FETCH_REQUESTED,
          rowId,
          extractionId: result.extractionId,
          contextVersion,
        });
        rememberRow(kind, campaignId, rowId, {
          extractionId: result.extractionId,
          profileLink: row.profileLink,
          ...(kind === DRAFT_KIND.PLATFORM
            ? {
                creatorId: row.creator.id,
                selectedPlatform: row.selectedPlatform,
                sourceMode: row.sourceMode,
              }
            : {}),
        });
        pollRow(rowId, result.extractionId, contextVersion);
      } catch (error) {
        if (!mounted.current || !isCurrentContext(rowId, contextVersion)) return;
        dispatch({
          type: ACTIONS.EXTRACTION_FAILED,
          rowId,
          contextVersion,
          error: {
            code: error?.response?.data?.code ?? 'START_FAILED',
            message: error?.response?.data?.message ?? 'The fetch could not be started.',
            retryable: true,
          },
        });
      }
    },
    [campaignId, isCurrentContext, kind, pollRow, state.rows]
  );

  useEffect(() => {
    if (pendingFetch.current.size === 0) return;

    pendingFetch.current.forEach(({ key, contextVersion }, rowId) => {
      const row = state.rows.find((entry) => entry.id === rowId);
      if (!row) {
        pendingFetch.current.delete(rowId);
        return;
      }
      if (row.status === ROW_STATUS.VALIDATING) return;

      pendingFetch.current.delete(rowId);
      if (
        row.contextVersion === contextVersion &&
        row.canonicalProfileKey === key &&
        (!row.creator || row.platform === row.selectedPlatform)
      ) {
        fetchRow(rowId);
      }
    });
  }, [state.rows, fetchRow]);

  const cancelRow = useCallback(
    (rowId) => {
      const contextVersion = invalidateWork(rowId);
      dispatch({ type: ACTIONS.EXTRACTION_CANCELLED, rowId, contextVersion });
    },
    [invalidateWork]
  );

  const removeRow = useCallback(
    (rowId) => {
      stopTimer(rowId);
      stopPolling(rowId);
      pendingFetch.current.delete(rowId);
      pendingRecoveryPolls.current.delete(rowId);
      contextVersions.current.delete(rowId);
      forgetRow(kind, campaignId, rowId);
      dispatch({ type: ACTIONS.REMOVE_ROW, rowId });
    },
    [campaignId, kind, stopPolling, stopTimer]
  );

  const completeSuccessfulSave = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    polls.current.forEach((session) => {
      if (session.timeoutId) clearTimeout(session.timeoutId);
    });
    polls.current.clear();
    pendingFetch.current.clear();
    pendingRecoveryPolls.current.clear();
    contextVersions.current.clear();
    if (campaignId) {
      clearDraft(kind, campaignId);
      clearMapping(kind, campaignId);
    }
    dispatch({ type: ACTIONS.RESET });
  }, [campaignId, kind]);

  const applySaveResult = useCallback(
    ({ acceptedRowIds, rejectedByRowId, error }) => {
      acceptedRowIds.forEach((rowId) => {
        stopTimer(rowId);
        stopPolling(rowId);
        pendingFetch.current.delete(rowId);
        pendingRecoveryPolls.current.delete(rowId);
        contextVersions.current.delete(rowId);
        forgetRow(kind, campaignId, rowId);
      });
      dispatch({
        type: ACTIONS.APPLY_SAVE_RESULT,
        acceptedRowIds,
        rejectedByRowId,
        error,
      });
    },
    [campaignId, kind, stopPolling, stopTimer]
  );

  /* ------------------------------------------- scrape draft persistence */

  useEffect(() => {
    if (!enabled || !campaignId) return;
    persistOpenDraft(kind, campaignId, state.rows, skipDraftRowRef.current);
    state.rows.forEach((row) => {
      const keepPlatformRecovery =
        kind === DRAFT_KIND.PLATFORM && PLATFORM_RECOVERY_STATUSES.has(row.status);
      if (TERMINAL_STATUSES.has(row.status) && !keepPlatformRecovery) {
        forgetRow(kind, campaignId, row.id);
      }
    });
  }, [enabled, campaignId, kind, state.rows]);

  /* --------------------------------------------------- refresh recovery */

  const recoveryMapping =
    enabled && campaignId && recoveryReady
      ? Object.fromEntries(
          Object.entries(readMapping(kind, campaignId)).filter(
            ([rowId, entry]) => polls.current.get(rowId)?.extractionId !== entry.extractionId
          )
        )
      : {};
  const recoveryMappingIdentity = recoveryIdentityOf(recoveryMapping);

  useEffect(() => {
    if (!enabled || !campaignId || !recoveryReady) return undefined;

    const mapping = Object.fromEntries(
      Object.entries(readMapping(kind, campaignId)).filter(
        ([rowId, entry]) => polls.current.get(rowId)?.extractionId !== entry.extractionId
      )
    );
    if (Object.keys(mapping).length === 0) return undefined;

    const attemptKey = `${kind}:${campaignId}:${recoveryIdentityOf(mapping)}`;
    if (recoveryAttempts.current.has(attemptKey)) return undefined;
    recoveryAttempts.current.add(attemptKey);

    let cancelled = false;
    (async () => {
      try {
        const server = await listResumableExtractions(campaignId);
        if (cancelled || !mounted.current) return;

        // Re-read after the request. A source change can forget a row while the
        // recovery request is in flight, and that current mapping must win.
        const currentMapping = readMapping(kind, campaignId);
        const reconciled = reconcileMapping(mapping, server);
        const kept = { ...currentMapping };
        const recoverableMapping = {};

        // Reconcile only entries that are still identical to the request
        // snapshot. A forgotten entry stays forgotten, while a newer source
        // mapping is preserved for its own recovery request.
        Object.entries(mapping).forEach(([rowId, requestedEntry]) => {
          const currentEntry = currentMapping[rowId];
          const unchanged = hasSameRecoveryIdentity(currentEntry, requestedEntry);
          if (!unchanged) return;
          if (reconciled[rowId]) {
            kept[rowId] = reconciled[rowId];
            recoverableMapping[rowId] = reconciled[rowId];
          } else {
            delete kept[rowId];
          }
        });

        const draft = readDraft(kind, campaignId);
        const serverById = new Map(server.map((record) => [record.id, record]));
        const rows = [];
        const staleRowIds = [];
        Object.entries(mapping).forEach(([rowId, requestedEntry]) => {
          const currentEntry = currentMapping[rowId];
          if (!hasSameRecoveryIdentity(currentEntry, requestedEntry)) return;
          const entry = recoverableMapping[rowId];
          const draftedRow =
            kind === DRAFT_KIND.PLATFORM
              ? draft?.rows?.find(
                  (row) => row.id === rowId && isMatchingPlatformDraft(row, requestedEntry)
                )
              : draft?.rows?.find(
                  (row) => row.id === rowId || row.extractionId === requestedEntry.extractionId
                );
          const authoritativeDraft =
            kind === DRAFT_KIND.PLATFORM && isAuthoritativePlatformDraft(draftedRow);

          if (authoritativeDraft) return;
          if (!entry) {
            if (kind === DRAFT_KIND.PLATFORM && draftedRow && isRowActive(draftedRow)) {
              staleRowIds.push(rowId);
            }
            return;
          }
          if (
            kind === DRAFT_KIND.PLATFORM &&
            TERMINAL_STATUSES.has(serverById.get(entry.extractionId)?.status) &&
            !draftedRow
          ) {
            delete kept[rowId];
            return;
          }
          const link = validateProfileLink(
            entry.profileLink,
            kind === DRAFT_KIND.PLATFORM ? entry.selectedPlatform : undefined
          );
          const creator =
            kind === DRAFT_KIND.PLATFORM
              ? resolveCreatorRef.current?.(entry.creatorId) ?? null
              : null;
          const serverLink = entry.serverProfileUrl
            ? validateProfileLink(entry.serverProfileUrl, entry.selectedPlatform)
            : null;
          const serverLinkMatches =
            !serverLink ||
            (serverLink.ok && serverLink.profile.canonicalKey === link.profile?.canonicalKey);
          if (
            !link.ok ||
            !serverLinkMatches ||
            (kind === DRAFT_KIND.PLATFORM && !creator)
          ) {
            delete kept[rowId];
            return;
          }
          const contextVersion = Math.max(
            contextVersions.current.get(rowId) ?? 0,
            draftedRow?.contextVersion ?? 0
          ) + 1;
          contextVersions.current.set(rowId, contextVersion);

          if (kind === DRAFT_KIND.PLATFORM && entry.sourceMode === 'stored') {
            const currentStoredValue = getStoredProfileLink(creator, entry.selectedPlatform);
            const currentStoredLink = validateProfileLink(
              currentStoredValue,
              entry.selectedPlatform
            );
            const storedLinkMatches =
              currentStoredLink.ok &&
              currentStoredLink.profile.canonicalKey === link.profile.canonicalKey;

            if (!storedLinkMatches) {
              delete kept[rowId];
              rows.push({
                ...draftedRow,
                id: rowId,
                creator,
                profileLink: currentStoredValue,
                extractionId: null,
                completionReceipt: null,
                selectedPlatform: entry.selectedPlatform,
                sourceMode: 'manual',
                status: ROW_STATUS.IDLE,
                canonicalProfileUrl: currentStoredLink.ok
                  ? currentStoredLink.profile.canonicalUrl
                  : null,
                canonicalProfileKey: currentStoredLink.ok
                  ? currentStoredLink.profile.canonicalKey
                  : null,
                platform: currentStoredLink.ok ? currentStoredLink.profile.platform : null,
                contextVersion,
                name: '',
                followerCount: '',
                engagementRate: '',
                sampleSize: null,
                fetchedAt: null,
                selectedPosts: null,
                formulaVersion: null,
                fetched: null,
                fallbackConfirmed: false,
                fallbackReason: null,
                linkError:
                  currentStoredValue && !currentStoredLink.ok
                    ? { code: currentStoredLink.code, message: currentStoredLink.message }
                    : null,
                error: null,
                saveError: null,
              });
              return;
            }
          }

          rows.push({
            ...(kind === DRAFT_KIND.PLATFORM ? draftedRow : null),
            id: rowId,
            creator,
            profileLink: entry.profileLink,
            extractionId: entry.extractionId,
            selectedPlatform:
              kind === DRAFT_KIND.PLATFORM ? entry.selectedPlatform : draftedRow?.selectedPlatform,
            sourceMode: kind === DRAFT_KIND.PLATFORM ? entry.sourceMode : draftedRow?.sourceMode,
            status: RUNNING_STATUSES[entry.status] ?? ROW_STATUS.POLLING,
            canonicalProfileUrl: link.profile.canonicalUrl,
            canonicalProfileKey: link.profile.canonicalKey,
            platform: link.profile.platform,
            contextVersion,
          });
        });
        writeMapping(kind, campaignId, kept);
        staleRowIds.forEach((rowId) => dispatch({ type: ACTIONS.MARK_STALE, rowId }));
        if (rows.length === 0) return;

        rows.filter((row) => row.extractionId && isRowActive(row)).forEach((row) => {
          pendingRecoveryPolls.current.set(row.id, {
            extractionId: row.extractionId,
            contextVersion: row.contextVersion,
          });
        });
        dispatch({
          type: draft?.rows?.length ? ACTIONS.MERGE_ROWS : ACTIONS.RESTORE_ROWS,
          rows,
        });
      } catch {
        // Recovery is a convenience. A failure leaves a clean dialog.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [campaignId, enabled, kind, pollRow, recoveryMappingIdentity, recoveryReady]);

  useEffect(() => {
    pendingRecoveryPolls.current.forEach((pending, rowId) => {
      const row = state.rows.find((entry) => entry.id === rowId);
      if (!row) return;
      if (
        row.extractionId !== pending.extractionId ||
        row.contextVersion !== pending.contextVersion ||
        !isRowActive(row)
      ) {
        pendingRecoveryPolls.current.delete(rowId);
        return;
      }

      // The reducer row and the context ref now agree. Only now can a reused
      // result be read and receive a fresh receipt for this admin.
      contextVersions.current.set(rowId, pending.contextVersion);
      pendingRecoveryPolls.current.delete(rowId);
      pollRow(rowId, pending.extractionId, pending.contextVersion);
    });
  }, [pollRow, state.rows]);

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
    setCreator,
    setSource,
    fetchRow,
    cancelRow,
    removeRow,
    applySaveResult,
    completeSuccessfulSave,
  };
}
