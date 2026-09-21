import { useRef, useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  saveCampaignDraftSnapshot,
  loadCampaignDraftSnapshots,
  clearCampaignDraftSnapshots,
  serializeCampaignDraftValues,
  clearLegacyCampaignDraftSnapshot,
} from '../utils/campaign-draft-storage';

const DATE_FIELDS = ['campaignStartDate', 'campaignEndDate', 'postingStartDate', 'postingEndDate'];
const FILE_FIELDS = ['campaignImages', 'brandGuidelines', 'productImage1', 'productImage2', 'otherAttachments'];
const ARRAY_FIELDS = [
  'campaignIndustries', 'secondaryObjectives', 'campaignDo', 'campaignDont', 'countries',
  'audienceGender', 'audienceAge', 'audienceLanguage', 'audienceCreatorPersona',
  'secondaryAudienceGender', 'secondaryAudienceAge', 'secondaryAudienceLanguage',
  'secondaryAudienceCreatorPersona', 'products', 'locations', 'availabilityRules',
  'campaignManager', 'deliverables', 'timeline', 'socialMediaPlatform', 'contentFormat', ...FILE_FIELDS,
];
const PRIMITIVE_ARRAY_FIELDS = new Set([
  'campaignIndustries', 'secondaryObjectives', 'countries', 'audienceGender', 'audienceAge',
  'audienceLanguage', 'audienceCreatorPersona', 'secondaryAudienceGender', 'secondaryAudienceAge',
  'secondaryAudienceLanguage', 'secondaryAudienceCreatorPersona', 'deliverables',
  'socialMediaPlatform', 'contentFormat',
]);
const isFile = (value) => typeof File !== 'undefined' && value instanceof File;
const hasPendingFiles = (values) => FILE_FIELDS.some((field) => {
  const items = Array.isArray(values?.[field]) ? values[field] : [values?.[field]];
  return items.some(isFile);
});
const getTime = (value) => new Date(value?.updatedAt || 0).getTime() || 0;

const primitiveValue = (value) => {
  if (['string', 'number'].includes(typeof value)) return value;
  if (['string', 'number'].includes(typeof value?.value)) return value.value;
  if (['string', 'number'].includes(typeof value?.label)) return value.label;
  return null;
};

const restoreArrays = (values, defaults) => {
  const restored = { ...values };
  ARRAY_FIELDS.forEach((field) => {
    let rawItems = [];
    if (Array.isArray(restored[field])) rawItems = restored[field];
    else if (restored[field] != null) rawItems = [restored[field]];
    if (PRIMITIVE_ARRAY_FIELDS.has(field)) {
      restored[field] = rawItems.map(primitiveValue).filter((value) => value !== null);
    } else if (field === 'products') {
      restored[field] = rawItems
        .map((item) => (typeof item === 'string' ? { name: item } : item))
        .filter((item) => item && typeof item === 'object');
    } else if (field === 'locations') {
      restored[field] = rawItems
        .map((item) => (typeof item === 'string' ? { name: item, pic: '', contactNumber: '' } : item))
        .filter((item) => item && typeof item === 'object');
    } else {
      restored[field] = rawItems.filter((item) => isFile(item) || (item && typeof item === 'object'));
    }
    if (!restored[field].length && rawItems.length && defaults[field]?.length) restored[field] = defaults[field];
  });
  return restored;
};

const restoreSnapshotValues = (values, defaults) => {
  const restored = { ...values };
  DATE_FIELDS.forEach((field) => {
    if (restored[field] && !(restored[field] instanceof Date)) {
      const date = new Date(restored[field]);
      restored[field] = Number.isNaN(date.getTime()) ? null : date;
    }
  });
  const typed = restoreArrays(restored, defaults);
  return Object.fromEntries(Object.entries(typed).map(([field, value]) => {
    const defaultValue = defaults[field];
    if (typeof defaultValue === 'string' && typeof value !== 'string') return [field, defaultValue];
    if (typeof defaultValue === 'boolean' && typeof value !== 'boolean') return [field, defaultValue];
    return [field, value];
  }));
};

