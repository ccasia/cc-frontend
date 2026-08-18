import { useRef, useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  saveCampaignDraftSnapshot,
  loadCampaignDraftSnapshots,
  clearCampaignDraftSnapshots,
  serializeCampaignDraftValues,
} from '../utils/campaign-draft-storage';

const DATE_FIELDS = ['campaignStartDate', 'campaignEndDate', 'postingStartDate', 'postingEndDate'];
const FILE_FIELDS = [
  'campaignImages',
  'brandGuidelines',
  'productImage1',
  'productImage2',
  'otherAttachments',
];
const ARRAY_FIELDS = [
  'campaignIndustries',
  'secondaryObjectives',
  'campaignDo',
  'campaignDont',
  'countries',
  'audienceGender',
  'audienceAge',
  'audienceLanguage',
  'audienceCreatorPersona',
  'secondaryAudienceGender',
  'secondaryAudienceAge',
  'secondaryAudienceLanguage',
  'secondaryAudienceCreatorPersona',
  'products',
  'locations',
  'availabilityRules',
  'campaignManager',
  'deliverables',
  'timeline',
  'socialMediaPlatform',
  'contentFormat',
  ...FILE_FIELDS,
];
const PRIMITIVE_ARRAY_FIELDS = new Set([
  'campaignIndustries',
  'secondaryObjectives',
  'countries',
  'audienceGender',
  'audienceAge',
  'audienceLanguage',
  'audienceCreatorPersona',
  'secondaryAudienceGender',
  'secondaryAudienceAge',
  'secondaryAudienceLanguage',
  'secondaryAudienceCreatorPersona',
  'deliverables',
  'socialMediaPlatform',
  'contentFormat',
]);

const isFile = (value) => typeof File !== 'undefined' && value instanceof File;

const hasPendingFiles = (values) =>
  FILE_FIELDS.some((field) => {
    const value = values?.[field];
    return (Array.isArray(value) ? value : [value]).some(isFile);
  });

const getTime = (snapshot) => {
  const time = new Date(snapshot?.updatedAt || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const restoreDates = (values) => {
  const restored = { ...values };
  DATE_FIELDS.forEach((field) => {
    if (restored[field] && !(restored[field] instanceof Date)) {
      const date = new Date(restored[field]);
      restored[field] = Number.isNaN(date.getTime()) ? null : date;
    }
  });
  return restored;
};

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
      return;
    }

    if (field === 'products') {
      restored[field] = rawItems
        .map((item) => (typeof item === 'string' ? { name: item } : item))
        .filter((item) => item && typeof item === 'object' && typeof item.name === 'string');
    } else if (field === 'locations') {
      restored[field] = rawItems
        .map((item) =>
          typeof item === 'string' ? { name: item, pic: '', contactNumber: '' } : item
        )
        .filter((item) => item && typeof item === 'object' && typeof item.name === 'string');
    } else {
      restored[field] = rawItems.filter(
        (item) => isFile(item) || (item && typeof item === 'object' && Object.keys(item).length > 0)
      );
    }

    if (restored[field].length === 0 && rawItems.length > 0 && defaults[field]?.length) {
      restored[field] = defaults[field];
    }
  });
  return restored;
};

const restoreValueTypes = (values, defaults) =>
  Object.fromEntries(
    Object.entries(values).map(([field, value]) => {
      const defaultValue = defaults[field];
      if (typeof defaultValue === 'string' && typeof value !== 'string') {
        return [field, defaultValue];
      }
      if (typeof defaultValue === 'boolean' && typeof value !== 'boolean') {
        return [field, defaultValue];
      }
      return [field, value];
    })
  );

const restoreFilePreviews = (values) => {
  const restored = { ...values };
  FILE_FIELDS.forEach((field) => {
    if (!Array.isArray(restored[field])) return;
    restored[field] = restored[field].map((file) => {
      if (!isFile(file) || file.preview) return file;
      Object.assign(file, { preview: URL.createObjectURL(file) });
      return file;
    });
  });
  return restored;
};

const fromBackend = (draft) =>
  draft
    ? {
        updatedAt: draft.updatedAt,
        values: draft.payload || {},
        activeStep: draft.activeStep,
        showAdditionalDetails: draft.showAdditionalDetails,
      }
    : null;

