/**
 * One-minute scrape draft for the Add Creator modals.
 *
 * The extraction map only stores an in-flight id. This store holds the filled
 * fields after Apify finishes, so closing the modal by mistake does not throw
 * the scrape away. Guest and platform each have their own key.
 */

import {
  ROW_STATUS,
  hasSafeFollowerCount,
  isAllowedFallbackReason,
} from './creator-row-machine';

export const DRAFT_TTL_MS = 60_000;

export const DRAFT_KIND = {
  GUEST: 'guest',
  PLATFORM: 'platform',
};

const KEY = (kind, campaignId) => `cc.creatorDraft.${kind}.${campaignId}`;

const safeStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
};

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const isKind = (kind) => kind === DRAFT_KIND.GUEST || kind === DRAFT_KIND.PLATFORM;

/** A JSON-safe slice of the Autocomplete creator. */
export function toDraftCreator(creator) {
  if (!creator || typeof creator !== 'object' || !creator.id) return null;
  const account = creator.creator;
  return {
    id: creator.id,
    name: creator.name ?? '',
    email: creator.email ?? '',
    photoURL: creator.photoURL ?? null,
    creator: account
      ? {
          isFormCompleted: account.isFormCompleted,
          instagramUser: account.instagramUser
            ? {
                id: account.instagramUser.id,
                followers_count: account.instagramUser.followers_count,
                engagement_rate: account.instagramUser.engagement_rate,
              }
            : null,
          tiktokUser: account.tiktokUser
            ? {
                id: account.tiktokUser.id,
                followers_count: account.tiktokUser.followers_count,
                engagement_rate: account.tiktokUser.engagement_rate,
              }
            : null,
        }
      : null,
  };
}

/** True when Apify finished this row, including a confirmed fallback. */
export function isScrapedDraftRow(row) {
  if (!row) return false;
  if (row.status === ROW_STATUS.READY) return true;
  return (
    isAllowedFallbackReason(row.fallbackReason) &&
    row.fallbackConfirmed === true &&
    (hasText(row.name) || hasText(row.creator?.name)) &&
    hasSafeFollowerCount(row.followerCount)
  );
}

export function toDraftRow(row) {
  return {
    id: row.id,
    creator: toDraftCreator(row.creator),
    profileLink: row.profileLink ?? '',
    canonicalProfileUrl: row.canonicalProfileUrl ?? null,
    canonicalProfileKey: row.canonicalProfileKey ?? null,
    platform: row.platform ?? null,
    status: row.status,
    name: row.name ?? '',
    followerCount: row.followerCount ?? '',
    engagementRate: row.engagementRate ?? '',
    adminComments: row.adminComments ?? '',
    extractionId: row.extractionId ?? null,
    completionReceipt: row.completionReceipt ?? null,
    sampleSize: row.sampleSize ?? null,
    fetchedAt: row.fetchedAt ?? null,
    selectedPosts: row.selectedPosts ?? null,
    formulaVersion: row.formulaVersion ?? null,
    fetched: row.fetched ?? null,
    fallbackConfirmed: row.fallbackConfirmed === true,
    fallbackReason: row.fallbackReason ?? null,
    linkError: row.linkError ?? null,
    error: row.error ?? null,
  };
}

export function toDraftRows(rows, skipDraftRow) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => isScrapedDraftRow(row) && !skipDraftRow?.(row))
    .map(toDraftRow);
}

/** Keep the first live row id so AnimatePresence does not remount it. */
export function withKeptFirstId(rows, keepId) {
  if (!keepId || !rows.length) return rows;
  return [{ ...rows[0], id: keepId }, ...rows.slice(1)];
}

function parseDraft(raw) {
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) return null;
  if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) return null;
  const rows = parsed.rows.filter((row) => row && typeof row === 'object' && typeof row.id === 'string');
  if (rows.length === 0) return null;
  const expiresAt =
    parsed.expiresAt == null || typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null;
  return { v: 1, expiresAt: expiresAt ?? null, rows };
}

export function readDraft(kind, campaignId, now = Date.now()) {
  if (!isKind(kind) || !campaignId) return null;
  const store = safeStorage();
  if (!store) return null;
  const parsed = parseDraft(store.getItem(KEY(kind, campaignId)));
  if (!parsed) return null;
  if (parsed.expiresAt != null && now >= parsed.expiresAt) {
    clearDraft(kind, campaignId);
    return null;
  }
  return parsed;
}

export function writeDraft(kind, campaignId, draft) {
  if (!isKind(kind) || !campaignId) return;
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(KEY(kind, campaignId), JSON.stringify(draft));
  } catch {
    // Storage full or unavailable. The modal still works without a draft.
  }
}

export function clearDraft(kind, campaignId) {
  if (!isKind(kind) || !campaignId) return;
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(KEY(kind, campaignId));
  } catch {
    // Nothing to do.
  }
}

/** Write scraped rows while the modal is open. No TTL until close. */
export function persistOpenDraft(kind, campaignId, rows, skipDraftRow) {
  const draftRows = toDraftRows(rows, skipDraftRow);
  if (draftRows.length === 0) {
    clearDraft(kind, campaignId);
    return;
  }
  writeDraft(kind, campaignId, { v: 1, expiresAt: null, rows: draftRows });
}

/** Start the 1-minute clock. A missing draft is a no-op. */
export function stampDraftExpiry(kind, campaignId, now = Date.now()) {
  const draft = readDraft(kind, campaignId, now);
  if (!draft) return;
  writeDraft(kind, campaignId, { ...draft, expiresAt: now + DRAFT_TTL_MS });
}
