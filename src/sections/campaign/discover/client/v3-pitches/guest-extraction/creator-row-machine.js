/**
 * Row and batch state for the automatic creator scrape dialog.
 *
 * Pure. No React, no network, no timers. The dialog in step 7 drives this
 * reducer; every rule below is testable on its own.
 *
 * Extraction state belongs to a row. Saving state belongs to the batch. The
 * two never mix.
 */

export const ROW_STATUS = {
  IDLE: 'IDLE',
  VALIDATING: 'VALIDATING',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  POLLING: 'POLLING',
  READY: 'READY',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  STALE: 'STALE',
};

export const BATCH_SAVE_STATUS = {
  IDLE: 'IDLE',
  SAVING: 'SAVING',
  SAVED: 'SAVED',
  SAVE_FAILED: 'SAVE_FAILED',
};

export const METRIC_SOURCE = {
  AUTOMATIC: 'automatic',
  MANUAL_OVERRIDE: 'manual_override',
  UNAVAILABLE: 'unavailable',
};

/** Work is running. The row cannot be submitted and cannot be re-fetched. */
export const ACTIVE_STATUSES = [
  ROW_STATUS.VALIDATING,
  ROW_STATUS.QUEUED,
  ROW_STATUS.RUNNING,
  ROW_STATUS.POLLING,
];

/** Only these outcomes may offer a manual fallback. */
export const ALLOWED_FALLBACK_REASONS = [
  'INSUFFICIENT_DATA',
  'PRIVATE_PROFILE',
  'PROFILE_NOT_FOUND',
];

export const MAX_ROWS = 3;

/** Matches the backend guard in campaignController.shortlistGuestCreators. */
export const MAX_FOLLOWER_COUNT = 10_000_000_000;

export const ACTIONS = {
  RESET: 'RESET',
  ADD_ROW: 'ADD_ROW',
  SET_CREATOR: 'SET_CREATOR',
  SET_PLATFORM: 'SET_PLATFORM',
  REMOVE_ROW: 'REMOVE_ROW',
  SET_LINK: 'SET_LINK',
  VALIDATION_RESULT: 'VALIDATION_RESULT',
  FETCH_REQUESTED: 'FETCH_REQUESTED',
  EXTRACTION_RUNNING: 'EXTRACTION_RUNNING',
  EXTRACTION_POLLING: 'EXTRACTION_POLLING',
  EXTRACTION_READY: 'EXTRACTION_READY',
  EXTRACTION_INSUFFICIENT: 'EXTRACTION_INSUFFICIENT',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  EXTRACTION_CANCELLED: 'EXTRACTION_CANCELLED',
  MARK_STALE: 'MARK_STALE',
  EDIT_FIELD: 'EDIT_FIELD',
  SET_COMMENTS: 'SET_COMMENTS',
  CONFIRM_FALLBACK: 'CONFIRM_FALLBACK',
  RESTORE_ROWS: 'RESTORE_ROWS',
  MERGE_ROWS: 'MERGE_ROWS',
  STALE_ACKNOWLEDGED: 'STALE_ACKNOWLEDGED',
  BATCH_SAVE_STARTED: 'BATCH_SAVE_STARTED',
  BATCH_SAVE_SUCCEEDED: 'BATCH_SAVE_SUCCEEDED',
  BATCH_SAVE_FAILED: 'BATCH_SAVE_FAILED',
};

let rowSeq = 0;

export function createRow(overrides = {}) {
  rowSeq += 1;
  return {
    id: `row-${rowSeq}`,
    /**
     * The platform creator this row is about, or null.
     *
     * Null on every guest row: a guest has no account yet, so the name comes
     * from the scrape instead. The Add Platform Creators modal sets it from its
     * dropdown, and the row then scrapes a link for a creator who already
     * exists.
     */
    creator: null,
    profileLink: '',
    canonicalProfileUrl: null,
    canonicalProfileKey: null,
    platform: null,
    status: ROW_STATUS.IDLE,
    name: '',
    followerCount: '',
    engagementRate: '',
    adminComments: '',
    extractionId: null,
    completionReceipt: null,
    sampleSize: null,
    fetchedAt: null,
    /** The posts the rate was built from. Shown in the breakdown tooltip. */
    selectedPosts: null,
    formulaVersion: null,
    /** The values the receipt attests to. Editing never changes this. */
    fetched: null,
    fallbackConfirmed: false,
    fallbackReason: null,
    /** Link validation failure. Separate from an extraction error. */
    linkError: null,
    /** Extraction failure. */
    error: null,
    ...overrides,
  };
}

