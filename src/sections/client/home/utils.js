import { format, differenceInCalendarDays } from 'date-fns';

import { STATUS_CHIP } from 'src/sections/campaign/discover/admin/creator-submissions/utils/constants';

// Reserved for things waiting on the client; everything else uses theme colours.
export const ACTION_BLUE = '#1A3DFF';

// Same colours as the admin submission status chips.
export const STATUS_COLOR = {
  late: STATUS_CHIP.CHANGES_REQUIRED.color,
  review: STATUS_CHIP.PENDING_REVIEW.color,
  done: STATUS_CHIP.APPROVED.color,
  active: STATUS_CHIP.IN_PROGRESS.color,
};

export const FONTS = {
  serif: '"Instrument Serif", Georgia, serif',
  tight: '"Inter Tight", Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
};

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const daysUntil = (date, today = new Date()) =>
  differenceInCalendarDays(new Date(date), today);

export function dueLabel(days, date) {
  if (days < 0) return { text: `Overdue by ${plural(-days, 'day')}`, tone: 'late' };
  if (days === 0) return { text: 'Due today', tone: 'soon' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'soon' };
  return {
    text: `Due ${format(new Date(date), 'd MMM')} · in ${days} days`,
    tone: days <= 3 ? 'soon' : 'normal',
  };
}

export function groupTasks(tasks, today = new Date()) {
  const sorted = tasks
    .map((task) => ({ ...task, days: daysUntil(task.dueAt, today) }))
    .sort((a, b) => a.days - b.days);

  return [
    { key: 'overdue', label: 'Overdue', tasks: sorted.filter((t) => t.days < 0) },
    { key: 'week', label: 'This week', tasks: sorted.filter((t) => t.days >= 0 && t.days <= 7) },
    { key: 'later', label: 'Later', tasks: sorted.filter((t) => t.days > 7) },
  ].filter((group) => group.tasks.length);
}

export function creditBreakdown({ total = 0, assigned = 0, used = 0 } = {}) {
  return {
    total,
    used,
    reserved: Math.max(0, assigned - used),
    free: Math.max(0, total - assigned),
  };
}

export const isComplete = (campaign) => campaign.stage >= 3 || campaign.status === 'COMPLETED';

const percent = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export function campaignStages(campaign) {
  const { shortlist, submissions, posting } = campaign;
  const inReview = Math.max(0, submissions.received - submissions.approved);
  // const complete = isComplete(campaign);

  const rows = [
    { label: 'Confirmed', n: shortlist.confirmed, d: shortlist.total, inReview: 0 },
    { label: 'Review', n: submissions.approved, d: posting.total, inReview },
    { label: 'Posting', n: posting.posted, d: posting.total, inReview: 0 },
    // { label: 'Report', n: complete ? 1 : 0, d: 1, inReview: 0, text: complete ? 'Ready' : '—' },
  ];

  return rows.map((row, index) => {
    let state = 'todo';
    if (index < campaign.stage) state = 'done';
    else if (index === campaign.stage) state = 'current';

    return {
      ...row,
      state,
      count: row.text || `${row.n}/${row.d}`,
      pct: percent(row.n, row.d),
      pctWithReview: percent(row.n + row.inReview, row.d),
    };
  });
}

export const openTaskCounts = (tasks) =>
  tasks.reduce(
    (map, task) => map.set(task.campaignId, (map.get(task.campaignId) || 0) + 1),
    new Map()
  );

export const CAMPAIGN_TABS = [
  { value: 'all', label: 'All', test: () => true },
  { value: 'action', label: 'Needs action', test: (c, open) => (open.get(c.id) || 0) > 0 },
  { value: 'active', label: 'Active', test: (c) => !isComplete(c) },
  { value: 'completed', label: 'Completed', test: (c) => isComplete(c) },
];

// Campaigns waiting on the client first, finished ones last, then by nearest end date.
export function sortCampaigns(campaigns, open) {
  const needsAction = (c) => ((open.get(c.id) || 0) > 0 ? 1 : 0);
  return [...campaigns].sort(
    (a, b) =>
      needsAction(b) - needsAction(a) ||
      Number(isComplete(a)) - Number(isComplete(b)) ||
      new Date(a.endDate) - new Date(b.endDate)
  );
}

// Campaign detail tab that holds the review screen for a task.
export function reviewTab(task, campaign) {
  if (task.type === 'SHORTLIST_REVIEW') return 'creator-master-list';
  return campaign?.submissionVersion === 'v4' ? 'submissions-v4' : 'deliverables';
}

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
