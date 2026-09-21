/**
 * Row-to-extraction mapping in session storage.
 *
 * A refresh during a fetch must not lose the work that is already running and
 * already paid for. Guest rows need the extraction ID and link. Platform rows
 * also keep the registered creator and source identity. Receipts stay out of
 * storage because recovery re-issues them for the current requester.
 */

const KEY = (kind, campaignId) => `cc.extractionSession.${kind}.${campaignId}`;
const LEGACY_GUEST_KEY = (campaignId) => `cc.guestExtraction.${campaignId}`;

const safeStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    // Private mode or blocked storage. The feature still works, without recovery.
    return null;
  }
};

const parseMapping = (raw, kind) => {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([rowId, entry]) => {
        if (
          !entry ||
          typeof entry !== 'object' ||
          typeof entry.extractionId !== 'string' ||
          typeof entry.profileLink !== 'string'
        ) {
          return [];
        }
        if (kind !== 'platform') {
          return [[rowId, { extractionId: entry.extractionId, profileLink: entry.profileLink }]];
        }
        if (
          entry.v !== 2 ||
          typeof entry.creatorId !== 'string' ||
          !['instagram', 'tiktok'].includes(entry.selectedPlatform) ||
          !['stored', 'manual'].includes(entry.sourceMode)
        ) {
          return [];
        }
        return [
          [
            rowId,
            {
              v: 2,
              extractionId: entry.extractionId,
              profileLink: entry.profileLink,
              creatorId: entry.creatorId,
              selectedPlatform: entry.selectedPlatform,
              sourceMode: entry.sourceMode,
            },
          ],
        ];
      })
    );
  } catch {
    return {};
  }
};

export function readMapping(kind, campaignId) {
  const store = safeStorage();
  if (!store) return {};

  const current = store.getItem(KEY(kind, campaignId));
  if (kind !== 'guest') return parseMapping(current, kind);

  const legacyKey = LEGACY_GUEST_KEY(campaignId);
  if (current != null) {
    try {
      store.removeItem(legacyKey);
    } catch {
      // The current mapping remains authoritative.
    }
    return parseMapping(current, kind);
  }

  const legacy = store.getItem(legacyKey);
  if (legacy == null) return {};
  const mapping = parseMapping(legacy, kind);
  try {
    const serialized = JSON.stringify(mapping);
    store.setItem(KEY(kind, campaignId), serialized);
    if (store.getItem(KEY(kind, campaignId)) === serialized) store.removeItem(legacyKey);
  } catch {
    // Keep the legacy value so a later read can retry migration.
  }
  return mapping;
}

export function writeMapping(kind, campaignId, mapping) {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(KEY(kind, campaignId), JSON.stringify(parseMapping(JSON.stringify(mapping), kind)));
  } catch {
    // Storage full or unavailable. Recovery is a convenience, not a rule.
  }
}

export function rememberRow(kind, campaignId, rowId, entry) {
  const mapping = readMapping(kind, campaignId);
  mapping[rowId] =
    kind === 'platform'
      ? {
          v: 2,
          extractionId: entry.extractionId,
          profileLink: entry.profileLink,
          creatorId: entry.creatorId,
          selectedPlatform: entry.selectedPlatform,
          sourceMode: entry.sourceMode,
        }
      : { extractionId: entry.extractionId, profileLink: entry.profileLink };
  writeMapping(kind, campaignId, mapping);
}

/** A link change or a removed row drops the mapping straight away. */
export function forgetRow(kind, campaignId, rowId) {
  const mapping = readMapping(kind, campaignId);
  delete mapping[rowId];
  writeMapping(kind, campaignId, mapping);
}

export function clearMapping(kind, campaignId) {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(KEY(kind, campaignId));
    if (kind === 'guest') store.removeItem(LEGACY_GUEST_KEY(campaignId));
  } catch {
    // Nothing to do.
  }
}

/**
 * Keep only the entries the server still owns, and only where the link has not
 * changed since the row was saved.
 */
export function reconcileMapping(mapping, serverExtractions) {
  const byId = new Map(serverExtractions.map((record) => [record.id, record]));
  const kept = {};

  Object.entries(mapping).forEach(([rowId, entry]) => {
    const record = entry && byId.get(entry.extractionId);
    if (record) {
      kept[rowId] = {
        ...entry,
        status: record.status,
        serverProfileUrl: record.canonicalProfileUrl,
      };
    }
  });

  return kept;
}
