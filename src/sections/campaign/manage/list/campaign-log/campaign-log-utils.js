import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

// ---------------------------------------------------------------------------
// 1. Classification rules — checked in order, first match wins
// ---------------------------------------------------------------------------

const RULES = [
  // Campaign lifecycle
  { test: (m) => m === 'campaign created', category: 'Campaign', groups: ['campaign'] },
  { test: (m) => m === 'campaign activated', category: 'Campaign', groups: ['campaign'] },
  { test: (m) => m.startsWith('campaign details edited'), category: 'Campaign Edit', groups: ['campaign'] },

  // Outreach (fixes UNKNOWN bug)
  { test: (m) => m.startsWith('outreach status for'), category: 'Outreach', groups: ['admin'] },

  // Pitch — creator
  { test: (m) => m.includes('submitted a pitch'), category: 'Pitch', groups: ['creator'] },
  { test: (m) => m.includes('pitched for'), category: 'Pitch', groups: ['creator'] },

  // Pitch — admin
  { test: (m) => m.includes('pitch has been approved'), category: 'Pitch Approved', groups: ['admin'] },
  { test: (m) => m.includes('pitch has been rejected'), category: 'Pitch Rejected', groups: ['admin'] },

  // Pitch — client
  { test: (m) => m.includes('profile has been approved'), category: 'Pitch Approved', groups: ['client'] },
  { test: (m) => m.includes('profile has been rejected'), category: 'Pitch Rejected', groups: ['client'] },
  { test: (m) => m.includes('chose maybe for'), category: 'Pitch Maybe', groups: ['client'] },

  // Shortlist / withdrawal / removal
  { test: (m) => m.includes('has been shortlisted'), category: 'Shortlisted', groups: ['admin'] },
  { test: (m) => m.includes('withdrawn from the campaign'), category: 'Withdrawal', groups: ['admin'] },
  { test: (m) => m.includes('removed from the campaign'), category: 'Removal', groups: ['admin'] },

  // Agreement
  { test: (m) => m.includes('agreement has been sent') || m.includes('sent the agreement'), category: 'Agreement Sent', groups: ['admin'] },
  { test: (m) => m.includes('submitted agreement') || m.includes('submitted the agreement'), category: 'Agreement', groups: ['creator'] },
  { test: (m) => m.includes('agreement has been approved') || m.includes('approved the agreement'), category: 'Agreement Approved', groups: ['admin'] },
  { test: (m) => m.includes('agreement has been rejected'), category: 'Agreement Rejected', groups: ['admin'] },
  { test: (m) => m.includes('resent the agreement'), category: 'Agreement Sent', groups: ['admin'] },

  // Drafts — creator
  { test: (m) => m.includes('submitted first draft'), category: 'First Draft', groups: ['creator'] },
  { test: (m) => m.includes('submitted final draft'), category: 'Final Draft', groups: ['creator'] },
  { test: (m) => m.includes('submitted posting link'), category: 'Posting', groups: ['creator'] },

  // Drafts — admin approval / changes
  { test: (m) => (m.includes('approved by admin') || m.includes('draft approved by admin')), category: 'Draft Approved', groups: ['admin'] },
  { test: (m) => m.includes('changes requested on') && m.includes('by admin'), category: 'Changes Requested', groups: ['admin'] },

  // Drafts — client approval / changes
  { test: (m) => (m.includes('approved by client') || m.includes('draft approved by client')), category: 'Draft Approved', groups: ['client'] },
  { test: (m) => m.includes('changes requested on') && m.includes('by client'), category: 'Changes Requested', groups: ['client'] },

  // Invoice
  { test: (m) => m.includes('invoice') && m.includes('was generated'), category: 'Invoice', groups: ['invoice'] },
  { test: (m) => m.includes('deleted invoice'), category: 'Invoice', groups: ['invoice'] },
  { test: (m) => m.includes('approved invoice'), category: 'Invoice', groups: ['invoice'] },

  // Amount change
  { test: (m) => m.includes('changed the amount'), category: 'Amount Changed', groups: ['admin'] },

  // Client misc
  { test: (m) => m.includes('export campaign analytics'), category: 'Analytics', groups: ['client'] },
  { test: (m) => m.includes('logs in') || m.includes('logged in'), category: 'Login', groups: ['client'] },
];

