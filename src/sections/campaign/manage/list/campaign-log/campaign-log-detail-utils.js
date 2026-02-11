// ---------------------------------------------------------------------------
// Detail panel data extraction — pure logic, no UI
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. Extract creator name from raw log message
// ---------------------------------------------------------------------------

const CREATOR_NAME_PATTERNS = [
  // for creator "Name" / from Creator "Name" / from Creator Name
  /(?:for|from)\s+(?:c|C)reator\s+"([^"]+)"/i,
  /(?:for|from)\s+(?:c|C)reator\s+([A-Z][a-z]+(?: [A-Z][a-z]+)+)/,

  // "Name" submitted a pitch / pitched for
  /"([^"]+)"\s+(?:submitted a pitch|pitched for)/i,

  // "Name"'s pitch has been approved/rejected
  /"([^"]+)"(?:'s|'s)\s+pitch has been/i,

  // "Name"'s profile has been approved/rejected
  /"([^"]+)"(?:'s|'s)\s+profile has been/i,

  // chose maybe for "Name"
  /chose maybe for\s+"([^"]+)"/i,

  // "Name" has been shortlisted
  /"([^"]+)"\s+has been shortlisted/i,

  // "Name" withdrawn/removed from the campaign
  /"([^"]+)"\s+(?:has been\s+)?(?:withdrawn|removed) from the campaign/i,

  // Agreement has been sent to "Name" / sent the Agreement to "Name" / resent the Agreement to "Name"
  /(?:Agreement has been sent to|sent the Agreement to|resent the Agreement to)\s+"([^"]+)"/i,

  // "Name" submitted agreement/first draft/final draft/posting link
  /"([^"]+)"\s+submitted\s+(?:the\s+)?(?:agreement|first draft|final draft|posting link)/i,

  // Invoice INV-123 for "Name" was generated / Deleted invoice / Approved invoice
  /[Ii]nvoice\s+[\w-]+\s+for\s+"?([^"]+?)"?\s+was generated/,
  /[Dd]eleted invoice\s+[\w-]+\s+for\s+(?:creator\s+)?"?([^"]+?)"?\s*$/,
  /[Aa]pproved invoice\s+[\w-]+\s+for\s+"?([^"]+?)"?\s*$/,

  // changed the amount from X to Y for "Name"
  /changed the amount from .+? to .+? for\s+"?([^"]+?)"?\s*$/i,

  // X approved "Name"'s First/Final Draft
  /approved\s+"([^"]+)"(?:'s|'s)\s+(?:First|Final)\s+Draft/i,
  /requested changes on\s+"([^"]+)"(?:'s|'s)/i,

  // Outreach status for "Name" updated to STATUS
  /[Oo]utreach status for\s+"?([^"]+?)"?\s+updated to/,

  // Admin "X" approved/requested changes ... for creator Name (unquoted)
  /for creator\s+([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s*$/,

  // Fallback patterns without quotes
  /([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s+submitted a pitch/,
  /([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s+has been shortlisted/,
  /([A-Z][a-z]+(?: [A-Z][a-z]+)+)(?:'s|'s)\s+pitch has been/,
  /([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s+submitted\s+(?:the\s+)?(?:agreement|first draft|final draft|posting link)/i,
  /([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s+(?:has been\s+)?(?:withdrawn|removed) from the campaign/i,
];

export function extractCreatorNameFromLog(rawMessage) {
  if (!rawMessage) return null;
  for (let i = 0; i < CREATOR_NAME_PATTERNS.length; i += 1) {
    const match = rawMessage.match(CREATOR_NAME_PATTERNS[i]);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2. Find creator data from campaign shortlisted/pitch lists
// ---------------------------------------------------------------------------

export function findCreatorData(creatorName, campaign) {
  if (!creatorName || !campaign) return null;

  const lower = creatorName.toLowerCase();

  // Check shortlisted first (richest data)
  const shortlisted = campaign.shortlisted?.find(
    (s) => s.user?.name?.toLowerCase() === lower
  );
  if (shortlisted?.user) {
    return {
      name: shortlisted.user.name,
      photoURL: shortlisted.user.photoURL || null,
      ugcVideos: shortlisted.ugcVideos ?? null,
      creditPerVideo: shortlisted.creditPerVideo ?? null,
      status: shortlisted.status || null,
      source: 'shortlisted',
    };
  }

  // Check pitches
  const pitch = campaign.pitch?.find(
    (p) => p.user?.name?.toLowerCase() === lower
  );
  if (pitch?.user) {
    return {
      name: pitch.user.name,
      photoURL: pitch.user.photoURL || null,
      ugcVideos: null,
      creditPerVideo: null,
      status: pitch.status || null,
      source: 'pitch',
    };
  }

  // Fallback: return just the name
  return {
    name: creatorName,
    photoURL: null,
    ugcVideos: null,
    creditPerVideo: null,
    status: null,
    source: 'message',
  };
}

// ---------------------------------------------------------------------------
// 3. Extract invoice info from log message
// ---------------------------------------------------------------------------

export function extractInvoiceInfo(rawMessage) {
  if (!rawMessage) return null;

  let m;
  // "Invoice INV-123 for Name was generated"
  m = rawMessage.match(/[Ii]nvoice\s+([\w-]+)\s+for\s+"?(.+?)"?\s+was generated/);
  if (m) return { invoiceNumber: m[1], creatorName: m[2].trim() };

  // "Deleted invoice INV-123 for creator Name"
  m = rawMessage.match(/[Dd]eleted invoice\s+([\w-]+)\s+for\s+(?:creator\s+)?"?(.+?)"?\s*$/);
  if (m) return { invoiceNumber: m[1], creatorName: m[2].trim() };

  // "Approved invoice INV-123 for Name"
  m = rawMessage.match(/[Aa]pproved invoice\s+([\w-]+)\s+for\s+"?(.+?)"?\s*$/);
  if (m) return { invoiceNumber: m[1], creatorName: m[2].trim() };

  return null;
}

// ---------------------------------------------------------------------------
// 4. Extract amount change info from log message
// ---------------------------------------------------------------------------

export function extractAmountChangeInfo(rawMessage) {
  if (!rawMessage) return null;
  const m = rawMessage.match(/changed the amount from (.+?) to (.+?) for\s+"?(.+?)"?\s*$/i);
  if (!m) return null;
  return { oldAmount: m[1], newAmount: m[2], creatorName: m[3].trim() };
}

// ---------------------------------------------------------------------------
// 5. Extract campaign edit section name
// ---------------------------------------------------------------------------

export function extractEditSection(rawMessage) {
  if (!rawMessage) return null;
  // "campaign details edited (General Info)" etc.
  const m = rawMessage.match(/campaign details edited\s*\((.+?)\)/i);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Categories that should populate creator context
// ---------------------------------------------------------------------------

const CREATOR_CATEGORIES = new Set([
  'Pitch', 'Pitch Approved', 'Pitch Rejected', 'Pitch Maybe',
  'Shortlisted', 'Withdrawal', 'Removal',
  'Agreement Sent', 'Agreement', 'Agreement Approved', 'Agreement Rejected',
  'First Draft', 'Final Draft', 'Posting',
  'Draft Approved', 'Changes Requested', 'Draft Rejected',
  'Outreach',
]);

const CAMPAIGN_CATEGORIES = new Set([
  'Campaign', 'Campaign Edit',
]);

// ---------------------------------------------------------------------------
// 6. Master function: builds context object for a log entry
// ---------------------------------------------------------------------------

export function extractLogContext(log, campaign) {
  const ctx = {
    creator: null,
    campaignInfo: null,
    invoice: null,
    amountChange: null,
    editSection: null,
  };

  if (!log) return ctx;

  const { action, category } = log;

  // Creator context
  if (CREATOR_CATEGORIES.has(category) || category === 'Invoice' || category === 'Amount Changed') {
    const name = extractCreatorNameFromLog(action);
    if (name) {
      ctx.creator = findCreatorData(name, campaign);
    }
  }

  // Campaign info context
  if (CAMPAIGN_CATEGORIES.has(category) && campaign) {
    ctx.campaignInfo = {
      name: campaign.name || '',
      image: campaign.campaignBrief?.images?.[0] || null,
      brandName: campaign.brand?.name || campaign.company?.name || '',
      status: campaign.status || '',
      type: campaign.campaignBrief?.campaigns_do?.[0] || 'normal',
      submissionVersion: campaign.submissionVersion || null,
      shortlistedCount: campaign.shortlisted?.length || 0,
    };

    if (category === 'Campaign Edit') {
      ctx.editSection = extractEditSection(action);
    }
  }

  // Invoice context
  if (category === 'Invoice') {
    ctx.invoice = extractInvoiceInfo(action);
  }

  // Amount change context
  if (category === 'Amount Changed') {
    ctx.amountChange = extractAmountChangeInfo(action);
  }

  return ctx;
}
