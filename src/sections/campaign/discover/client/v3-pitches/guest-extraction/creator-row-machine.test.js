import { it, expect, describe } from 'vitest';

import {
  ACTIONS,
  MAX_ROWS,
  createRow,
  ROW_STATUS,
  canFetchRow,
  canSubmitRow,
  isOverridden,
  METRIC_SOURCE,
  metricSourceOf,
  ACTIVE_STATUSES,
  duplicateRowIds,
  submittableRows,
  BATCH_SAVE_STATUS,
  fieldProvenanceOf,
  createInitialState,
  hasSafeFollowerCount,
  creatorRowReducer as reduce,
} from './creator-row-machine';

const run = (state, ...actions) => actions.reduce(reduce, state);
const only = (state) => state.rows[0];

const start = () => {
  const state = createInitialState();
  return { state, rowId: state.rows[0].id };
};

const validated = () => {
  const { state, rowId } = start();
  return {
    rowId,
    state: run(
      state,
      { type: ACTIONS.SET_LINK, rowId, value: 'https://www.instagram.com/example/' },
      {
        type: ACTIONS.VALIDATION_RESULT,
        rowId,
        ok: true,
        canonicalProfileUrl: 'https://www.instagram.com/example',
        canonicalProfileKey: 'instagram:example',
        platform: 'instagram',
      }
    ),
  };
};

const ready = () => {
  const { state, rowId } = validated();
  return {
    rowId,
    state: run(
      state,
      { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'ext-1' },
      { type: ACTIONS.EXTRACTION_RUNNING, rowId },
      { type: ACTIONS.EXTRACTION_POLLING, rowId },
      {
        type: ACTIONS.EXTRACTION_READY,
        rowId,
        name: 'Cult Creative',
        followerCount: '128400',
        engagementRate: '6.45',
        completionReceipt: 'receipt-abc',
        sampleSize: 5,
        fetchedAt: '2026-09-03T00:00:00.000Z',
      }
    ),
  };
};

describe('rows and the batch stay separate', () => {
  it('starts with one idle row and an idle batch', () => {
    const state = createInitialState();
    expect(state.rows).toHaveLength(1);
    expect(only(state).status).toBe(ROW_STATUS.IDLE);
    expect(state.batchSaveState).toBe(BATCH_SAVE_STATUS.IDLE);
  });

  it('resets back to one empty idle row', () => {
    // The dialog is never unmounted, so reopening it relies on this action to
    // clear the creator that was just added.
    const { state: filled } = validated();
    const state = run(filled, { type: ACTIONS.ADD_ROW });
    expect(state.rows).toHaveLength(2);
    expect(only(state).profileLink).not.toBe('');

    // Keep the first row's id so reopening the dialog does not remount it
    // and play the enter animation.
    const reset = run(state, { type: ACTIONS.RESET });
    const stripIds = (value) => ({ ...value, rows: value.rows.map(({ id, ...rest }) => rest) });
    expect(stripIds(reset)).toEqual(stripIds(createInitialState()));
    expect(reset.rows).toHaveLength(1);
    expect(only(reset).id).toBe(only(state).id);
    expect(only(reset).profileLink).toBe('');
  });

  it('carries a platform creator, and leaves guest rows without one', () => {
    // A guest row must stay exactly as it was: the name comes from the scrape.
    expect(only(createInitialState()).creator).toBeNull();

    const { state, rowId } = start();
    const picked = { id: 'user-1', name: 'Yuvi' };
    const withCreator = run(state, { type: ACTIONS.SET_CREATOR, rowId, creator: picked });
    expect(only(withCreator).creator).toEqual(picked);

    // Clearing the dropdown clears the row, and never leaves undefined behind.
    const cleared = run(withCreator, { type: ACTIONS.SET_CREATOR, rowId, creator: null });
    expect(only(cleared).creator).toBeNull();
  });

  it('lets the admin set a platform when there is no link to derive one from', () => {
    const { state, rowId } = start();
    const picked = run(state, { type: ACTIONS.SET_PLATFORM, rowId, platform: 'tiktok' });
    expect(only(picked).platform).toBe('tiktok');
  });

  it('does not disturb the scrape when the creator changes', () => {
    // The link is what was measured, not the creator. Swapping the dropdown
    // must not silently discard a fetched result.
    const { state, rowId } = ready();
    const before = only(state);
    const after = only(run(state, { type: ACTIONS.SET_CREATOR, rowId, creator: { id: 'u2' } }));

    expect(after.status).toBe(before.status);
    expect(after.profileLink).toBe(before.profileLink);
    expect(after.engagementRate).toBe(before.engagementRate);
    expect(after.completionReceipt).toBe(before.completionReceipt);
  });

  it('never puts a saving state on a row', () => {
    const { state, rowId } = ready();
    const saving = run(state, { type: ACTIONS.BATCH_SAVE_STARTED });

    expect(saving.batchSaveState).toBe(BATCH_SAVE_STATUS.SAVING);
    expect(saving.rows.find((r) => r.id === rowId).status).toBe(ROW_STATUS.READY);
    expect(Object.values(ROW_STATUS)).not.toContain('SAVING');
  });

  it('tracks batch save success and failure', () => {
    const state = createInitialState();
    expect(run(state, { type: ACTIONS.BATCH_SAVE_SUCCEEDED }).batchSaveState).toBe(
      BATCH_SAVE_STATUS.SAVED
    );
    const failed = run(state, { type: ACTIONS.BATCH_SAVE_FAILED, error: 'boom' });
    expect(failed.batchSaveState).toBe(BATCH_SAVE_STATUS.SAVE_FAILED);
    expect(failed.batchError).toBe('boom');
  });
});