export function createInitialState() {
  return {
    rows: [createRow()],
    batchSaveState: BATCH_SAVE_STATUS.IDLE,
    batchError: null,
    staleExtractionIds: [],
  };
}

/* ----------------------------------------------------------------- helpers */

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

export function hasSafeFollowerCount(value) {
  if (typeof value === 'number')
    return Number.isSafeInteger(value) && value > 0 && value <= MAX_FOLLOWER_COUNT;
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return false;
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= MAX_FOLLOWER_COUNT;
}

export const isAllowedFallbackReason = (reason) => ALLOWED_FALLBACK_REASONS.includes(reason);

export const hasValidReceipt = (row) =>
  typeof row.completionReceipt === 'string' && row.completionReceipt.length > 0;

export const isRowActive = (row) => ACTIVE_STATUSES.includes(row.status);

/**
 * Clear everything a result produced. The link and the CS comment stay.
 * Used by a link change and by an explicit re-fetch.
 */
function clearResult(row) {
  return {
    ...row,
    name: '',
    followerCount: '',
    engagementRate: '',
    extractionId: null,
    completionReceipt: null,
    sampleSize: null,
    fetchedAt: null,
    selectedPosts: null,
    formulaVersion: null,
    fetched: null,
    fallbackConfirmed: false,
    fallbackReason: null,
    error: null,
  };
}

function mapRow(state, rowId, update) {
  return { ...state, rows: state.rows.map((row) => (row.id === rowId ? update(row) : row)) };
}

/* --------------------------------------------------------------- selectors */

/** Metric provenance for one row. Never automatic without a receipt. */
export function metricSourceOf(row) {
  if (row.status === ROW_STATUS.READY && hasValidReceipt(row)) {
    const edited =
      !row.fetched ||
      row.followerCount !== row.fetched.followerCount ||
      row.engagementRate !== row.fetched.engagementRate;
    return edited ? METRIC_SOURCE.MANUAL_OVERRIDE : METRIC_SOURCE.AUTOMATIC;
  }
  if (isAllowedFallbackReason(row.fallbackReason) && row.fallbackConfirmed) {
    return hasText(row.engagementRate) ? METRIC_SOURCE.MANUAL_OVERRIDE : METRIC_SOURCE.UNAVAILABLE;
  }
  return METRIC_SOURCE.UNAVAILABLE;
}

/** True when the admin changed a value the receipt attests to. */
export function isOverridden(row) {
  if (!row.fetched) return false;
  return (
    row.name !== row.fetched.name ||
    row.followerCount !== row.fetched.followerCount ||
    row.engagementRate !== row.fetched.engagementRate
  );
}

const hasFieldValue = (value) => {
  if (typeof value === 'string') return value.trim().length > 0;
  return value != null && value !== '';
};

/**
 * Per-field label suffix for fetched metric inputs.
 *
 * - `extracted` — Apify filled this field and the admin left it alone
 * - `edited` — the admin typed or changed the value
 * - `null` — nothing to show yet (empty, not fetched)
 */
export function fieldProvenanceOf(row, field) {
  if (row.fetched) {
    if (row[field] !== row.fetched[field]) return 'edited';
    return hasFieldValue(row[field]) ? 'extracted' : null;
  }
  return hasFieldValue(row[field]) ? 'edited' : null;
}

/** Row IDs whose canonical key appears more than once in the batch. */
export function duplicateRowIds(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    if (!row.canonicalProfileKey) return;
    counts.set(row.canonicalProfileKey, (counts.get(row.canonicalProfileKey) ?? 0) + 1);
  });
  return rows
    .filter((row) => row.canonicalProfileKey && counts.get(row.canonicalProfileKey) > 1)
    .map((row) => row.id);
}

/**
 * The eligibility rule. The server applies the same one.
 *
 * A READY row with an edited value keeps its receipt and takes the audit
 * override path. It stays eligible.
 */
export function canSubmitRow(row, { duplicateIds = [] } = {}) {
  if (duplicateIds.includes(row.id)) return false;
  if (row.linkError) return false;

  if (row.status === ROW_STATUS.READY && hasValidReceipt(row)) return true;

  return (
    isAllowedFallbackReason(row.fallbackReason) &&
    row.fallbackConfirmed === true &&
    hasText(row.name) &&
    hasSafeFollowerCount(row.followerCount)
  );
}