// ---------------------------------------------------------------------------
// 2. Classify a single log message
// ---------------------------------------------------------------------------

export function classifyLog(message) {
  const lower = message.toLowerCase();
  for (let i = 0; i < RULES.length; i += 1) {
    if (RULES[i].test(lower)) {
      return { category: RULES[i].category, groups: RULES[i].groups };
    }
  }
  return { category: 'Activity', groups: ['other'] };
}

// ---------------------------------------------------------------------------
// 3. Filter classified logs by tab
// ---------------------------------------------------------------------------

export function filterLogsByTab(logs, tab) {
  if (tab === 'all') return logs;

  return logs.filter((log) => {
    switch (tab) {
      case 'admin':
        return (
          log.groups.includes('admin') ||
          log.groups.includes('campaign') ||
          (log.performerRole !== 'client' && log.performerRole !== 'creator')
        );
      case 'creator':
        return log.groups.includes('creator');
      case 'client':
        return log.groups.includes('client') || log.performerRole === 'client';
      case 'invoice':
        return log.groups.includes('invoice');
      default:
        return true;
    }
  });
}

// ---------------------------------------------------------------------------
// 4. Color map — category → { dot, bg }
// ---------------------------------------------------------------------------

const CATEGORY_META = {
  Campaign:           { color: '#1340FF', bg: '#EBF0FF', icon: 'solar:flag-bold' },
  'Campaign Edit':    { color: '#1340FF', bg: '#EBF0FF', icon: 'solar:pen-bold' },
  Outreach:           { color: '#00B8D9', bg: '#E6F9FD', icon: 'solar:letter-bold' },
  Pitch:              { color: '#F59E0B', bg: '#FFF8E6', icon: 'solar:hand-stars-bold' },
  'Pitch Maybe':      { color: '#F59E0B', bg: '#FFF8E6', icon: 'solar:question-circle-bold' },
  'Pitch Approved':   { color: '#22C55E', bg: '#E8FAF0', icon: 'solar:check-circle-bold' },
  'Pitch Rejected':   { color: '#FF5630', bg: '#FFEEEB', icon: 'solar:close-circle-bold' },
  Shortlisted:        { color: '#8E33FF', bg: '#F3E8FF', icon: 'solar:star-bold' },
  Withdrawal:         { color: '#FF5630', bg: '#FFEEEB', icon: 'solar:logout-2-bold' },
  Removal:            { color: '#FF5630', bg: '#FFEEEB', icon: 'solar:trash-bin-minimalistic-bold' },
  'Agreement Sent':   { color: '#1340FF', bg: '#EBF0FF', icon: 'solar:document-add-bold' },
  Agreement:          { color: '#1340FF', bg: '#EBF0FF', icon: 'solar:document-bold' },
  'Agreement Approved': { color: '#22C55E', bg: '#E8FAF0', icon: 'solar:check-circle-bold' },
  'Agreement Rejected': { color: '#FF5630', bg: '#FFEEEB', icon: 'solar:close-circle-bold' },
  'First Draft':      { color: '#ED6C02', bg: '#FFF3E6', icon: 'solar:file-text-bold' },
  'Final Draft':      { color: '#9C27B0', bg: '#F9E8FF', icon: 'solar:file-check-bold' },
  Posting:            { color: '#2E7D32', bg: '#E8F5E9', icon: 'solar:share-bold' },
  'Draft Approved':   { color: '#22C55E', bg: '#E8FAF0', icon: 'solar:check-circle-bold' },
  'Changes Requested': { color: '#FFAB00', bg: '#FFF8E6', icon: 'solar:refresh-circle-bold' },
  'Amount Changed':   { color: '#FFAB00', bg: '#FFF8E6', icon: 'solar:tag-price-bold' },
  Invoice:            { color: '#8E33FF', bg: '#F3E8FF', icon: 'solar:bill-list-bold' },
  Login:              { color: '#00B8D9', bg: '#E6F9FD', icon: 'solar:login-2-bold' },
  Analytics:          { color: '#00B8D9', bg: '#E6F9FD', icon: 'solar:chart-bold' },
  Activity:           { color: '#8E8E93', bg: '#F4F4F5', icon: 'solar:info-circle-bold' },
};

export function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.Activity;
}