describe('rows can be added and removed', () => {
  it('allows at most three rows', () => {
    let state = createInitialState();
    for (let i = 0; i < 5; i += 1) state = reduce(state, { type: ACTIONS.ADD_ROW });
    expect(state.rows).toHaveLength(MAX_ROWS);
  });

  it.each([
    ['active', [{ type: ACTIONS.FETCH_REQUESTED, extractionId: 'ext-1' }]],
    [
      'failed',
      [
        {
          type: ACTIONS.EXTRACTION_FAILED,
          error: { code: 'TIMED_OUT', message: 'x', retryable: true },
        },
      ],
    ],
    [
      'cancelled',
      [
        { type: ACTIONS.FETCH_REQUESTED, extractionId: 'e' },
        { type: ACTIONS.EXTRACTION_CANCELLED },
      ],
    ],
  ])('removes a %s row', (_label, steps) => {
    const { state, rowId } = validated();
    const withSteps = run(state, ...steps.map((s) => ({ ...s, rowId })));
    expect(reduce(withSteps, { type: ACTIONS.REMOVE_ROW, rowId }).rows).toHaveLength(0);
  });

  it('marks the extraction of a removed row stale', () => {
    const { state, rowId } = ready();
    expect(reduce(state, { type: ACTIONS.REMOVE_ROW, rowId }).staleExtractionIds).toEqual([
      'ext-1',
    ]);
  });
});

describe('validation never starts paid work', () => {
  it('moves to VALIDATING on a link change and back to IDLE on success', () => {
    const { state } = validated();
    const row = only(state);
    expect(row.status).toBe(ROW_STATUS.IDLE);
    expect(row.platform).toBe('instagram');
    expect(row.canonicalProfileKey).toBe('instagram:example');
  });

  it('never reaches QUEUED without an explicit fetch', () => {
    const { state } = validated();
    expect(ACTIVE_STATUSES).not.toContain(only(state).status);
    expect(only(state).extractionId).toBeNull();
  });

  it('records a link error and clears the derived platform', () => {
    const { state, rowId } = start();
    const next = run(
      state,
      { type: ACTIONS.SET_LINK, rowId, value: 'https://www.instagram.com/p/C9/' },
      {
        type: ACTIONS.VALIDATION_RESULT,
        rowId,
        ok: false,
        error: { code: 'NOT_A_PROFILE_URL', message: 'no' },
      }
    );
    expect(only(next).linkError.code).toBe('NOT_A_PROFILE_URL');
    expect(only(next).platform).toBeNull();
    expect(canFetchRow(only(next))).toBe(false);
  });

  it('ignores a late validation result for a link that changed again', () => {
    const { state, rowId } = validated();
    const stale = run(state, {
      type: ACTIONS.VALIDATION_RESULT,
      rowId,
      ok: false,
      error: { code: 'X', message: 'late' },
    });
    expect(only(stale).linkError).toBeNull();
  });

  it('goes back to IDLE when the link is cleared', () => {
    const { state, rowId } = validated();
    const cleared = run(state, { type: ACTIONS.SET_LINK, rowId, value: '' });
    expect(only(cleared).status).toBe(ROW_STATUS.IDLE);
  });
});

