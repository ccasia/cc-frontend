import dayjs from 'dayjs';

// A SENT_TO_CLIENT brief older than this (in days) with no reply is flagged for
// follow-up and sorted to the top of its column.
export const FOLLOW_UP_DAYS = 7;

// Pipeline columns, in board order. `key` maps to Campaign.draftStatus.
export const PIPELINE_COLUMNS = [
  { key: 'DRAFTED', label: 'TO SEND', color: '#9ca3af' },
  { key: 'SENT_TO_CLIENT', label: 'AWAITING', color: '#7c3aed' },
  { key: 'PENDING_REVIEW', label: 'NEEDS REVIEW', color: '#d97706' },
  { key: 'APPROVED', label: 'HAND OVER', color: '#16a34a' },
  { key: 'HANDED_OVER', label: 'MONITORING', color: '#2563eb' },
];

// Whole days since a brief was sent to the client. null when never sent.
export function daysSinceSent(sentToClientAt) {
  if (!sentToClientAt) return null;
  return dayjs().startOf('day').diff(dayjs(sentToClientAt).startOf('day'), 'day');
}

// Group briefs into board columns. LOST briefs are excluded (stats only), as are
// any statuses outside the pipeline. AWAITING is sorted so overdue follow-ups
// rise to the top; every other column keeps most-recent-first.
export function groupBriefsIntoColumns(briefs) {
  const byStatus = {};
  PIPELINE_COLUMNS.forEach((c) => {
    byStatus[c.key] = [];
  });

  (briefs || []).forEach((b) => {
    if (b.draftStatus && byStatus[b.draftStatus]) {
      byStatus[b.draftStatus].push(b);
    }
  });

  byStatus.SENT_TO_CLIENT.sort((a, b) => {
    const da = daysSinceSent(a.sentToClientAt) ?? -1;
    const db = daysSinceSent(b.sentToClientAt) ?? -1;
    return db - da;
  });

  return byStatus;
}

// Header summary counts (currency-independent).
export function headerCounts(briefs) {
  let needsAttention = 0;
  let activeDeals = 0;
  (briefs || []).forEach((b) => {
    const s = b.draftStatus;
    if (!s) return;
    if (s !== 'LOST' && s !== 'HANDED_OVER') activeDeals += 1;
    if (s === 'DRAFTED' || s === 'PENDING_REVIEW' || s === 'APPROVED') {
      needsAttention += 1;
    } else if (s === 'SENT_TO_CLIENT') {
      const days = daysSinceSent(b.sentToClientAt);
      if (days != null && days >= FOLLOW_UP_DAYS) needsAttention += 1;
    }
  });
  return { needsAttention, activeDeals };
}

// Compact money formatter — "RM 96,000" / "S$ 96k"-style. Uses full grouping for
// the headline figures; the caller supplies the currency symbol.
export function currencySymbol(currency) {
  if (currency === 'SGD') return 'S$';
  if (currency === 'USD') return '$';
  return 'RM';
}

export function formatMoney(amount, currency) {
  const value = Math.round(amount || 0);
  return `${currencySymbol(currency)} ${value.toLocaleString('en-US')}`;
}

// "RM 96k" short form for tight spots (team bars).
export function formatMoneyShort(amount, currency) {
  const value = amount || 0;
  const sym = currencySymbol(currency);
  if (value >= 1000) {
    const k = value / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${sym} ${rounded}k`;
  }
  return `${sym} ${Math.round(value).toLocaleString('en-US')}`;
}

export function greetingForNow() {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
