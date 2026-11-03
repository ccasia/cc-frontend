import { format, endOfDay, isSameDay, startOfDay, differenceInCalendarDays } from 'date-fns';

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

// Hairline outside a logo's white border, so white or transparent logos keep an edge.
export const LOGO_RING = '0 0 0 1px rgba(18, 18, 20, 0.16)';

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
  {
    value: 'all',
    label: 'All',
    empty: {
      icon: 'solar:case-round-linear',
      title: 'No campaigns yet',
      body: 'Your campaigns show here once they start.',
    },
    test: () => true,
  },
  {
    value: 'action',
    label: 'Needs action',
    empty: {
      icon: 'solar:check-circle-linear',
      tone: STATUS_COLOR.done,
      title: 'You’re all caught up',
      body: 'No campaign is waiting on you. New approvals show here when creators send them.',
    },
    test: (c, open) => (open.get(c.id) || 0) > 0,
  },
  {
    value: 'active',
    label: 'Active',
    empty: {
      icon: 'solar:play-circle-linear',
      title: 'No active campaigns',
      body: 'Campaigns that are still running show here.',
    },
    test: (c) => !isComplete(c),
  },
  {
    value: 'completed',
    label: 'Completed',
    empty: {
      icon: 'solar:archive-check-linear',
      title: 'No completed campaigns yet',
      body: 'Campaigns move here when they finish.',
    },
    test: (c) => isComplete(c),
  },
];

export const POSTED_RANGES = [
  { value: '1', label: 'Past 1 day', short: '1 day', days: 1 },
  { value: '7', label: 'Past 7 days', short: '7 days', days: 7 },
  { value: '14', label: 'Past 14 days', short: '14 days', days: 14 },
  { value: '30', label: 'Past 30 days', short: '30 days', days: 30 },
  { value: 'all', label: 'All time', short: 'All time', days: null },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// Presets are rolling (Past 1 day = last 24 hours) and stop at now; a custom range covers whole days.
export function periodWindow(period, now = new Date()) {
  if (period.value === 'custom') return { from: startOfDay(period.from), to: endOfDay(period.to) };
  const { days } = POSTED_RANGES.find((r) => r.value === period.value);
  return days ? { from: new Date(now.getTime() - days * DAY_MS), to: now } : null;
}

export function periodLabel(period) {
  if (period.value !== 'custom') return POSTED_RANGES.find((r) => r.value === period.value).label;
  if (isSameDay(period.from, period.to)) return format(period.from, 'd MMM yyyy');
  const sameYear = period.from.getFullYear() === period.to.getFullYear();
  return `${format(period.from, sameYear ? 'd MMM' : 'd MMM yyyy')} – ${format(period.to, 'd MMM yyyy')}`;
}

// Compact range for tight spots: "1–3 Nov", "30 Oct–3 Nov", the year only when it isn't this year.
export function periodShortLabel(period, now = new Date()) {
  if (period.value !== 'custom') return periodLabel(period);
  const { from, to } = period;
  const year = from.getFullYear() === now.getFullYear() && to.getFullYear() === now.getFullYear() ? '' : ' yyyy';
  if (isSameDay(from, to)) return format(from, `d MMM${year}`);
  if (from.getFullYear() !== to.getFullYear()) return `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;
  if (from.getMonth() === to.getMonth()) return `${format(from, 'd')}–${format(to, `d MMM${year}`)}`;
  return `${format(from, 'd MMM')}–${format(to, `d MMM${year}`)}`;
}

// Short form of periodPhrase for the card: "in the past 7 days", "on 8 Oct", "in 1–3 Nov".
export function periodShortPhrase(period, now = new Date()) {
  if (period.value !== 'custom') return periodPhrase(period);
  return `${isSameDay(period.from, period.to) ? 'on' : 'in'} ${periodShortLabel(period, now)}`;
}

// Reads after a count: "2 posts in the past 7 days", "on 8 Oct 2026", "from 8 Oct – 12 Oct 2026".
export function periodPhrase(period) {
  if (period.value !== 'custom') return `in the ${periodLabel(period).toLowerCase()}`;
  return `${isSameDay(period.from, period.to) ? 'on' : 'from'} ${periodLabel(period)}`;
}

// A post dated in the future (clock skew) has not gone live yet.
const pastPosts = (campaign, now) =>
  (campaign.postedAt ?? []).map((date) => new Date(date)).filter((date) => date <= now);

export function countPosted(campaign, window, now = new Date()) {
  const dates = pastPosts(campaign, now);
  if (!window) return dates.length;
  return dates.filter((date) => date >= window.from && date <= window.to).length;
}

export const dayKey = (date) => format(date, 'yyyy-MM-dd');

export const campaignThumb = (campaign) => {
  const image = Array.isArray(campaign.image) ? campaign.image[0] : campaign.image;
  return (typeof image === 'string' && image) || campaign.logo || null;
};

// First letter or digit, so names that start with an emoji or symbol still get a readable initial.
export const initialOf = (name) => name?.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? '';

// Map of 'yyyy-MM-dd' -> campaigns that posted that day, busiest first.
export function postsByDay(campaigns, now = new Date()) {
  const days = new Map();
  campaigns.forEach((campaign) =>
    pastPosts(campaign, now).forEach((date) => {
      const key = dayKey(date);
      const list = days.get(key) ?? [];
      const entry = list.find((e) => e.id === campaign.id);
      if (entry) entry.count += 1;
      else
        list.push({
          id: campaign.id,
          name: campaign.name,
          thumb: campaignThumb(campaign),
          count: 1,
        });
      days.set(key, list);
    })
  );
  days.forEach((list) => list.sort((a, b) => b.count - a.count));
  return days;
}

export function nameList(names) {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, 2).join(', ')} and ${plural(names.length - 2, 'other')}`;
}

export function latestPost(campaigns, now = new Date()) {
  const times = campaigns.flatMap((c) => pastPosts(c, now).map((date) => date.getTime()));
  return times.length ? new Date(Math.max(...times)) : null;
}

// Smallest preset that reaches back to `date`, so suggesting it always shows something.
export function presetCovering(date, now = new Date()) {
  if (!date) return null;
  return (
    POSTED_RANGES.find((r) => r.days && now.getTime() - r.days * DAY_MS <= date.getTime()) ?? null
  );
}

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
