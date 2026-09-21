import { it, expect, describe, beforeEach } from 'vitest';

import { createRow, ROW_STATUS } from './creator-row-machine';
import { buildGuestPayload } from './automatic-creator-scrape-dialog';
import {
  forgetRow,
  readMapping,
  rememberRow,
  clearMapping,
  reconcileMapping,
} from './extraction-session-store';

const CAMPAIGN = 'campaign-1';

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('refresh recovery keeps the row to extraction mapping', () => {
  it('remembers a row and reads it back', () => {
    rememberRow(CAMPAIGN, 'row-1', {
      extractionId: 'ext-1',
      profileLink: 'https://www.instagram.com/a',
    });
    expect(readMapping(CAMPAIGN)).toEqual({
      'row-1': { extractionId: 'ext-1', profileLink: 'https://www.instagram.com/a' },
    });
  });

  it('never stores a receipt', () => {
    rememberRow(CAMPAIGN, 'row-1', {
      extractionId: 'ext-1',
      profileLink: 'x',
      completionReceipt: 'secret',
    });
    expect(JSON.stringify(readMapping(CAMPAIGN))).not.toContain('secret');
  });

  it('forgets a row when its link changes or it is removed', () => {
    rememberRow(CAMPAIGN, 'row-1', { extractionId: 'ext-1', profileLink: 'x' });
    forgetRow(CAMPAIGN, 'row-1');
    expect(readMapping(CAMPAIGN)).toEqual({});
  });

  it('keeps campaigns apart', () => {
    rememberRow(CAMPAIGN, 'row-1', { extractionId: 'ext-1', profileLink: 'x' });
    expect(readMapping('campaign-2')).toEqual({});
  });

  it('clears everything after a successful save', () => {
    rememberRow(CAMPAIGN, 'row-1', { extractionId: 'ext-1', profileLink: 'x' });
    clearMapping(CAMPAIGN);
    expect(readMapping(CAMPAIGN)).toEqual({});
  });

  it('survives corrupt storage', () => {
    window.sessionStorage.setItem(`cc.guestExtraction.${CAMPAIGN}`, 'not json');
    expect(readMapping(CAMPAIGN)).toEqual({});
  });
});

describe('recovery trusts the server, not the browser', () => {
  const mapping = {
    'row-1': { extractionId: 'ext-1', profileLink: 'a' },
    'row-2': { extractionId: 'ext-2', profileLink: 'b' },
    'row-3': { extractionId: 'ext-gone', profileLink: 'c' },
  };

  it('drops any row the server does not return', () => {
    const kept = reconcileMapping(mapping, [
      { id: 'ext-1', status: 'POLLING' },
      { id: 'ext-2', status: 'READY' },
    ]);

    expect(Object.keys(kept)).toEqual(['row-1', 'row-2']);
    expect(kept['row-1'].status).toBe('POLLING');
  });

  it('keeps nothing when the server returns nothing', () => {
    expect(reconcileMapping(mapping, [])).toEqual({});
  });
});

describe('the request body carries reviewed values, never raw actor data', () => {
  const readyRow = () =>
    createRow({
      status: ROW_STATUS.READY,
      profileLink: 'https://instagram.com/example/?hl=en',
      canonicalProfileUrl: 'https://www.instagram.com/example',
      canonicalProfileKey: 'instagram:example',
      name: 'Cult Creative',
      followerCount: '128400',
      engagementRate: '6.45',
      extractionId: 'ext-1',
      completionReceipt: 'receipt-abc',
      sampleSize: 5,
      selectedPosts: [{ postId: 'a' }],
    });

  it('sends the canonical link, the receipt, and the reviewed values', () => {
    const [payload] = buildGuestPayload([readyRow()]);

    expect(payload.profileLink).toBe('https://www.instagram.com/example');
    expect(payload.completionReceipt).toBe('receipt-abc');
    expect(payload.extractionId).toBe('ext-1');
    expect(payload.engagementRate).toBe('6.45');
  });

  it('sends no selected posts, no sample size, and no platform', () => {
    const [payload] = buildGuestPayload([readyRow()]);
    const keys = Object.keys(payload);

    expect(keys).not.toContain('selectedPosts');
    expect(keys).not.toContain('sampleSize');
    expect(keys).not.toContain('platform');
    expect(JSON.stringify(payload)).not.toMatch(/apify|actorId|actorBuild|likes|views/i);
  });

  it('sends a confirmed fallback with its reason', () => {
    const row = createRow({
      status: ROW_STATUS.INSUFFICIENT_DATA,
      profileLink: 'https://www.tiktok.com/@x',
      canonicalProfileUrl: 'https://www.tiktok.com/@x',
      name: 'Creator',
      followerCount: '9120',
      fallbackReason: 'INSUFFICIENT_DATA',
      fallbackConfirmed: true,
    });
    const [payload] = buildGuestPayload([row]);

    expect(payload.fallbackReason).toBe('INSUFFICIENT_DATA');
    expect(payload.fallbackConfirmed).toBe(true);
    expect(payload.completionReceipt).toBeUndefined();
    expect(payload.engagementRate).toBeUndefined();
  });
});