describe('extraction lifecycle', () => {
  it('runs IDLE to QUEUED to RUNNING to POLLING to READY', () => {
    const { state } = ready();
    const row = only(state);
    expect(row.status).toBe(ROW_STATUS.READY);
    expect(row.sampleSize).toBe(5);
    expect(row.completionReceipt).toBe('receipt-abc');
    expect(row.fetched).toEqual({
      name: 'Cult Creative',
      followerCount: '128400',
      engagementRate: '6.45',
    });
  });

  it('keeps the link visible while work runs', () => {
    const { state, rowId } = validated();
    const queued = run(state, { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'e' });
    expect(only(queued).profileLink).toBe('https://www.instagram.com/example/');
  });

  it('does not move a finished row back into an active state', () => {
    const { state, rowId } = ready();
    const late = run(state, { type: ACTIONS.EXTRACTION_RUNNING, rowId });
    expect(only(late).status).toBe(ROW_STATUS.READY);
  });

  it('sets INSUFFICIENT_DATA with a permitted fallback reason', () => {
    const { state, rowId } = validated();
    const next = run(
      state,
      { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'e' },
      { type: ACTIONS.EXTRACTION_INSUFFICIENT, rowId, validCount: 4 }
    );
    expect(only(next).status).toBe(ROW_STATUS.INSUFFICIENT_DATA);
    expect(only(next).fallbackReason).toBe('INSUFFICIENT_DATA');
  });

  it.each(['PRIVATE_PROFILE', 'PROFILE_NOT_FOUND'])(
    'allows a fallback after a %s failure',
    (code) => {
      const { state, rowId } = validated();
      const next = run(
        state,
        { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'e' },
        { type: ACTIONS.EXTRACTION_FAILED, rowId, error: { code, message: 'x', retryable: false } }
      );
      expect(only(next).status).toBe(ROW_STATUS.FAILED);
      expect(only(next).fallbackReason).toBe(code);
    }
  );

  it.each(['PROVIDER_SCHEMA_CHANGED', 'AUTH_FAILED', 'COST_LIMIT', 'TIMED_OUT', 'TRANSIENT'])(
    'offers no fallback after a %s failure',
    (code) => {
      const { state, rowId } = validated();
      const next = run(
        state,
        { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'e' },
        { type: ACTIONS.EXTRACTION_FAILED, rowId, error: { code, message: 'x', retryable: true } }
      );
      expect(only(next).fallbackReason).toBeNull();
      expect(canSubmitRow(only(next))).toBe(false);
    }
  );
});

describe('an in-flight scrape can be submitted', () => {
  it('is eligible once an extractionId exists', () => {
    const { state, rowId } = validated();
    const next = run(
      state,
      { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'ext-1' },
      { type: ACTIONS.EXTRACTION_POLLING, rowId }
    );
    expect(canSubmitRow(only(next))).toBe(true);
  });

  it('is not eligible while the link is still validating', () => {
    const { state } = validated();
    expect(only(state).status).toBe(ROW_STATUS.IDLE);
    expect(canSubmitRow(only(state))).toBe(false);

    const validating = run(state, {
      type: ACTIONS.SET_LINK,
      rowId: only(state).id,
      value: 'https://www.instagram.com/other/',
    });
    expect(only(validating).status).toBe(ROW_STATUS.VALIDATING);
    expect(canSubmitRow(only(validating))).toBe(false);
  });
});

describe('cancellation', () => {
  it('cancels an active row without making it eligible', () => {
    const { state, rowId } = validated();
    const next = run(
      state,
      { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'e' },
      { type: ACTIONS.EXTRACTION_POLLING, rowId },
      { type: ACTIONS.EXTRACTION_CANCELLED, rowId }
    );
    expect(only(next).status).toBe(ROW_STATUS.CANCELLED);
    expect(only(next).fallbackReason).toBeNull();
    expect(only(next).completionReceipt).toBeNull();
    expect(canSubmitRow(only(next))).toBe(false);
  });

  it('does not cancel a row that already finished', () => {
    const { state, rowId } = ready();
    expect(only(run(state, { type: ACTIONS.EXTRACTION_CANCELLED, rowId })).status).toBe(
      ROW_STATUS.READY
    );
  });

  it('allows a retry after a cancel', () => {
    const { state, rowId } = validated();
    const cancelled = run(
      state,
      { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'e' },
      { type: ACTIONS.EXTRACTION_CANCELLED, rowId }
    );
    expect(canFetchRow(only(cancelled))).toBe(true);
  });
});

