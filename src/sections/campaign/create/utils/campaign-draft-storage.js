const STORAGE_PREFIX = 'cult:campaign-creation-draft:';
const DB_NAME = 'cult-campaign-creation-drafts';
const STORE_NAME = 'drafts';
let indexedDbWrite = Promise.resolve();
const pendingIndexedDbWrites = new Map();
let indexedDbDrainActive = false;

const isFile = (value) => typeof File !== 'undefined' && value instanceof File;

const fileMarker = (file) => ({
  __campaignDraftFile: true,
  name: file.name,
  type: file.type,
  size: file.size,
  lastModified: file.lastModified,
});

const isFileMarker = (value) => value?.__campaignDraftFile === true;

const sameFile = (file, marker) =>
  isFile(file) &&
  file.name === marker.name &&
  file.type === marker.type &&
  file.size === marker.size &&
  file.lastModified === marker.lastModified;

const hydrateFiles = (localValue, indexedDbValue) => {
  if (isFileMarker(localValue)) return sameFile(indexedDbValue, localValue) ? indexedDbValue : null;
  if (!localValue || typeof localValue !== 'object') return localValue;

  if (Array.isArray(localValue)) {
    return localValue
      .map((item, index) => hydrateFiles(item, indexedDbValue?.[index]))
      .filter((item) => item !== null);
  }

  return Object.fromEntries(
    Object.entries(localValue).map(([key, item]) => [key, hydrateFiles(item, indexedDbValue?.[key])])
  );
};

const toJsonSafe = (value, seen = new WeakSet(), preserveFileMarkers = false) => {
  if (isFile(value)) return preserveFileMarkers ? fileMarker(value) : undefined;
  if (value instanceof Date) return value.toISOString();
  if (value === undefined || typeof value === 'function') return null;
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return null;

  seen.add(value);
  const result = Array.isArray(value)
    ? value
        .map((item) => toJsonSafe(item, seen, preserveFileMarkers))
        .filter((item) => item !== undefined)
    : Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          toJsonSafe(item, seen, preserveFileMarkers),
        ])
      );
  seen.delete(value);
  return result;
};

const openDatabase = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runIndexedDb = async (mode, operation) => {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
};

const queueIndexedDbWrite = (userId, snapshot) => {
  pendingIndexedDbWrites.set(String(userId), snapshot);
  if (indexedDbDrainActive) return indexedDbWrite;

  indexedDbDrainActive = true;
  indexedDbWrite = indexedDbWrite
    .then(async () => {
      const drain = async () => {
        if (pendingIndexedDbWrites.size === 0) return;
        const writes = [...pendingIndexedDbWrites.entries()];
        pendingIndexedDbWrites.clear();
        await Promise.all(
          writes.map(([key, value]) =>
            runIndexedDb('readwrite', (store) => store.put(value, key)).catch(() => {})
          )
        );
        await drain();
      };

      await drain();
    })
    .finally(() => {
      indexedDbDrainActive = false;
    });

  return indexedDbWrite;
};

export const serializeCampaignDraftValues = (values) => toJsonSafe(values);

export const saveCampaignDraftSnapshot = (userId, draftId, snapshot) => {
  if (!userId || !draftId || typeof window === 'undefined') return Promise.resolve();

  const key = `${userId}:${draftId}`;

  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(toJsonSafe(snapshot, new WeakSet(), true))
    );
  } catch (error) {
    // IndexedDB can still preserve the draft when localStorage is unavailable or full.
  }

  return queueIndexedDbWrite(key, snapshot);
};

export const loadCampaignDraftSnapshots = async (userId, draftId) => {
  if (!userId || !draftId || typeof window === 'undefined') return { local: null, indexedDb: null };

  const key = `${userId}:${draftId}`;

  let local = null;
  try {
    const value = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    local = value ? JSON.parse(value) : null;
  } catch (error) {
    local = null;
  }

  const indexedDb = await runIndexedDb('readonly', (store) => store.get(key)).catch(
    () => null
  );

  // Keep the old user-only snapshot readable for drafts created before ID-scoped backups.
  let legacyLocal = null;
  try {
    const value = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    legacyLocal = value ? JSON.parse(value) : null;
  } catch (error) {
    legacyLocal = null;
  }
  const legacyIndexedDb = await runIndexedDb('readonly', (store) => store.get(String(userId))).catch(
    () => null
  );

  return {
    local: local ? hydrateFiles(local, indexedDb) : null,
    indexedDb,
    legacyLocal: legacyLocal ? hydrateFiles(legacyLocal, legacyIndexedDb) : null,
    legacyIndexedDb,
  };
};

export const clearCampaignDraftSnapshots = async (userId, draftId) => {
  if (!userId || !draftId || typeof window === 'undefined') return;

  const key = `${userId}:${draftId}`;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    // Continue so IndexedDB is cleared when localStorage is unavailable.
  }

  await runIndexedDb('readwrite', (store) => store.delete(key)).catch(() => {});
};

export const clearLegacyCampaignDraftSnapshot = async (userId) => {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
  } catch (error) {
    // Continue so IndexedDB is still cleared.
  }
  await runIndexedDb('readwrite', (store) => store.delete(String(userId))).catch(() => {});
};