export function submittableRows(state) {
  const duplicateIds = duplicateRowIds(state.rows);
  return state.rows.filter((row) => canSubmitRow(row, { duplicateIds }));
}

/** True when the row may start paid work. */
export function canFetchRow(row, { duplicateIds = [] } = {}) {
  if (isRowActive(row)) return false;
  if (row.linkError || !row.canonicalProfileKey) return false;
  return !duplicateIds.includes(row.id);
}

/* ----------------------------------------------------------------- reducer */

export function creatorRowReducer(state, action) {
  switch (action.type) {
    // Back to one empty row. The dialog stays mounted after it closes, so
    // reopening it must start clean rather than show the creator just added.
    case ACTIONS.RESET: {
      // Keep the first row's id. A new id would remount the row in
      // AnimatePresence and play the enter animation as the dialog opens.
      const keepId = state.rows[0]?.id;
      return {
        rows: [createRow(keepId ? { id: keepId } : {})],
        batchSaveState: BATCH_SAVE_STATUS.IDLE,
        batchError: null,
        staleExtractionIds: [],
      };
    }

    case ACTIONS.ADD_ROW:
      return state.rows.length >= MAX_ROWS
        ? state
        : { ...state, rows: [...state.rows, createRow()] };

    // Every row stays removable, including a failed, cancelled, or active one.
    case ACTIONS.REMOVE_ROW: {
      const removed = state.rows.find((row) => row.id === action.rowId);
      const rows = state.rows.filter((row) => row.id !== action.rowId);
      return {
        ...state,
        rows,
        staleExtractionIds: removed?.extractionId
          ? [...state.staleExtractionIds, removed.extractionId]
          : state.staleExtractionIds,
      };
    }

    // A link change clears the result, the receipt, and the fallback

    // confirmation, and marks the old extraction stale for the server.
    case ACTIONS.SET_LINK: {
      const previous = state.rows.find((row) => row.id === action.rowId);
      const staleExtractionIds =
        previous?.extractionId && previous.profileLink !== action.value
          ? [...state.staleExtractionIds, previous.extractionId]
          : state.staleExtractionIds;

      return mapRow({ ...state, staleExtractionIds }, action.rowId, (row) => ({
        ...clearResult(row),
        profileLink: action.value,
        canonicalProfileUrl: null,
        canonicalProfileKey: null,
        platform: null,
        linkError: null,
        status: action.value.trim() ? ROW_STATUS.VALIDATING : ROW_STATUS.IDLE,
      }));
    }

    // Debounced validation only. It never starts paid work.
    case ACTIONS.VALIDATION_RESULT:
      return mapRow(state, action.rowId, (row) => {
        if (row.status !== ROW_STATUS.VALIDATING) return row;
        return action.ok
          ? {
              ...row,
              status: ROW_STATUS.IDLE,
              canonicalProfileUrl: action.canonicalProfileUrl,
              canonicalProfileKey: action.canonicalProfileKey,
              platform: action.platform,
              linkError: null,
            }
          : {
              ...row,
              status: ROW_STATUS.IDLE,
              canonicalProfileUrl: null,
              canonicalProfileKey: null,
              platform: null,
              linkError: action.error ?? {
                code: 'INVALID_URL',
                message: 'This link is not valid.',
              },
            };
      });

    case ACTIONS.FETCH_REQUESTED:
      return mapRow(state, action.rowId, (row) => ({
        ...clearResult(row),
        status: ROW_STATUS.QUEUED,
        extractionId: action.extractionId ?? null,
      }));

    case ACTIONS.EXTRACTION_RUNNING:
      return mapRow(state, action.rowId, (row) =>
        isRowActive(row) ? { ...row, status: ROW_STATUS.RUNNING } : row
      );

    case ACTIONS.EXTRACTION_POLLING:
      return mapRow(state, action.rowId, (row) =>
        isRowActive(row) ? { ...row, status: ROW_STATUS.POLLING } : row
      );

    case ACTIONS.EXTRACTION_READY:
      return mapRow(state, action.rowId, (row) => {
        const fetched = {
          name: action.name ?? '',
          followerCount: action.followerCount ?? '',
          engagementRate: action.engagementRate ?? '',
        };
        return {
          ...row,
          status: ROW_STATUS.READY,
          ...fetched,
          fetched,
          completionReceipt: action.completionReceipt ?? null,
          sampleSize: action.sampleSize ?? null,
          fetchedAt: action.fetchedAt ?? null,
          selectedPosts: action.selectedPosts ?? null,
          formulaVersion: action.formulaVersion ?? null,
          fallbackReason: null,
          fallbackConfirmed: false,
          error: null,
        };
      });

    case ACTIONS.EXTRACTION_INSUFFICIENT:
      return mapRow(state, action.rowId, (row) => ({
        ...clearResult(row),
        status: ROW_STATUS.INSUFFICIENT_DATA,
        extractionId: row.extractionId,
        sampleSize: action.validCount ?? null,
        fallbackReason: 'INSUFFICIENT_DATA',
      }));

    // Only a private profile or a profile that does not exist may fall back.
    // A schema, auth, cost, timeout, or transient failure offers retry instead.
    case ACTIONS.EXTRACTION_FAILED:
      return mapRow(state, action.rowId, (row) => ({
        ...clearResult(row),
        status: ROW_STATUS.FAILED,
        extractionId: row.extractionId,
        error: action.error ?? { code: 'UNKNOWN', message: 'The fetch failed.', retryable: true },
        fallbackReason: isAllowedFallbackReason(action.error?.code) ? action.error.code : null,
      }));

    // Stopping the wait never makes a row eligible.
    case ACTIONS.EXTRACTION_CANCELLED:
      return mapRow(state, action.rowId, (row) =>
        isRowActive(row) ? { ...clearResult(row), status: ROW_STATUS.CANCELLED } : row
      );

    case ACTIONS.MARK_STALE:
      return mapRow(state, action.rowId, (row) => ({
        ...clearResult(row),
        status: ROW_STATUS.STALE,
      }));

    /**
     * Pick the platform creator for this row.
     *
     * The scrape is untouched. Changing the creator does not invalidate a link
     * that was already fetched, because the link is what was measured, not the
     * creator; the modal clears the link itself when that is what it wants.
     */
    case ACTIONS.SET_CREATOR:
      return mapRow(state, action.rowId, (row) => ({ ...row, creator: action.creator ?? null }));

    /**
     * The platform this row is about.
     *
     * A validated link sets this on its own, and that reading wins because the
     * link is the thing measured. This action is for the case with no link:
     * a creator with a connected account, where the admin still picks.
     */
    case ACTIONS.SET_PLATFORM:
      return mapRow(state, action.rowId, (row) => ({ ...row, platform: action.platform ?? null }));

    case ACTIONS.EDIT_FIELD:
      return mapRow(state, action.rowId, (row) => ({ ...row, [action.field]: action.value }));

    case ACTIONS.SET_COMMENTS:
      return mapRow(state, action.rowId, (row) => ({ ...row, adminComments: action.value }));

    case ACTIONS.CONFIRM_FALLBACK:
      return mapRow(state, action.rowId, (row) =>
        isAllowedFallbackReason(row.fallbackReason)
          ? { ...row, fallbackConfirmed: action.confirmed === true }
          : row
      );

    case ACTIONS.RESTORE_ROWS:
      return { ...state, rows: action.rows.map((row) => createRow(row)) };

    // In-flight recovery onto a draft. Existing scraped rows stay.
    case ACTIONS.MERGE_ROWS: {
      const byId = new Map(state.rows.map((row) => [row.id, row]));
      (action.rows ?? []).forEach((row) => {
        byId.set(row.id, createRow(row));
      });
      return { ...state, rows: Array.from(byId.values()).slice(0, MAX_ROWS) };
    }

    case ACTIONS.STALE_ACKNOWLEDGED:
      return {
        ...state,
        staleExtractionIds: state.staleExtractionIds.filter((id) => !action.ids.includes(id)),
      };

    case ACTIONS.BATCH_SAVE_STARTED:
      return { ...state, batchSaveState: BATCH_SAVE_STATUS.SAVING, batchError: null };

    case ACTIONS.BATCH_SAVE_SUCCEEDED:
      return { ...state, batchSaveState: BATCH_SAVE_STATUS.SAVED, batchError: null };

    case ACTIONS.BATCH_SAVE_FAILED:
      return {
        ...state,
        batchSaveState: BATCH_SAVE_STATUS.SAVE_FAILED,
        batchError: action.error ?? null,
      };

    default:
      return state;
  }
}