// ---------------------------------------------------------------------------
// 5. Format log messages — cleaner, concise copies
// ---------------------------------------------------------------------------

// Strip "Creator " / "Admin " prefix and ensure name is in quotes
function qn(raw) {
  const clean = raw.replace(/^(?:Creator|Admin)\s+/i, '').replace(/^"|"$/g, '').trim();
  return `"${clean}"`;
}

// Shorthand: wrap a status outcome for chip rendering
// [action:KEY] renders as a miniature colored chip in the timeline
function a(key) { return `[action:${key}]`; }

// performer = the admin/client name who performed the action (from log.admin.name)
export function formatLogMessage(msg, performer) {
  const p = performer ? `"${performer.replace(/^"|"$/g, '')}"` : '';
  let m;

  // Outreach: "Outreach status for X updated to STATUS by Y"
  m = msg.match(/Outreach status for (.+?) updated to (\w+)/i);
  if (m) return `${p} updated ${qn(m[1])}'s outreach to [outreach:${m[2].toUpperCase()}]`;

  // Draft approved: "Draft approved by admin X from Creator Y"
  m = msg.match(/Draft approved by (?:admin|client) .+? from Creator (.+)$/i);
  if (m) return `${qn(m[1])}'s draft has been ${a('approved')} by ${p}`;

  // Changes requested: "Changes requested on Z by admin X from Creator Y"
  m = msg.match(/Changes requested on (.+?) by (?:admin|client) .+? from Creator (.+)$/i);
  if (m) return `${qn(m[2])}'s ${m[1].toLowerCase()} has been ${a('changes_requested')} by ${p}`;

  // "X approved the Agreement by Y"
  m = msg.match(/.+? approved the Agreement by (.+)$/i);
  if (m) return `${qn(m[1])}'s agreement has been ${a('approved')} by ${p}`;

  // Agreement sent
  m = msg.match(/Agreement has been sent to (.+)$/i);
  if (m) return `${p} sent agreement to ${qn(m[1])}`;
  m = msg.match(/sent the Agreement to (.+)$/i);
  if (m) return `${p} sent agreement to ${qn(m[1])}`;

  // Agreement rejected
  if (/agreement has been rejected/i.test(msg)) return `Agreement has been ${a('rejected')} by ${p}`;

  // Resent agreement
  m = msg.match(/resent the Agreement to (.+)$/i);
  if (m) return `${p} resent agreement to ${qn(m[1])}`;

  // Agreement submitted by creator
  m = msg.match(/(.+?) submitted (?:the )?[Aa]greement$/i);
  if (m) return `${qn(m[1])} submitted their agreement`;

  // Pitch submitted (creator action)
  m = msg.match(/(.+?) submitted a pitch/i);
  if (m) return `${qn(m[1])} submitted a pitch`;
  m = msg.match(/(.+?) pitched for/i);
  if (m) return `${qn(m[1])} submitted a pitch`;

  // Pitch approved/rejected
  m = msg.match(/(.+?)'?s? pitch has been approved/i);
  if (m) return `${qn(m[1])}'s pitch has been ${a('approved')} by ${p}`;
  m = msg.match(/(.+?)'?s? pitch has been rejected/i);
  if (m) return `${qn(m[1])}'s pitch has been ${a('rejected')} by ${p}`;

  // Profile approved/rejected (client)
  m = msg.match(/(.+?)'?s? profile has been approved/i);
  if (m) return `${qn(m[1])}'s profile has been ${a('approved')} by ${p}`;
  m = msg.match(/(.+?)'?s? profile has been rejected/i);
  if (m) return `${qn(m[1])}'s profile has been ${a('rejected')} by ${p}`;

  // Maybe
  m = msg.match(/[Cc]hose maybe for (.+)$/i);
  if (m) return `${qn(m[1])} has been marked as ${a('maybe')} by ${p}`;

  // Shortlisted
  m = msg.match(/(.+?) has been shortlisted/i);
  if (m) return `${qn(m[1])} has been ${a('shortlisted')} by ${p}`;

  // Withdrawn / removed
  m = msg.match(/(.+?) (?:has been )?withdrawn from the campaign/i);
  if (m) return `${qn(m[1])} withdrew from campaign`;
  m = msg.match(/(.+?) (?:has been )?removed from the campaign/i);
  if (m) return `${p} removed ${qn(m[1])} from campaign`;

  // Draft submissions by creator
  m = msg.match(/(.+?) submitted [Ff]irst [Dd]raft/i);
  if (m) return `${qn(m[1])} submitted first draft`;
  m = msg.match(/(.+?) submitted [Ff]inal [Dd]raft/i);
  if (m) return `${qn(m[1])} submitted final draft`;
  m = msg.match(/(.+?) submitted [Pp]osting [Ll]ink/i);
  if (m) return `${qn(m[1])} submitted posting link`;

  // Invoice — preserve invoice number when available
  m = msg.match(/Invoice\s+([\w-]+)\s+for\s+(.+?)\s+was generated/i);
  if (m) return `${p} generated invoice ${m[1]} for ${qn(m[2])}`;
  if (/invoice.*was generated/i.test(msg)) return `${p} generated an invoice`;

  m = msg.match(/Deleted invoice\s+([\w-]+)\s+for\s+(?:creator\s+)?(.+)$/i);
  if (m) return `${p} deleted invoice ${m[1]} for ${qn(m[2])}`;
  if (/deleted invoice/i.test(msg)) return `${p} deleted an invoice`;

  m = msg.match(/Approved invoice\s+([\w-]+)\s+for\s+(.+)$/i);
  if (m) return `Invoice ${m[1]} for ${qn(m[2])} has been ${a('approved')} by ${p}`;
  if (/approved invoice/i.test(msg)) return `Invoice has been ${a('approved')} by ${p}`;

  // Amount change
  m = msg.match(/changed the amount from (.+?) to (.+?) for (.+)$/i);
  if (m) return `${p} changed ${qn(m[3])}'s amount from ${m[1]} to ${m[2]}`;
  if (/changed the amount/i.test(msg)) return `${p} updated payment amount`;

  // Campaign lifecycle
  if (/^campaign created$/i.test(msg)) return `${p} created the campaign`;
  if (/^campaign activated$/i.test(msg)) return `${p} activated the campaign`;
  if (/^campaign details edited/i.test(msg)) return `${p} updated campaign details`;

  // Login
  if (/logs in|logged in/i.test(msg)) return `${p} logged in`;

  // Analytics
  if (/export campaign analytics/i.test(msg)) return `${p} exported campaign analytics`;

  return msg;
}

// ---------------------------------------------------------------------------
// 6. Tab counts (renumbered from here onward) — single-pass count for all tabs
// ---------------------------------------------------------------------------

export function getTabCounts(classifiedLogs) {
  const counts = { all: classifiedLogs.length, admin: 0, creator: 0, client: 0, invoice: 0 };
  classifiedLogs.forEach((log) => {
    if (
      log.groups.includes('admin') ||
      log.groups.includes('campaign') ||
      (log.performerRole !== 'client' && log.performerRole !== 'creator')
    )
      counts.admin += 1;
    if (log.groups.includes('creator')) counts.creator += 1;
    if (log.groups.includes('client') || log.performerRole === 'client') counts.client += 1;
    if (log.groups.includes('invoice')) counts.invoice += 1;
  });
  return counts;
}

// ---------------------------------------------------------------------------
// 7. Group logs by date
// ---------------------------------------------------------------------------

export function groupLogsByDate(logs) {
  const groups = [];
  const map = new Map();

  logs.forEach((log) => {
    const d = dayjs(log.createdAt);
    const key = d.format('YYYY-MM-DD');

    if (!map.has(key)) {
      let label;
      if (d.isToday()) label = 'Today';
      else if (d.isYesterday()) label = 'Yesterday';
      else label = d.format('MMM D, YYYY').toUpperCase();

      const group = { label, items: [] };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(log);
  });

  return groups;
}

// ---------------------------------------------------------------------------
// 6. Format time
// ---------------------------------------------------------------------------

export function formatLogTime(createdAt) {
  return dayjs(createdAt).format('h:mm A');
}

// ---------------------------------------------------------------------------
// 7. Performer badge config
// ---------------------------------------------------------------------------

export function getPerformerBadge(role) {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r === 'client') return { label: 'Client', color: '#F59E0B', bg: '#FFF8E6' };
  if (r !== 'creator') return { label: 'Admin', color: '#1340FF', bg: '#EBF0FF' };
  return null;
}