describe('a link change clears everything the result produced', () => {
  it('clears values, receipt, extraction, and fallback confirmation', () => {
    const { state, rowId } = ready();
    const edited = run(state, {
      type: ACTIONS.SET_LINK,
      rowId,
      value: 'https://www.instagram.com/other/',
    });
    const row = only(edited);

    expect(row.name).toBe('');
    expect(row.followerCount).toBe('');
    expect(row.engagementRate).toBe('');
    expect(row.completionReceipt).toBeNull();
    expect(row.extractionId).toBeNull();
    expect(row.fetched).toBeNull();
    expect(row.fallbackConfirmed).toBe(false);
    expect(row.fallbackReason).toBeNull();
    expect(row.sampleSize).toBeNull();
    expect(row.status).toBe(ROW_STATUS.VALIDATING);
    expect(row.profileLink).toBe('https://www.instagram.com/other/');
  });

  it('marks the old extraction stale for the server', () => {
    const { state, rowId } = ready();
    const edited = run(state, {
      type: ACTIONS.SET_LINK,
      rowId,
      value: 'https://www.instagram.com/other/',
    });
    expect(edited.staleExtractionIds).toEqual(['ext-1']);

    const acked = run(edited, { type: ACTIONS.STALE_ACKNOWLEDGED, ids: ['ext-1'] });
    expect(acked.staleExtractionIds).toEqual([]);
  });

  it('makes a stale row impossible to submit', () => {
    const { state, rowId } = ready();
    const staled = run(state, { type: ACTIONS.MARK_STALE, rowId });
    expect(only(staled).status).toBe(ROW_STATUS.STALE);
    expect(only(staled).completionReceipt).toBeNull();
    expect(canSubmitRow(only(staled))).toBe(false);
  });
});

describe('editing a fetched value', () => {
  it('keeps the row eligible and keeps the receipt', () => {
    const { state, rowId } = ready();
    const edited = run(state, {
      type: ACTIONS.EDIT_FIELD,
      rowId,
      field: 'engagementRate',
      value: '5.10',
    });

    expect(canSubmitRow(only(edited))).toBe(true);
    expect(only(edited).completionReceipt).toBe('receipt-abc');
  });

  it('labels an edited row as a manual override', () => {
    const { state, rowId } = ready();
    expect(metricSourceOf(only(state))).toBe(METRIC_SOURCE.AUTOMATIC);

    const edited = run(state, {
      type: ACTIONS.EDIT_FIELD,
      rowId,
      field: 'followerCount',
      value: '999',
    });
    expect(metricSourceOf(only(edited))).toBe(METRIC_SOURCE.MANUAL_OVERRIDE);
    expect(isOverridden(only(edited))).toBe(true);
  });

  it('keeps the fetched baseline for the audit record', () => {
    const { state, rowId } = ready();
    const edited = run(
      state,
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'name', value: 'Cult Creative MY' },
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'engagementRate', value: '5.10' }
    );
    expect(only(edited).fetched).toEqual({
      name: 'Cult Creative',
      followerCount: '128400',
      engagementRate: '6.45',
    });
    expect(only(edited).name).toBe('Cult Creative MY');
  });

  it('marks unchanged fetched fields as extracted and changed ones as edited', () => {
    const { state, rowId } = ready();
    const row = only(state);

    expect(fieldProvenanceOf(row, 'name')).toBe('extracted');
    expect(fieldProvenanceOf(row, 'followerCount')).toBe('extracted');
    expect(fieldProvenanceOf(row, 'engagementRate')).toBe('extracted');

    const edited = run(state, {
      type: ACTIONS.EDIT_FIELD,
      rowId,
      field: 'name',
      value: 'Cult Creative MY',
    });
    const next = only(edited);

    expect(fieldProvenanceOf(next, 'name')).toBe('edited');
    expect(fieldProvenanceOf(next, 'followerCount')).toBe('extracted');
    expect(fieldProvenanceOf(next, 'engagementRate')).toBe('extracted');
  });

  it('marks a hand-typed value with no fetch as edited', () => {
    const row = createRow({ name: 'Manual Name' });
    expect(fieldProvenanceOf(row, 'name')).toBe('edited');
    expect(fieldProvenanceOf(row, 'followerCount')).toBeNull();
  });
});