export default function useCampaignDraftAutosave({
  enabled, userId, methods, activeStep, showAdditionalDetails, setActiveStep, setShowAdditionalDetails,
}) {
  const [status, setStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const draftRef = useRef(null);
  const generationRef = useRef(0);
  const latestRef = useRef(null);
  const snapshotVersionRef = useRef(0);
  const timerRef = useRef(null);
  const createPromiseRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const storageWriteRef = useRef(Promise.resolve());
  const pendingSaveRef = useRef(false);
  const pendingLocalRef = useRef(false);
  const frozenRef = useRef(false);
  const fileUploadsRef = useRef(new WeakMap());
  const mountedRef = useRef(true);
  const readyRef = useRef(enabled);
  const { getValues, reset, setValue, watch, formState } = methods;
  const defaultsRef = useRef(getValues());

  useEffect(() => () => {
    mountedRef.current = false;
    clearTimeout(timerRef.current);
  }, []);

  const refreshDrafts = useCallback(async () => {
    if (!enabled || !userId) return [];
    const response = await axiosInstance.get(endpoints.campaignCreationDrafts.root);
    const next = response.data.drafts || [];
    if (mountedRef.current) setDrafts(next);
    return next;
  }, [enabled, userId]);

  // One promise is shared by every watcher callback until the server returns.
  const ensureDraft = useCallback(async () => {
    if (draftRef.current?.id) return draftRef.current;
    if (!createPromiseRef.current) {
      createPromiseRef.current = axiosInstance.post(endpoints.campaignCreationDrafts.root)
        .then((response) => {
          const { draft } = response.data;
          draftRef.current = draft;
          return draft;
        })
        .finally(() => { createPromiseRef.current = null; });
    }
    return createPromiseRef.current;
  }, []);

  const uploadFile = useCallback(async (file, context) => {
    const uploadsForFile = fileUploadsRef.current.get(file) || new Map();
    const previous = uploadsForFile.get(context.id);
    if (previous) return previous;
    const upload = axiosInstance.post(endpoints.campaignCreationDrafts.files(context.id), (() => {
      const data = new FormData();
      data.append('file', file);
      return data;
    })(), { headers: { 'Content-Type': 'multipart/form-data' } }).then((response) => response.data.file);
    uploadsForFile.set(context.id, upload);
    fileUploadsRef.current.set(file, uploadsForFile);
    upload.catch(() => uploadsForFile.delete(context.id));
    return upload;
  }, []);

  const saveSnapshot = useCallback(async (snapshot, context) => {
    if (!snapshot || !context?.id || generationRef.current !== context.generation) return null;
    setStatus('saving');
    try {
      const values = { ...snapshot.values };
      await Promise.all(FILE_FIELDS.map(async (field) => {
        const original = values[field];
        const items = Array.isArray(original) ? original : [original];
        if (!items.some(isFile)) return;
        const durable = await Promise.all(items.map((item) => (isFile(item) ? uploadFile(item, context) : item)));
        values[field] = Array.isArray(original) ? durable : durable[0];
        if (generationRef.current === context.generation) {
          const liveValue = getValues(field);
          const liveItems = Array.isArray(liveValue) ? liveValue : [liveValue];
          const replacements = new Map(items.map((item, index) => [item, durable[index]]));
          const nextLiveItems = liveItems.map((item) => replacements.get(item) || item);
          if (nextLiveItems.some((item, index) => item !== liveItems[index])) {
            setValue(field, Array.isArray(liveValue) ? nextLiveItems : nextLiveItems[0], {
              shouldDirty: true,
              shouldValidate: false,
            });
          }
        }
      }));
      const latest = latestRef.current;
      if (latest?.version === snapshot.version) {
        latestRef.current = { ...latest, values };
      } else if (latest) {
        const mergedValues = { ...latest.values };
        FILE_FIELDS.forEach((field) => {
          const oldItems = Array.isArray(snapshot.values[field]) ? snapshot.values[field] : [snapshot.values[field]];
          const durableItems = Array.isArray(values[field]) ? values[field] : [values[field]];
          const replacements = new Map(oldItems.map((item, index) => [item, durableItems[index]]));
          const currentItems = Array.isArray(latest.values[field]) ? latest.values[field] : [latest.values[field]];
          const mergedItems = currentItems.map((item) => replacements.get(item) || item);
          if (mergedItems.some((item, index) => item !== currentItems[index])) {
            mergedValues[field] = Array.isArray(latest.values[field]) ? mergedItems : mergedItems[0];
          }
        });
        latestRef.current = { ...latest, values: mergedValues };
      }
      if (generationRef.current !== context.generation || draftRef.current?.id !== context.id) return null;
      const response = await axiosInstance.put(endpoints.campaignCreationDrafts.update(context.id), {
        revision: context.revision,
        payload: serializeCampaignDraftValues(values),
        activeStep: snapshot.activeStep,
        showAdditionalDetails: snapshot.showAdditionalDetails,
      });
      if (generationRef.current !== context.generation || draftRef.current?.id !== context.id) return null;
      draftRef.current = response.data.draft;
      const isNewest = latestRef.current?.version === snapshot.version;
      if (mountedRef.current) {
        setLastSavedAt(new Date(draftRef.current.updatedAt || Date.now()));
        setStatus(isNewest ? 'saved' : 'local');
      }
      if (isNewest) {
        pendingSaveRef.current = false;
        pendingLocalRef.current = false;
      }
      refreshDrafts().catch(() => {});
      return { id: context.id, revision: draftRef.current.revision };
    } catch (error) {
      if (generationRef.current === context.generation && draftRef.current?.id === context.id) {
        const conflictDraft = error?.code === 'DRAFT_REVISION_CONFLICT' && error.draft;
        if (conflictDraft) {
          draftRef.current = conflictDraft;
          if (mountedRef.current) setStatus('conflict');
        } else if (mountedRef.current) setStatus('error');
      }
      throw error;
    }
  }, [getValues, refreshDrafts, setValue, uploadFile]);

  const enqueueSnapshot = useCallback((snapshot, immediate = false) => {
    if (!enabled || !userId || !readyRef.current || frozenRef.current || !formState.isDirty) return;
    snapshotVersionRef.current += 1;
    latestRef.current = { ...snapshot, version: snapshotVersionRef.current };
    snapshot = latestRef.current;
    pendingSaveRef.current = true;
    clearTimeout(timerRef.current);
    const schedule = () => {
      saveQueueRef.current = saveQueueRef.current.catch(() => {}).then(async () => {
        const contextDraft = await ensureDraft();
        storageWriteRef.current = saveCampaignDraftSnapshot(userId, contextDraft.id, snapshot);
        const current = draftRef.current?.id === contextDraft.id ? draftRef.current : await ensureDraft();
        const context = { id: current.id, revision: current.revision, generation: generationRef.current };
        return saveSnapshot(snapshot, context);
      });
      return saveQueueRef.current;
    };
    setStatus('local');
    timerRef.current = setTimeout(() => schedule().catch(() => {}), immediate || hasPendingFiles(snapshot.values) ? 0 : 3000);
  }, [enabled, ensureDraft, formState.isDirty, saveSnapshot, userId]);

  const persist = useCallback((values, step = activeStep, details = showAdditionalDetails, immediate = false) => {
    enqueueSnapshot({ updatedAt: new Date().toISOString(), values, activeStep: step, showAdditionalDetails: details }, immediate);
  }, [activeStep, enqueueSnapshot, showAdditionalDetails]);

  const drain = useCallback(async () => {
    clearTimeout(timerRef.current);
    await saveQueueRef.current;
    await storageWriteRef.current;
  }, []);

  const flush = useCallback(async (force = false) => {
    clearTimeout(timerRef.current);
    if (!enabled || !userId) return null;
    if (!force && !formState.isDirty && !pendingSaveRef.current && !pendingLocalRef.current) {
      await drain();
      return draftRef.current ? { id: draftRef.current.id, revision: draftRef.current.revision } : null;
    }
    const snapshot = {
      updatedAt: new Date().toISOString(),
      values: getValues(),
      activeStep,
      showAdditionalDetails,
      version: snapshotVersionRef.current + 1,
    };
    snapshotVersionRef.current = snapshot.version;
    latestRef.current = snapshot;
    const draft = await ensureDraft();
    storageWriteRef.current = saveCampaignDraftSnapshot(userId, draft.id, snapshot);
    saveQueueRef.current = saveQueueRef.current.catch(() => {}).then(async () => {
      const current = draftRef.current?.id === draft.id ? draftRef.current : await ensureDraft();
      return saveSnapshot(snapshot, {
        id: current.id,
        revision: current.revision,
        generation: generationRef.current,
      });
    });
    const source = await Promise.all([storageWriteRef.current, saveQueueRef.current]).then(([, result]) => result);
    return source || { id: draft.id, revision: draft.revision };
  }, [activeStep, drain, enabled, ensureDraft, formState.isDirty, getValues, saveSnapshot, showAdditionalDetails, userId]);

  const freezeAndFlush = useCallback(async () => {
    frozenRef.current = true;
    clearTimeout(timerRef.current);
    pendingSaveRef.current = true;
    try {
      const source = await flush(true);
      await drain();
      return source;
    } catch (error) {
      frozenRef.current = false;
      throw error;
    }
  }, [drain, flush]);

  const resumeAutosave = useCallback(() => {
    frozenRef.current = false;
  }, []);

  const loadDraft = useCallback(async (id) => {
    await drain();
    const nextGeneration = generationRef.current + 1;
    generationRef.current = nextGeneration;
    const response = await axiosInstance.get(endpoints.campaignCreationDrafts.detail(id));
    if (generationRef.current !== nextGeneration) return;
    const { draft } = response.data;
    const stored = await loadCampaignDraftSnapshots(userId, id);
    const backendSnapshot = { updatedAt: draft.updatedAt, values: draft.payload || {}, activeStep: draft.activeStep, showAdditionalDetails: draft.showAdditionalDetails };
    const scoped = [stored.indexedDb, stored.local].filter(Boolean);
    const useLegacy = !scoped.length && draft.legacyFileStorage === true;
    let fallback = scoped;
    if (!fallback.length && useLegacy) fallback = [stored.legacyIndexedDb, stored.legacyLocal].filter(Boolean);
    const snapshot = [...fallback, backendSnapshot].filter(Boolean).sort((a, b) => getTime(b) - getTime(a))[0];
    const usedLegacy = useLegacy && fallback.includes(snapshot);
    const hasNewerLocal = scoped.some((item) => getTime(item) > getTime(backendSnapshot));
    draftRef.current = draft;
    reset({ ...getValues(), ...restoreSnapshotValues(snapshot.values, defaultsRef.current) });
    setActiveStep(Number.isInteger(snapshot.activeStep) ? snapshot.activeStep : 0);
    setShowAdditionalDetails(Boolean(snapshot.showAdditionalDetails));
    latestRef.current = snapshot;
    storageWriteRef.current = saveCampaignDraftSnapshot(userId, id, snapshot);
    pendingLocalRef.current = hasNewerLocal || usedLegacy;
    pendingSaveRef.current = pendingLocalRef.current;
    setLastSavedAt(new Date(snapshot.updatedAt));
    setStatus(pendingLocalRef.current ? 'local' : 'saved');
    if (usedLegacy) await clearLegacyCampaignDraftSnapshot(userId);
  }, [drain, getValues, reset, setActiveStep, setShowAdditionalDetails, userId]);

  useEffect(() => {
    if (!enabled || !userId) return undefined;
    refreshDrafts().catch(() => {});
    readyRef.current = true;
    const subscription = watch((values) => persist(values));
    return () => subscription.unsubscribe();
  }, [enabled, persist, refreshDrafts, userId, watch]);

  useEffect(() => {
    persist(getValues(), activeStep, showAdditionalDetails, true);
  }, [activeStep, getValues, persist, showAdditionalDetails]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;
    const handlePageHide = () => {
      if (latestRef.current && draftRef.current?.id) saveCampaignDraftSnapshot(userId, draftRef.current.id, latestRef.current);
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [enabled, userId]);

  const clearLocalDraft = useCallback(async (id) => {
    await clearCampaignDraftSnapshots(userId, id);
  }, [userId]);

  const discardDraft = useCallback(async () => {
    await drain().catch(() => {});
    const id = draftRef.current?.id;
    if (id) await axiosInstance.delete(endpoints.campaignCreationDrafts.delete(id));
    await clearLocalDraft(id);
    draftRef.current = null;
    latestRef.current = null;
    setStatus('idle');
    setLastSavedAt(null);
    refreshDrafts().catch(() => {});
  }, [clearLocalDraft, drain, refreshDrafts]);

  const deleteDraft = useCallback(async (id) => {
    if (draftRef.current?.id === id) await discardDraft();
    else {
      await axiosInstance.delete(endpoints.campaignCreationDrafts.delete(id));
      await clearLocalDraft(id);
      await refreshDrafts();
    }
  }, [clearLocalDraft, discardDraft, refreshDrafts]);

  return {
    status, lastSavedAt, flush, freezeAndFlush, resumeAutosave, discardDraft, clearLocalDraft, drafts, refreshDrafts, loadDraft,
    deleteDraft, draftId: draftRef.current?.id || null, draftRevision: draftRef.current?.revision || null,
  };
}
