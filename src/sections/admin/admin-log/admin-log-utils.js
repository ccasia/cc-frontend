import { classifyLog } from 'src/sections/campaign/manage/list/campaign-log/campaign-log-utils';

// ---------------------------------------------------------------------------
// Classify a single admin-log message.
//
// Admin logs share the same visual system as campaign logs, but their messages
// cover a few admin-only actions (impersonation, company/brand management) that
// the campaign classifier doesn't know about. We check those first, then fall
// back to the shared `classifyLog` (which already handles campaign / invoice /
// agreement / shortlist / withdrawal messages).
// ---------------------------------------------------------------------------

export function classifyAdminLog(message) {
  const lower = (message || '').toLowerCase();

  if (lower.includes('ended impersonation') || lower.includes('impersonation of')) {
    return { category: 'Impersonation Ended', groups: ['admin'] };
  }
  if (lower.includes('impersonat')) {
    return { category: 'Impersonation Started', groups: ['admin'] };
  }
  if (lower.includes('new brand')) {
    return { category: 'Brand', groups: ['admin'] };
  }
  if (
    lower.includes('company') ||
    lower.includes('activated client') ||
    lower.includes('activation email for client')
  ) {
    return { category: 'Company', groups: ['admin'] };
  }

  return classifyLog(message);
}

// ---------------------------------------------------------------------------
// Format an admin-log message for `renderActionParts`.
//
// Unlike campaign logs we do NOT prepend the performer — every row in a given
// modal belongs to the same admin, so repeating the name is noise. We keep the
// raw message (impersonation messages already quote the target name, so it
// renders with an avatar) and turn trailing approve/reject verbs into colored
// chips for visual consistency with the campaign timeline.
// ---------------------------------------------------------------------------

export function formatAdminLogMessage(message) {
  if (!message) return '';

  let m = message;
  m = m.replace(/\bApproved agreement\b/i, '[action:approved] agreement');
  m = m.replace(/\bRejected agreement\b/i, '[action:rejected] agreement');
  return m;
}