describe('manual fallback', () => {
  const insufficient = () => {
    const { state, rowId } = validated();
    return {
      rowId,
      state: run(
        state,
        { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'e' },
        { type: ACTIONS.EXTRACTION_INSUFFICIENT, rowId, validCount: 3 }
      ),
    };
  };

  it('needs an explicit confirmation, a name, and a follower count', () => {
    const { state, rowId } = insufficient();
    expect(canSubmitRow(only(state))).toBe(false);

    const named = run(
      state,
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'name', value: 'Creator' },
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'followerCount', value: '9120' }
    );
    expect(canSubmitRow(only(named))).toBe(false);

    const confirmed = run(named, { type: ACTIONS.CONFIRM_FALLBACK, rowId, confirmed: true });
    expect(canSubmitRow(only(confirmed))).toBe(true);
  });

  it('allows a blank engagement rate and reports it as unavailable', () => {
    const { state, rowId } = insufficient();
    const confirmed = run(
      state,
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'name', value: 'Creator' },
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'followerCount', value: '9120' },
      { type: ACTIONS.CONFIRM_FALLBACK, rowId, confirmed: true }
    );
    expect(only(confirmed).engagementRate).toBe('');
    expect(metricSourceOf(only(confirmed))).toBe(METRIC_SOURCE.UNAVAILABLE);
  });

  it('marks an entered fallback rate as manual, never automatic', () => {
    const { state, rowId } = insufficient();
    const confirmed = run(
      state,
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'name', value: 'Creator' },
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'followerCount', value: '9120' },
      { type: ACTIONS.EDIT_FIELD, rowId, field: 'engagementRate', value: '3.20' },
      { type: ACTIONS.CONFIRM_FALLBACK, rowId, confirmed: true }
    );
    expect(metricSourceOf(only(confirmed))).toBe(METRIC_SOURCE.MANUAL_OVERRIDE);
    expect(only(confirmed).completionReceipt).toBeNull();
  });

  it('cannot be confirmed for a reason that is not permitted', () => {
    const { state, rowId } = validated();
    const failed = run(
      state,
      { type: ACTIONS.FETCH_REQUESTED, rowId, extractionId: 'e' },
      {
        type: ACTIONS.EXTRACTION_FAILED,
        rowId,
        error: { code: 'COST_LIMIT', message: 'x', retryable: false },
      },
      { type: ACTIONS.CONFIRM_FALLBACK, rowId, confirmed: true }
    );
    expect(only(failed).fallbackConfirmed).toBe(false);
    expect(canSubmitRow(only(failed))).toBe(false);
  });

  it.each([
    ['blank', ''],
    ['zero', '0'],
    ['negative', '-5'],
    ['decimal', '10.5'],
    ['text', 'many'],
    ['above the maximum', '10000000001'],
  ])('rejects a %s follower count', (_label, followerCount) => {
    expect(hasSafeFollowerCount(followerCount)).toBe(false);
  });

  it('accepts a plain positive integer follower count', () => {
    expect(hasSafeFollowerCount('9120')).toBe(true);
    expect(hasSafeFollowerCount('10000000000')).toBe(true);
  });
});

