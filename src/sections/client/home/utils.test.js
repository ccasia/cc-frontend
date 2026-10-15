import { it, expect, describe } from 'vitest';

import {
  dueLabel,
  reviewTab,
  groupTasks,
  sortCampaigns,
  campaignStages,
  openTaskCounts,
  creditBreakdown,
} from './utils';

const today = new Date(2026, 9, 12);

describe('dueLabel', () => {
  it('describes overdue, today, tomorrow and later', () => {
    expect(dueLabel(-2).text).toBe('Overdue by 2 days');
    expect(dueLabel(0).text).toBe('Due today');
    expect(dueLabel(1).tone).toBe('soon');
    expect(dueLabel(5, new Date(2026, 9, 17))).toEqual({
      text: 'Due 17 Oct · in 5 days',
      tone: 'normal',
    });
  });
});

describe('groupTasks', () => {
  it('buckets by due date and drops empty groups', () => {
    const groups = groupTasks(
      [
        { id: 'a', dueAt: new Date(2026, 9, 30) },
        { id: 'b', dueAt: new Date(2026, 9, 11) },
        { id: 'c', dueAt: new Date(2026, 9, 14) },
      ],
      today
    );
    expect(groups.map((g) => [g.key, g.tasks.map((t) => t.id)])).toEqual([
      ['overdue', ['b']],
      ['week', ['c']],
      ['later', ['a']],
    ]);
  });
});

describe('creditBreakdown', () => {
  it('derives free from the package and reserved from assigned minus used', () => {
    expect(creditBreakdown({ total: 50, assigned: 47, used: 27 })).toEqual({
      total: 50,
      used: 27,
      reserved: 20,
      free: 3,
    });
  });

  it('never goes negative when campaigns are over-assigned', () => {
    expect(creditBreakdown({ total: 10, assigned: 12, used: 0 }).free).toBe(0);
  });
});

describe('campaignStages', () => {
  it('marks stages before, at and after the current one', () => {
    const rows = campaignStages({
      stage: 1,
      shortlist: { confirmed: 5, total: 5 },
      submissions: { received: 3, approved: 1 },
      posting: { posted: 0, total: 6 },
    });
    expect(rows.map((r) => r.state)).toEqual(['done', 'current', 'todo', 'todo']);
    expect(rows[1]).toMatchObject({ count: '1/6', pct: 17, pctWithReview: 50 });
    expect(rows[3].count).toBe('—');
  });
});

describe('sortCampaigns', () => {
  it('puts campaigns with open tasks first and completed ones last', () => {
    const campaigns = [
      { id: 'done', stage: 3, endDate: '2026-09-01' },
      { id: 'quiet', stage: 1, endDate: '2026-10-20' },
      { id: 'busy', stage: 1, endDate: '2026-12-01' },
    ];
    const open = openTaskCounts([{ campaignId: 'busy' }]);
    expect(sortCampaigns(campaigns, open).map((c) => c.id)).toEqual(['busy', 'quiet', 'done']);
  });
});

describe('reviewTab', () => {
  it('sends shortlist tasks to the master list and content to the right submissions tab', () => {
    expect(reviewTab({ type: 'SHORTLIST_REVIEW' })).toBe('creator-master-list');
    expect(reviewTab({ type: 'CONTENT_REVIEW' }, { submissionVersion: 'v4' })).toBe(
      'submissions-v4'
    );
    expect(reviewTab({ type: 'CONTENT_REVIEW' }, {})).toBe('deliverables');
  });
});
