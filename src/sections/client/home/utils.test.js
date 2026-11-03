import { it, expect, describe } from 'vitest';

import {
  dueLabel,
  nameList,
  reviewTab,
  initialOf,
  groupTasks,
  latestPost,
  postsByDay,
  countPosted,
  periodLabel,
  periodPhrase,
  periodWindow,
  campaignThumb,
  sortCampaigns,
  presetCovering,
  campaignStages,
  openTaskCounts,
  creditBreakdown,
  periodShortLabel,
  periodShortPhrase,
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

describe('countPosted', () => {
  const now = new Date(2026, 9, 12, 12);
  const campaign = {
    postedAt: [new Date(2026, 9, 12, 9), new Date(2026, 9, 8), new Date(2026, 8, 1)],
  };
  const count = (period) => countPosted(campaign, periodWindow(period, now));

  it('counts posts inside a rolling preset, or all posts', () => {
    expect(count({ value: '1' })).toBe(1);
    expect(count({ value: '7' })).toBe(2);
    expect(count({ value: 'all' })).toBe(3);
    expect(countPosted({}, periodWindow({ value: '7' }, now))).toBe(0);
  });

  it('leaves out posts dated after now, in presets and all time', () => {
    const future = { postedAt: [new Date(2026, 9, 12, 9), new Date(2026, 9, 20)] };
    expect(countPosted(future, periodWindow({ value: '7' }, now), now)).toBe(1);
    expect(countPosted(future, periodWindow({ value: 'all' }, now), now)).toBe(1);
  });

  it('accepts epoch-ms times from the API', () => {
    const fromApi = { postedAt: [new Date(2026, 9, 12, 9).getTime()] };
    expect(countPosted(fromApi, periodWindow({ value: '1' }, now), now)).toBe(1);
  });

  it('includes both whole end days of a custom range', () => {
    const period = { value: 'custom', from: new Date(2026, 9, 8), to: new Date(2026, 9, 12) };
    expect(count(period)).toBe(2);
    expect(periodLabel(period)).toBe('8 Oct – 12 Oct 2026');
  });

  it('names a one-day range once', () => {
    const day = new Date(2026, 9, 8);
    expect(periodLabel({ value: 'custom', from: day, to: day })).toBe('8 Oct 2026');
  });

  it('phrases a period to follow a post count', () => {
    const day = new Date(2026, 9, 8);
    expect(periodPhrase({ value: '7' })).toBe('in the past 7 days');
    expect(periodPhrase({ value: 'custom', from: day, to: day })).toBe('on 8 Oct 2026');
    expect(periodPhrase({ value: 'custom', from: day, to: new Date(2026, 9, 12) })).toBe(
      'from 8 Oct – 12 Oct 2026'
    );
  });
});

describe('periodShortPhrase', () => {
  const now = new Date(2026, 10, 3);

  it('reads after a count', () => {
    expect(periodShortPhrase({ value: '7' }, now)).toBe('in the past 7 days');
    expect(
      periodShortPhrase({ value: 'custom', from: new Date(2026, 9, 1), to: new Date(2026, 9, 31) }, now)
    ).toBe('in 1–31 Oct');
    expect(
      periodShortPhrase({ value: 'custom', from: new Date(2026, 9, 8), to: new Date(2026, 9, 8) }, now)
    ).toBe('on 8 Oct');
  });
});

describe('periodShortLabel', () => {
  const now = new Date(2026, 10, 3);
  const custom = (from, to) => ({ value: 'custom', from, to });

  it('keeps presets as they are', () => {
    expect(periodShortLabel({ value: '7' }, now)).toBe('Past 7 days');
  });

  it('shortens ranges in this year', () => {
    expect(periodShortLabel(custom(new Date(2026, 10, 1), new Date(2026, 10, 3)), now)).toBe('1–3 Nov');
    expect(periodShortLabel(custom(new Date(2026, 9, 30), new Date(2026, 10, 3)), now)).toBe(
      '30 Oct–3 Nov'
    );
    expect(periodShortLabel(custom(new Date(2026, 9, 8), new Date(2026, 9, 8)), now)).toBe('8 Oct');
  });

  it('keeps the year for other years', () => {
    expect(periodShortLabel(custom(new Date(2025, 11, 30), new Date(2026, 0, 2)), now)).toBe(
      '30 Dec 2025 – 2 Jan 2026'
    );
    expect(periodShortLabel(custom(new Date(2025, 2, 1), new Date(2025, 2, 5)), now)).toBe(
      '1–5 Mar 2025'
    );
  });
});

describe('latestPost and presetCovering', () => {
  const now = new Date(2026, 9, 12, 12);

  it('finds the newest post across campaigns', () => {
    const campaigns = [
      { postedAt: [new Date(2026, 9, 1)] },
      { postedAt: [new Date(2026, 9, 3)] },
      {},
    ];
    expect(latestPost(campaigns)).toEqual(new Date(2026, 9, 3));
    expect(latestPost([{}])).toBeNull();
    expect(latestPost([{ postedAt: [new Date(2026, 9, 1), new Date(2026, 9, 20)] }], now)).toEqual(
      new Date(2026, 9, 1)
    );
  });

  it('suggests the smallest preset that reaches the date', () => {
    expect(presetCovering(new Date(2026, 9, 1), now).value).toBe('14');
    expect(presetCovering(new Date(2026, 6, 1), now)).toBeNull();
    expect(presetCovering(null, now)).toBeNull();
  });
});

describe('postsByDay', () => {
  it('groups posts by day and campaign, busiest campaign first', () => {
    const days = postsByDay([
      { id: 'a', name: 'A', image: ['a.jpg'], postedAt: [new Date(2026, 9, 5, 9)] },
      {
        id: 'b',
        name: 'B',
        logo: 'b.png',
        postedAt: [new Date(2026, 9, 5, 10), new Date(2026, 9, 5, 18), new Date(2026, 9, 6)],
      },
    ]);
    expect(days.get('2026-10-05')).toEqual([
      { id: 'b', name: 'B', thumb: 'b.png', count: 2 },
      { id: 'a', name: 'A', thumb: 'a.jpg', count: 1 },
    ]);
    expect(days.get('2026-10-06')).toHaveLength(1);
    expect(days.has('2026-10-07')).toBe(false);
  });

  it('leaves out days in the future', () => {
    const days = postsByDay(
      [{ id: 'a', name: 'A', postedAt: [new Date(2026, 9, 5), new Date(2026, 9, 20)] }],
      new Date(2026, 9, 12)
    );
    expect([...days.keys()]).toEqual(['2026-10-05']);
  });

  it('lists up to two names, then a count', () => {
    expect(nameList(['A', 'B'])).toBe('A and B');
    expect(nameList(['A', 'B', 'C'])).toBe('A, B and 1 other');
    expect(nameList(['A', 'B', 'C', 'D'])).toBe('A, B and 2 others');
  });
});

describe('campaignThumb and initialOf', () => {
  it('uses the first image, then the logo', () => {
    expect(campaignThumb({ image: ['a.jpg', 'b.jpg'], logo: 'l.png' })).toBe('a.jpg');
    expect(campaignThumb({ image: [], logo: 'l.png' })).toBe('l.png');
    expect(campaignThumb({ image: '' })).toBeNull();
  });

  it('skips emoji and symbols to find a letter', () => {
    expect(initialOf('🎬 brand day')).toBe('B');
    expect(initialOf('ブランド')).toBe('ブ');
    expect(initialOf('#1 launch')).toBe('1');
    expect(initialOf('🎬')).toBe('');
    expect(initialOf(undefined)).toBe('');
  });
});
