import { format, addDays, differenceInCalendarDays } from 'date-fns';

import { STATUS_CHIP } from 'src/sections/campaign/discover/admin/creator-submissions/utils/constants';

export const BLUE = '#1340FF';

// Colours match the admin submission status chips.
export const TONES = {
  ok: { color: STATUS_CHIP.APPROVED.color, pill: 'On track' },
  warn: { color: STATUS_CHIP.PENDING_REVIEW.color, pill: 'Action needed' },
  bad: { color: STATUS_CHIP.CHANGES_REQUIRED.color, pill: 'Blocked' },
  idle: { color: STATUS_CHIP.NOT_STARTED.color, pill: 'Not started' },
};

export const SEGMENT_COLORS = {
  green: STATUS_CHIP.APPROVED.color,
  blue: BLUE,
  red: STATUS_CHIP.CHANGES_REQUIRED.color,
  grey: STATUS_CHIP.NOT_STARTED.color,
  ...Object.fromEntries(Object.entries(STATUS_CHIP).map(([status, chip]) => [status, chip.color])),
};

// A segment that counts one submission status, labelled and coloured like the admin chip.
const statusSegment = (status, value) => ({
  label: STATUS_CHIP[status].label,
  value,
  color: status,
});

const SHORTLIST_RESPONSE_DAYS = 3;

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const percent = (n, d) => (d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0);

/**
 * Who an action is waiting on, from the viewer's side.
 * @param {'client'|'admin'} owner
 * @param {'client'|'admin'} viewerRole
 */
export function ownerLabel(owner, viewerRole) {
  if (owner === viewerRole) return 'You';
  return viewerRole === 'admin' ? 'Brand' : 'Campaign team';
}

export function dueText(dueAt, today = new Date()) {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  const label = format(date, 'MMM d');
  return differenceInCalendarDays(date, today) < 0 ? `Overdue · ${label}` : `Due ${label}`;
}

const segments = (items) => items.filter((s) => s.value > 0);

function shortlistStage({ credits, shortlist }) {
  const total = credits?.total || 0;
  const used = credits?.used || 0;
  const waiting = shortlist?.waitingOnClient || 0;
  const confirmed = shortlist?.confirmed || 0;

  let tone = 'ok';
  if (waiting > 0) tone = 'warn';
  else if (!total) tone = 'idle';

  // Segments mix creators and open credits; this assumes one credit per creator, as the design does.
  const stage = {
    key: 'shortlist',
    name: 'Shortlisted creators',
    tab: 'creator-master-list',
    tone,
    progress: percent(used, total),
    stat: `${used}/${total}`,
    statLabel: 'credits allocated',
    segments: segments([
      { label: 'confirmed', value: confirmed, color: 'green' },
      { label: 'contract pending', value: shortlist?.contractPending || 0, color: 'blue' },
      { label: 'credits left', value: credits?.unallocated || 0, color: 'grey' },
    ]),
  };

  if (waiting > 0) {
    stage.action = {
      text: confirmed
        ? `Review ${plural(waiting, 'new creator')}`
        : `Review ${plural(waiting, 'creator pitch', 'creator pitches')}`,
      owner: 'client',
      dueAt: shortlist.waitingSince
        ? addDays(new Date(shortlist.waitingSince), SHORTLIST_RESPONSE_DAYS).toISOString()
        : null,
    };
  } else if (!total) {
    stage.note = 'Credits appear once the campaign is funded';
  } else if (used >= total) {
    stage.note = 'All credits allocated';
  } else {
    stage.note = `On track · campaign team is sourcing ${plural(total - used, 'more credit')}`;
  }

  return stage;
}

function submissionsStage({ submissions: s }) {
  const approved = s?.approved || 0;
  const inReview = s?.inReview || 0;
  const revision = s?.revision || 0;
  const withAdmins = s?.withAdmins || 0;
  const notSubmitted = s?.notSubmitted || 0;
  const total = approved + inReview + revision + withAdmins + notSubmitted;

  if (!total) {
    return {
      key: 'submissions',
      name: 'Creator submissions',
      tab: s?.submissionVersion === 'v4' ? 'submissions-v4' : 'deliverables',
      tone: 'idle',
      progress: 0,
      stat: '—',
      statLabel: 'no drafts yet',
      segments: [],
      note: 'Opens once creators are confirmed',
    };
  }

  const stage = {
    key: 'submissions',
    name: 'Creator submissions',
    tab: s.submissionVersion === 'v4' ? 'submissions-v4' : 'deliverables',
    tone: inReview > 0 ? 'warn' : 'ok',
    progress: percent(approved, total),
    stat: `${approved}/${total}`,
    statLabel: 'drafts approved',
    segments: segments([
      statusSegment('APPROVED', approved),
      statusSegment('SENT_TO_CLIENT', inReview),
      statusSegment('PENDING_REVIEW', withAdmins),
      statusSegment('CHANGES_REQUIRED', revision),
      statusSegment('NOT_STARTED', notSubmitted),
    ]),
  };

  if (inReview > 0) {
    stage.action = {
      text: `Approve ${plural(inReview, 'draft')}`,
      owner: 'client',
      dueAt: s.nextDueAt || null,
    };
  } else if (approved === total) {
    stage.note = 'All drafts approved';
  } else if (revision > 0) {
    stage.note = `On track · ${plural(revision, 'draft')} being revised`;
  } else {
    stage.note = 'On track · waiting on creators';
  }

  return stage;
}

