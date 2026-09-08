/**
 * Row-to-extraction mapping in session storage.
 *
 * A refresh during a fetch must not lose the work that is already running and
 * already paid for. The mapping holds an extraction ID and the link it belongs
 * to, and nothing else. It never holds a receipt: a receipt is short lived and
 * requester-bound, and it is re-issued when the row is restored.
 */

const KEY = (campaignId) => `cc.guestExtraction.${campaignId}`;

const safeStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    // Private mode or blocked storage. The feature still works, without recovery.
    return null;
  }
};

export function readMapping(campaignId) {
  const store = safeStorage();
  if (!store) return {};
  try {
    const raw = store.getItem(KEY(campaignId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeMapping(campaignId, mapping) {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(KEY(campaignId), JSON.stringify(mapping));
  } catch {
    // Storage full or unavailable. Recovery is a convenience, not a rule.
  }
}

export function rememberRow(campaignId, rowId, { extractionId, profileLink }) {
  const mapping = readMapping(campaignId);
  mapping[rowId] = { extractionId, profileLink };
  writeMapping(campaignId, mapping);
}

/** A link change or a removed row drops the mapping straight away. */
export function forgetRow(campaignId, rowId) {
  const mapping = readMapping(campaignId);
  delete mapping[rowId];
  writeMapping(campaignId, mapping);
}

export function clearMapping(campaignId) {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(KEY(campaignId));
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
    if (record) kept[rowId] = { ...entry, status: record.status };
  });

  return kept;
}
