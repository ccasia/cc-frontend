import { it, vi, expect, describe, beforeEach, afterEach } from 'vitest';

import { createRow, ROW_STATUS } from './creator-row-machine';
import {
  DRAFT_KIND,
  DRAFT_TTL_MS,
  readDraft,
  writeDraft,
  clearDraft,
  toDraftRow,
  toDraftRows,
  persistOpenDraft,
  stampDraftExpiry,
  withKeptFirstId,
  isScrapedDraftRow,
  toDraftCreator,
} from './creator-draft-store';

const CAMPAIGN = 'campaign-1';

const readyRow = (overrides = {}) =>
  createRow({
    status: ROW_STATUS.READY,
    profileLink: 'https://www.instagram.com/example',
    name: 'Cult Creative',
    followerCount: '128400',
    engagementRate: '6.45',
    extractionId: 'ext-1',
    completionReceipt: 'receipt-abc',
    fetched: { name: 'Cult Creative', followerCount: '128400', engagementRate: '6.45' },
    ...overrides,
  });

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('which rows belong in a draft', () => {
  it('keeps a READY scrape', () => {
    expect(isScrapedDraftRow(readyRow())).toBe(true);
  });

  it('keeps a confirmed fallback with a name and a follower count', () => {
    expect(
      isScrapedDraftRow(
        createRow({
          status: ROW_STATUS.INSUFFICIENT_DATA,
          name: 'Creator',
          followerCount: '9120',
          fallbackReason: 'INSUFFICIENT_DATA',
          fallbackConfirmed: true,
        })
      )
    ).toBe(true);
  });

  it('drops an idle row', () => {
    expect(isScrapedDraftRow(createRow())).toBe(false);
  });

  it('drops idle extra rows when building the snapshot', () => {
    const rows = toDraftRows([readyRow(), createRow()]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Cult Creative');
  });

  it('honours skipDraftRow so a media-kit row is not stored', () => {
    const kit = readyRow({ id: 'kit' });
    const scraped = readyRow({ id: 'scraped', name: 'Bare' });
    const rows = toDraftRows([kit, scraped], (row) => row.id === 'kit');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('scraped');
  });
});

describe('the creator snapshot', () => {
  it('keeps the Autocomplete fields and drops unknown ones', () => {
    const creator = toDraftCreator({
      id: 'u-1',
      name: 'Bare Creator',
      email: 'bare@example.com',
      photoURL: 'https://img',
      extra: { nested: true },
      creator: {
        isFormCompleted: true,
        instagramUser: null,
        tiktokUser: null,
      },
    });
    expect(creator).toEqual({
      id: 'u-1',
      name: 'Bare Creator',
      email: 'bare@example.com',
      photoURL: 'https://img',
      creator: { isFormCompleted: true, instagramUser: null, tiktokUser: null },
    });
    expect(creator.extra).toBeUndefined();
  });
});

describe('session keys stay apart', () => {
  it('does not let guest and platform overwrite each other', () => {
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [readyRow({ name: 'Guest' })]);
    persistOpenDraft(DRAFT_KIND.PLATFORM, CAMPAIGN, [readyRow({ name: 'Platform' })]);
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN).rows[0].name).toBe('Guest');
    expect(readDraft(DRAFT_KIND.PLATFORM, CAMPAIGN).rows[0].name).toBe('Platform');
  });

  it('keeps campaigns apart', () => {
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [readyRow()]);
    expect(readDraft(DRAFT_KIND.GUEST, 'campaign-2')).toBeNull();
  });
});

describe('open persist and close expiry', () => {
  it('writes rows with no TTL while the modal is open', () => {
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [readyRow()]);
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN).expiresAt).toBeNull();
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN).rows[0].completionReceipt).toBe('receipt-abc');
  });

  it('clears the draft when nothing scraped remains', () => {
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [readyRow()]);
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [createRow()]);
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN)).toBeNull();
  });

  it('stamps a 1-minute expiry on close', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T00:00:00.000Z'));
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [readyRow()]);
    stampDraftExpiry(DRAFT_KIND.GUEST, CAMPAIGN);
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN).expiresAt).toBe(
      Date.now() + DRAFT_TTL_MS
    );
  });

  it('returns the rows before the minute is up', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T00:00:00.000Z'));
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [readyRow()]);
    stampDraftExpiry(DRAFT_KIND.GUEST, CAMPAIGN);
    vi.setSystemTime(new Date('2026-09-08T00:00:59.000Z'));
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN).rows[0].name).toBe('Cult Creative');
  });

  it('clears after a minute and the next read is empty', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T00:00:00.000Z'));
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [readyRow()]);
    stampDraftExpiry(DRAFT_KIND.GUEST, CAMPAIGN);
    vi.setSystemTime(new Date('2026-09-08T00:01:00.000Z'));
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN)).toBeNull();
    expect(window.sessionStorage.getItem(`cc.creatorDraft.guest.${CAMPAIGN}`)).toBeNull();
  });

  it('clearDraft drops the snapshot after Add Creator', () => {
    persistOpenDraft(DRAFT_KIND.GUEST, CAMPAIGN, [readyRow()]);
    clearDraft(DRAFT_KIND.GUEST, CAMPAIGN);
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN)).toBeNull();
  });
});

describe('corrupt storage', () => {
  it('survives junk JSON', () => {
    window.sessionStorage.setItem(`cc.creatorDraft.guest.${CAMPAIGN}`, 'not json');
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN)).toBeNull();
  });

  it('rejects a payload without rows', () => {
    writeDraft(DRAFT_KIND.GUEST, CAMPAIGN, { v: 1, expiresAt: null, rows: [] });
    expect(readDraft(DRAFT_KIND.GUEST, CAMPAIGN)).toBeNull();
  });
});

describe('withKeptFirstId', () => {
  it('rewrites only the first row id', () => {
    const rows = [toDraftRow(readyRow({ id: 'old-1' })), toDraftRow(readyRow({ id: 'old-2' }))];
    const kept = withKeptFirstId(rows, 'live-1');
    expect(kept[0].id).toBe('live-1');
    expect(kept[1].id).toBe('old-2');
  });
});
