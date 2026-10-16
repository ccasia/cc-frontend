import { it, expect, describe } from 'vitest';

import {
  delta,
  dueText,
  timeline,
  formatRate,
  ownerLabel,
  buildStages,
  compactNumber,
} from './stages';

const today = new Date(2026, 9, 2);

const midCampaign = {
  campaign: { startDate: '2026-09-24', endDate: '2026-10-07', postingEndDate: '2026-10-07' },
  credits: { total: 10, used: 6, unallocated: 4 },
  shortlist: { confirmed: 4, contractPending: 2, waitingOnClient: 3, waitingSince: '2026-09-29' },
  submissions: {
    submissionVersion: 'v4',
    approved: 2,
    inReview: 2,
    revision: 1,
    withAdmins: 0,
    notSubmitted: 1,
    nextDueAt: '2026-10-03',
  },
  logistics: {
    enabled: true,
    type: 'PRODUCT_DELIVERY',
    productsSetUp: true,
    delivered: 4,
    inTransit: 1,
    awaitingAssignment: 1,
    issues: 0,
    total: 6,
  },
  posts: { live: 3, pending: 2, total: 6 },
};

const earlyCampaign = {
  campaign: { startDate: '2026-10-01', endDate: '2026-10-14' },
  credits: { total: 10, used: 0, unallocated: 10 },
  shortlist: { confirmed: 0, contractPending: 0, waitingOnClient: 3, waitingSince: null },
  submissions: { approved: 0, inReview: 0, revision: 0, withAdmins: 0, notSubmitted: 0 },
  logistics: {
    enabled: true,
    productsSetUp: false,
    delivered: 0,
    inTransit: 0,
    awaitingAssignment: 0,
    issues: 0,
    total: 0,
  },
  posts: { live: 0, pending: 0, total: 0 },
};

describe('buildStages, mid campaign', () => {
  const [shortlist, submissions, logistics, analytics] = buildStages(midCampaign, today);

  it('matches the design table', () => {
    expect([shortlist, submissions, logistics, analytics].map((s) => [s.stat, s.tone])).toEqual([
      ['6/10', 'warn'],
      ['2/6', 'warn'],
      ['4/6', 'bad'],
      ['3/6', 'ok'],
    ]);
  });

  it('builds actions with owners and due dates', () => {
    expect(shortlist.action).toMatchObject({ text: 'Review 3 new creators', owner: 'client' });
    expect(dueText(shortlist.action.dueAt, today)).toBe('Due Oct 2');
    expect(submissions.action).toMatchObject({ text: 'Approve 2 drafts', dueAt: '2026-10-03' });
    expect(logistics.action).toMatchObject({ text: 'Confirm 1 shipping address', owner: 'admin' });
    expect(analytics.note).toBe('On track · posting window ends Oct 7');
  });

  it('drops empty segments', () => {
    expect(submissions.segments.map((s) => s.label)).toEqual([
      'approved',
      'in review',
      'revision',
      'not submitted',
    ]);
  });
});

describe('buildStages, early campaign', () => {
  const [shortlist, submissions, logistics, analytics] = buildStages(earlyCampaign, today);

  it('shows setup and idle states', () => {
    expect(shortlist).toMatchObject({ stat: '0/10', tone: 'warn' });
    expect(shortlist.action.text).toBe('Review 3 creator pitches');
    expect(shortlist.action.dueAt).toBeNull();
    expect(submissions).toMatchObject({ stat: '—', statLabel: 'no drafts yet', tone: 'idle' });
    expect(logistics).toMatchObject({ stat: '0/0', pill: 'Setup needed', tone: 'warn' });
    expect(analytics).toMatchObject({ stat: '0', tone: 'idle' });
  });
});

describe('credit totals', () => {
  it.each([10, 20, 100])('scales progress for %i credits', (total) => {
    const [shortlist] = buildStages(
      { ...midCampaign, credits: { total, used: total / 2, unallocated: total / 2 } },
      today
    );
    expect(shortlist.progress).toBe(50);
  });
});

describe('ownerLabel', () => {
  it('shows You for the viewer and the other party otherwise', () => {
    expect(ownerLabel('client', 'client')).toBe('You');
    expect(ownerLabel('admin', 'client')).toBe('Campaign team');
    expect(ownerLabel('client', 'admin')).toBe('Brand');
    expect(ownerLabel('admin', 'admin')).toBe('You');
  });
});

describe('helpers', () => {
  it('marks past due dates as overdue', () => {
    expect(dueText('2026-10-01', today)).toBe('Overdue · Oct 1');
  });

  it('counts campaign days inclusively', () => {
    expect(timeline({ startDate: '2026-09-24', endDate: '2026-10-07' }, today)).toEqual({
      day: 9,
      totalDays: 14,
      progress: 64,
    });
  });

  it('formats numbers and deltas', () => {
    expect(compactNumber(48200)).toBe('48.2K');
    expect(compactNumber(null)).toBe('—');
    expect(delta(112, 100)).toBe(12);
    expect(delta(5, 0)).toBeNull();
  });

  it('formats engagement rates, capping outliers', () => {
    expect(formatRate(0.35)).toBe('0.35%');
    expect(formatRate(4.6)).toBe('4.6%');
    expect(formatRate(444)).toBe('>100%');
    expect(formatRate(null)).toBe('—');
  });
});