describe('duplicates and mixed batches', () => {
  it('finds duplicates by canonical key, not by typed text', () => {
    const rows = [
      createRow({ id: 'a', canonicalProfileKey: 'instagram:example' }),
      createRow({ id: 'b', canonicalProfileKey: 'instagram:example' }),
      createRow({ id: 'c', canonicalProfileKey: 'tiktok:example' }),
      createRow({ id: 'd', canonicalProfileKey: null }),
    ];
    expect(duplicateRowIds(rows)).toEqual(['a', 'b']);
  });

  it('blocks a duplicate row from fetching and from submitting', () => {
    const base = {
      status: ROW_STATUS.READY,
      completionReceipt: 'r',
      canonicalProfileKey: 'instagram:example',
    };
    const rows = [createRow({ id: 'a', ...base }), createRow({ id: 'b', ...base })];
    const duplicateIds = duplicateRowIds(rows);

    rows.forEach((row) => {
      expect(canSubmitRow(row, { duplicateIds })).toBe(false);
      expect(canFetchRow(row, { duplicateIds })).toBe(false);
    });
  });

  it('submits only the eligible rows of a mixed batch', () => {
    const state = {
      batchSaveState: BATCH_SAVE_STATUS.IDLE,
      batchError: null,
      staleExtractionIds: [],
      rows: [
        createRow({
          id: 'ready',
          status: ROW_STATUS.READY,
          completionReceipt: 'r',
          canonicalProfileKey: 'instagram:a',
        }),
        createRow({
          id: 'fallback',
          status: ROW_STATUS.INSUFFICIENT_DATA,
          fallbackReason: 'INSUFFICIENT_DATA',
          fallbackConfirmed: true,
          name: 'Creator',
          followerCount: '9120',
          canonicalProfileKey: 'tiktok:b',
        }),
        createRow({
          id: 'ready-no-receipt',
          status: ROW_STATUS.READY,
          canonicalProfileKey: 'instagram:c',
        }),
        createRow({ id: 'failed', status: ROW_STATUS.FAILED, canonicalProfileKey: 'instagram:d' }),
        createRow({
          id: 'cancelled',
          status: ROW_STATUS.CANCELLED,
          canonicalProfileKey: 'instagram:e',
        }),
        createRow({ id: 'stale', status: ROW_STATUS.STALE, canonicalProfileKey: 'instagram:f' }),
        createRow({ id: 'active', status: ROW_STATUS.POLLING, canonicalProfileKey: 'instagram:g' }),
        createRow({
          id: 'unconfirmed',
          status: ROW_STATUS.INSUFFICIENT_DATA,
          fallbackReason: 'INSUFFICIENT_DATA',
          name: 'X',
          followerCount: '10',
          canonicalProfileKey: 'instagram:h',
        }),
        createRow({
          id: 'invalid',
          status: ROW_STATUS.IDLE,
          linkError: { code: 'X', message: 'x' },
        }),
      ],
    };

    expect(submittableRows(state).map((row) => row.id)).toEqual(['ready', 'fallback']);
  });

  it('never marks a row without a receipt as automatic', () => {
    const row = createRow({ id: 'x', status: ROW_STATUS.READY, completionReceipt: null });
    expect(metricSourceOf(row)).toBe(METRIC_SOURCE.UNAVAILABLE);
  });
});

describe('refresh recovery', () => {
  it('restores rows from a saved mapping', () => {
    const restored = reduce(createInitialState(), {
      type: ACTIONS.RESTORE_ROWS,
      rows: [
        {
          profileLink: 'https://www.instagram.com/example/',
          extractionId: 'ext-9',
          status: ROW_STATUS.POLLING,
        },
      ],
    });
    expect(restored.rows).toHaveLength(1);
    expect(restored.rows[0].extractionId).toBe('ext-9');
    expect(restored.rows[0].status).toBe(ROW_STATUS.POLLING);
    expect(restored.rows[0].completionReceipt).toBeNull();
  });

  it('merges an in-flight row onto a draft without dropping it', () => {
    const drafted = reduce(createInitialState(), {
      type: ACTIONS.RESTORE_ROWS,
      rows: [
        {
          id: 'row-ready',
          status: ROW_STATUS.READY,
          name: 'Kept',
          completionReceipt: 'receipt-abc',
        },
      ],
    });
    const merged = reduce(drafted, {
      type: ACTIONS.MERGE_ROWS,
      rows: [
        {
          id: 'row-polling',
          profileLink: 'https://www.instagram.com/other/',
          extractionId: 'ext-2',
          status: ROW_STATUS.POLLING,
        },
      ],
    });
    expect(merged.rows).toHaveLength(2);
    expect(merged.rows[0]).toMatchObject({ id: 'row-ready', name: 'Kept', status: ROW_STATUS.READY });
    expect(merged.rows[1]).toMatchObject({ id: 'row-polling', status: ROW_STATUS.POLLING });
  });
});