function logisticsStage({ logistics: l }) {
  const base = { key: 'logistics', name: 'Logistics', tab: 'logistics' };
  const reservation = l?.type === 'RESERVATION';
  const noun = reservation ? 'reservations completed' : 'products delivered';

  if (!l?.enabled) {
    return {
      ...base,
      tone: 'idle',
      progress: 0,
      stat: '—',
      statLabel: 'no logistics',
      segments: [],
      note: 'This campaign has no shipping or reservations',
    };
  }

  if (!l.productsSetUp && !reservation) {
    return {
      ...base,
      tone: 'warn',
      pill: 'Setup needed',
      progress: 0,
      stat: `0/${l.total || 0}`,
      statLabel: 'products shipped',
      segments: [],
      action: { text: 'Add product details for shipping', owner: 'client', dueAt: null },
    };
  }

  const stage = {
    ...base,
    tone: 'ok',
    progress: percent(l.delivered, l.total),
    stat: `${l.delivered}/${l.total}`,
    statLabel: noun,
    segments: segments([
      { label: 'delivered', value: l.delivered, color: 'green' },
      { label: 'in transit', value: l.inTransit, color: 'blue' },
      { label: 'awaiting assignment', value: l.awaitingAssignment, color: 'grey' },
      { label: 'issue', value: l.issues, color: 'red' },
    ]),
  };

  if (l.issues > 0) {
    stage.tone = 'bad';
    stage.action = {
      text: `Resolve ${plural(l.issues, 'delivery issue')}`,
      owner: 'admin',
      dueAt: null,
    };
  } else if (l.awaitingAssignment > 0) {
    stage.tone = 'bad';
    stage.action = {
      text: `Confirm ${plural(l.awaitingAssignment, 'shipping address', 'shipping addresses')}`,
      owner: 'admin',
      dueAt: null,
    };
  } else if (l.total && l.delivered >= l.total) {
    stage.note = reservation ? 'All reservations completed' : 'All products delivered';
  } else if (!l.total) {
    stage.tone = 'idle';
    stage.note = 'Shipments start once creators are confirmed';
  } else {
    stage.note = `On track · ${plural(l.inTransit, 'shipment')} in transit`;
  }

  return stage;
}

function analyticsStage({ posts: p, campaign }, today) {
  const live = p?.live || 0;
  const pending = p?.pending || 0;
  const total = p?.total || 0;
  const base = { key: 'analytics', name: 'Analytics', tab: 'analytics' };

  if (!live) {
    return {
      ...base,
      tone: 'idle',
      progress: 0,
      stat: '0',
      statLabel: 'posts live',
      segments: segments([
        statusSegment('APPROVE_LINK', pending),
        statusSegment('NOT_STARTED', Math.max(0, total - pending)),
      ]),
      note: 'Data appears after the first post goes live',
    };
  }

  const windowEnd = campaign?.postingEndDate && new Date(campaign.postingEndDate);
  let note = live >= total ? 'All posts live' : 'On track';
  if (live < total && windowEnd && differenceInCalendarDays(windowEnd, today) >= 0) {
    note = `On track · posting window ends ${format(windowEnd, 'MMM d')}`;
  }

  return {
    ...base,
    tone: 'ok',
    progress: percent(live, total),
    stat: `${live}/${total}`,
    statLabel: 'posts live',
    segments: segments([
      statusSegment('POSTED', live),
      statusSegment('APPROVE_LINK', pending),
      statusSegment('NOT_STARTED', Math.max(0, total - live - pending)),
    ]),
    note,
  };
}

/** Builds the four stage cards from GET /campaign/:id/overview. */
export function buildStages(overview, today = new Date()) {
  return [
    shortlistStage(overview),
    submissionsStage(overview),
    logisticsStage(overview),
    analyticsStage(overview, today),
  ];
}

export function timeline(campaign, today = new Date()) {
  if (!campaign?.startDate || !campaign?.endDate) return null;

  const totalDays =
    differenceInCalendarDays(new Date(campaign.endDate), new Date(campaign.startDate)) + 1;

  const day = differenceInCalendarDays(today, new Date(campaign.startDate)) + 1;

  const clamped = Math.min(Math.max(day, 0), totalDays);

  return { day: clamped, totalDays, progress: percent(clamped, totalDays) };
}

const STATUS_LABELS = {
  ACTIVE: 'Live',
  COMPLETED: 'Completed',
  PAUSED: 'Paused',
  SCHEDULED: 'Scheduled',
};

export const statusLabel = (status = '') =>
  STATUS_LABELS[status] ||
  status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export function compactNumber(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** % change against the previous snapshot; null when there's nothing to compare. */
export function delta(current, previous) {
  if (current == null || !previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Engagement rate, already a percent. Small rates keep two decimals; tiny reach can push
 * stored rates past 100%, which we cap in the label.
 */
export function formatRate(rate) {
  if (rate == null) return '—';
  if (rate > 100) return '>100%';
  return `${rate.toFixed(rate < 1 ? 2 : 1)}%`;
}