export default function useCampaignDraftAutosave({
  enabled,
  userId,
  methods,
  activeStep,
  showAdditionalDetails,
  setActiveStep,
  setShowAdditionalDetails,
}) {
  const [status, setStatus] = useState(enabled ? 'restoring' : 'idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const readyRef = useRef(false);
  const draftRef = useRef(null);
  const timerRef = useRef(null);
  const latestRef = useRef(null);
  const storageWriteRef = useRef(Promise.resolve());
  const backendWriteRef = useRef(Promise.resolve());
  const fileUploadsRef = useRef(new WeakMap());
  const mountedRef = useRef(true);
  const { getValues, reset, setValue, watch } = methods;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  const ensureDraft = useCallback(async () => {
    if (draftRef.current?.id) return draftRef.current;
    const created = await axiosInstance.post(endpoints.campaignCreationDrafts.root);
    draftRef.current = created.data.draft;
    return draftRef.current;
  }, []);

  const uploadFile = useCallback(
    async (file) => {
      const existingUpload = fileUploadsRef.current.get(file);
      if (existingUpload) return existingUpload;

      const upload = (async () => {
        const draft = await ensureDraft();
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(
          endpoints.campaignCreationDrafts.files(draft.id),
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data.file;
      })().catch((error) => {
        fileUploadsRef.current.delete(file);
        throw error;
      });

      fileUploadsRef.current.set(file, upload);
      return upload;
    },
    [ensureDraft]
  );

  const makeFilesDurable = useCallback(
    async (snapshot) => {
      if (!hasPendingFiles(snapshot.values)) return snapshot;

      const values = { ...snapshot.values };
      await Promise.all(
        FILE_FIELDS.map(async (field) => {
          const current = values[field];
          if (!current) return;
          const items = Array.isArray(current) ? current : [current];
          const durableItems = await Promise.all(
            items.map((item) => (isFile(item) ? uploadFile(item) : item))
          );
          values[field] = Array.isArray(current) ? durableItems : durableItems[0];
          const replacements = new Map(items.map((item, index) => [item, durableItems[index]]));
          const liveValue = getValues(field);
          const liveItems = Array.isArray(liveValue) ? liveValue : [liveValue];
          const nextLiveItems = liveItems.map((item) => replacements.get(item) || item);
          if (nextLiveItems.some((item, index) => item !== liveItems[index])) {
            setValue(field, Array.isArray(liveValue) ? nextLiveItems : nextLiveItems[0], {
              shouldDirty: true,
              shouldValidate: false,
            });
          }
        })
      );

      return { ...snapshot, values };
    },
    [getValues, setValue, uploadFile]
  );

  const putSnapshot = useCallback(
    async (snapshot, canRetryConflict = true) => {
      if (!snapshot) return;

      if (mountedRef.current) setStatus('saving');
      try {
        const draft = await ensureDraft();
        const durableSnapshot = await makeFilesDurable(snapshot);
        const response = await axiosInstance.put(
          endpoints.campaignCreationDrafts.update(draft.id),
          {
            revision: draftRef.current.revision,
            payload: serializeCampaignDraftValues(durableSnapshot.values),
            activeStep: durableSnapshot.activeStep,
            showAdditionalDetails: durableSnapshot.showAdditionalDetails,
          }
        );
        draftRef.current = response.data.draft;
        const savedAt = new Date(response.data.draft.updatedAt || Date.now());
        if (mountedRef.current) {
          setLastSavedAt(savedAt);
          setStatus(getTime(latestRef.current) > getTime(durableSnapshot) ? 'local' : 'saved');
        }
      } catch (error) {
        if (error?.code === 'DRAFT_REVISION_CONFLICT' && error.draft) {
          draftRef.current = error.draft;
          if (canRetryConflict) {
            await putSnapshot(snapshot, false);
            return;
          }
          if (mountedRef.current) setStatus('conflict');
        } else if (mountedRef.current) {
          setStatus('local');
        }
      }
    },
    [ensureDraft, makeFilesDurable]
  );

  const persist = useCallback(
    (values, step = activeStep, details = showAdditionalDetails) => {
      if (!enabled || !userId || !readyRef.current) return;

      const snapshot = {
        updatedAt: new Date().toISOString(),
        values,
        activeStep: step,
        showAdditionalDetails: details,
      };
      latestRef.current = snapshot;
      storageWriteRef.current = saveCampaignDraftSnapshot(userId, snapshot);
      setStatus('local');

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => {
          backendWriteRef.current = backendWriteRef.current.then(() => putSnapshot(snapshot));
        },
        hasPendingFiles(values) ? 0 : 700
      );
    },
    [activeStep, enabled, putSnapshot, showAdditionalDetails, userId]
  );

  useEffect(() => {
    if (!enabled || !userId) return undefined;

    let cancelled = false;
    setStatus('restoring');

    const restore = async () => {
      const [backendDraft, stored] = await Promise.all([
        axiosInstance
          .get(endpoints.campaignCreationDrafts.active)
          .then((response) => response.data.draft)
          .catch(() => null),
        loadCampaignDraftSnapshots(userId),
      ]);
      if (cancelled) return;

      let activeDraft = backendDraft;
      if (!activeDraft) {
        activeDraft = await axiosInstance
          .post(endpoints.campaignCreationDrafts.root)
          .then((response) => response.data.draft)
          .catch(() => null);
      }
      if (cancelled) return;

      draftRef.current = activeDraft;
      const backendSnapshot = fromBackend(activeDraft);
      const newest = [stored.indexedDb, stored.local, backendSnapshot]
        .filter(Boolean)
        .sort((a, b) => getTime(b) - getTime(a))[0];

      if (newest) {
        const currentValues = getValues();
        const restoredValues = restoreValueTypes(
          restoreFilePreviews(restoreArrays(restoreDates(newest.values), currentValues)),
          currentValues
        );
        const restoredSnapshot = {
          ...newest,
          updatedAt: new Date().toISOString(),
          values: restoredValues,
        };
        reset({
          ...currentValues,
          ...restoredValues,
        });
        setActiveStep(Number.isInteger(newest.activeStep) ? newest.activeStep : 0);
        setShowAdditionalDetails(Boolean(newest.showAdditionalDetails));
        latestRef.current = restoredSnapshot;
        storageWriteRef.current = saveCampaignDraftSnapshot(userId, restoredSnapshot);
        setLastSavedAt(new Date(restoredSnapshot.updatedAt));
      }

      readyRef.current = true;
      setStatus(newest ? 'saved' : 'idle');

      if (latestRef.current && getTime(latestRef.current) > getTime(backendSnapshot)) {
        backendWriteRef.current = backendWriteRef.current.then(() =>
          putSnapshot(latestRef.current)
        );
      }
    };

    restore();
    return () => {
      cancelled = true;
      readyRef.current = false;
    };
  }, [enabled, getValues, putSnapshot, reset, setActiveStep, setShowAdditionalDetails, userId]);

  useEffect(() => {
    if (!enabled) return undefined;
    const subscription = watch((values) => persist(values));
    return () => subscription.unsubscribe();
  }, [enabled, persist, watch]);

  useEffect(() => {
    persist(getValues(), activeStep, showAdditionalDetails);
  }, [activeStep, getValues, persist, showAdditionalDetails]);

  const flush = useCallback(async () => {
    if (!enabled || !readyRef.current) return;
    clearTimeout(timerRef.current);
    backendWriteRef.current = backendWriteRef.current.then(() => putSnapshot(latestRef.current));
    await Promise.all([storageWriteRef.current, backendWriteRef.current]);
  }, [enabled, putSnapshot]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const handlePageHide = () => {
      const snapshot = latestRef.current;
      const draft = draftRef.current;
      if (!snapshot || !draft?.id) return;

      saveCampaignDraftSnapshot(userId, snapshot);
      try {
        const baseUrl = axiosInstance.defaults.baseURL || window.location.origin;
        const url = new URL(endpoints.campaignCreationDrafts.update(draft.id), baseUrl);
        fetch(url, {
          method: 'PUT',
          credentials: 'include',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            revision: draft.revision,
            payload: serializeCampaignDraftValues(snapshot.values),
            activeStep: snapshot.activeStep,
            showAdditionalDetails: snapshot.showAdditionalDetails,
          }),
        }).catch(() => {});
      } catch (error) {
        // The synchronous browser snapshot is still available when the keepalive request cannot start.
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [enabled, userId]);

  const clearDraft = useCallback(async () => {
    clearTimeout(timerRef.current);
    readyRef.current = false;
    await Promise.all([storageWriteRef.current, backendWriteRef.current]);
    const draftId = draftRef.current?.id;
    draftRef.current = null;
    latestRef.current = null;
    await Promise.all([
      clearCampaignDraftSnapshots(userId),
      draftId
        ? axiosInstance.delete(endpoints.campaignCreationDrafts.delete(draftId)).catch(() => {})
        : Promise.resolve(),
    ]);
    if (mountedRef.current) {
      setLastSavedAt(null);
      setStatus('idle');
    }
  }, [userId]);

  return { status, lastSavedAt, flush, clearDraft };
}
