import axios from 'axios';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { setStorage, getStorage, removeStorage } from 'src/hooks/use-local-storage';

import { PCR_DRAFT_STORAGE_PREFIX, PCR_EDITOR_SESSION_STORAGE_PREFIX } from '../constants';

const REDIS_DEBOUNCE_MS = 2000;
const DB_FLUSH_INTERVAL_MS = 120000;
const RETRY_INTERVAL_MS = 15000;

export const getPcrEditorSessionId = (userId, campaignId) => {
  if (!userId || !campaignId || typeof window === 'undefined') return null;

  const key = `${PCR_EDITOR_SESSION_STORAGE_PREFIX}${userId}-${campaignId}`;
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
  } catch (error) {
    // Continue with an in-memory tab session when storage is blocked.
  }

  let sessionId;
  if (window.crypto?.randomUUID) {
    sessionId = window.crypto.randomUUID();
  } else if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    sessionId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  } else {
    sessionId = Math.random().toString(36).slice(2);
  }

  try {
    window.sessionStorage.setItem(key, sessionId);
  } catch (error) {
    // The session ID still protects this mounted editor instance.
  }
  return sessionId;
};

export const pcrDraftStorageKey = (userId, sessionId, campaignId) =>
  `${PCR_DRAFT_STORAGE_PREFIX}${userId}-${sessionId}-${campaignId}`;

const isConflict = (error) => error?.response?.status === 409;

/**
 * Keep one local copy and one ordered, session-scoped Redis draft. Redis writes
 * are serialized so an old response cannot replace a newer editor revision.
 */
export default function usePcrAutosave({
  userId,
  campaignId,
  editorSessionId,
  isClientView,
  isLoadingPCR,
  isLoadError,
  pcrRevision,
  initialDraftRevision,
  restoredRemoteDraft,
  editableContent,
  sectionOrder,
  sectionVisibility,
  showEducatorCard,
  showThirdCard,
  showFourthCard,
  showFifthCard,
  onPcrRevisionUpdate,
  onDraftConflict,
  initialConflict,
  onRecoverAsCopy,
  onDiscardConflict,
}) {
  const [lastAutosavedAt, setLastAutosavedAt] = useState(null);
  const [conflictDraft, setConflictDraft] = useState(null);
  const [isAutosaveBlocked, setIsAutosaveBlocked] = useState(false);

  const mountedRef = useRef(true);
  const campaignGenerationRef = useRef(0);
  const initialisedRef = useRef(false);
  const lastObservedJsonRef = useRef(null);
  const lastSyncedJsonRef = useRef(null);
  const lastFlushedJsonRef = useRef(null);
  const latestEnvelopeRef = useRef(null);
  const latestJsonRef = useRef(null);
  const inFlightRef = useRef(null);
  const flushInFlightRef = useRef(false);
  const queuedEnvelopeRef = useRef(null);
  const redisTimerRef = useRef(null);
  const retryRef = useRef(false);
  const draftRevisionRef = useRef(0);
  const basePcrRevisionRef = useRef(null);
  const acceptedDraftRevisionRef = useRef(0);
  const flushedDraftRevisionRef = useRef(0);
  const flushedPcrRevisionRef = useRef(null);
  const conflictDraftRef = useRef(null);
  const autosaveBlockedRef = useRef(false);

  const draftPayload = useMemo(
    () => ({
      ...editableContent,
      sectionOrder,
      sectionVisibility,
      showEducatorCard,
      showThirdCard,
      showFourthCard,
      showFifthCard,
    }),
    [
      editableContent,
      sectionOrder,
      sectionVisibility,
      showEducatorCard,
      showThirdCard,
      showFourthCard,
      showFifthCard,
    ]
  );
  const draftJson = useMemo(() => JSON.stringify(draftPayload), [draftPayload]);
  latestJsonRef.current = draftJson;

  const isActive = Boolean(
    userId && campaignId && editorSessionId && !isClientView && !isLoadingPCR && !isLoadError && pcrRevision && !isAutosaveBlocked
  );
  const storageKey = useMemo(
    () => (userId && editorSessionId && campaignId
      ? pcrDraftStorageKey(userId, editorSessionId, campaignId)
      : null),
    [userId, editorSessionId, campaignId]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // A campaign change starts a completely new autosave stream. Do not allow
  // an old request or old baseline to affect the next campaign.
  useEffect(() => {
    campaignGenerationRef.current += 1;
    initialisedRef.current = false;
    lastObservedJsonRef.current = null;
    lastSyncedJsonRef.current = null;
    lastFlushedJsonRef.current = null;
    latestEnvelopeRef.current = null;
    inFlightRef.current = null;
    flushInFlightRef.current = false;
    queuedEnvelopeRef.current = null;
    draftRevisionRef.current = 0;
    basePcrRevisionRef.current = null;
    acceptedDraftRevisionRef.current = 0;
    flushedDraftRevisionRef.current = 0;
    flushedPcrRevisionRef.current = null;
    retryRef.current = false;
    conflictDraftRef.current = null;
    autosaveBlockedRef.current = false;
    setConflictDraft(null);
    setIsAutosaveBlocked(false);
    setLastAutosavedAt(null);
    if (redisTimerRef.current) clearTimeout(redisTimerRef.current);
    redisTimerRef.current = null;
  }, [campaignId, userId, editorSessionId]);

  const registerConflict = useCallback((conflict) => {
    if (!conflict?.content || (conflict.campaignId && conflict.campaignId !== campaignId)) return;
    const maxDraftRevision = Math.max(
      conflict.maxDraftRevision || 0,
      conflict.draftRevision || 0,
      conflict.currentDraftRevision || 0,
    );
    const retained = {
      ...conflict,
      campaignId,
      maxDraftRevision,
      json: conflict.json || JSON.stringify(conflict.content),
    };
    conflictDraftRef.current = retained;
    autosaveBlockedRef.current = true;
    setConflictDraft(retained);
    setIsAutosaveBlocked(true);
    retryRef.current = false;
    queuedEnvelopeRef.current = null;
    onDraftConflict?.(retained);
  }, [campaignId, onDraftConflict]);

  useEffect(() => {
    if (initialConflict && !conflictDraftRef.current) registerConflict(initialConflict);
  }, [initialConflict, registerConflict]);

  const startRedisPut = useCallback((envelope) => {
    if (!envelope || !campaignId || !editorSessionId) return;

    const generation = campaignGenerationRef.current;
    inFlightRef.current = { envelope, generation };

    axios.put(`/api/campaign/${campaignId}/pcr/drafts/${editorSessionId}`, {
      content: envelope.content,
      draftRevision: envelope.draftRevision,
      basePcrRevision: envelope.basePcrRevision,
    }).then((response) => {
      if (!mountedRef.current || generation !== campaignGenerationRef.current) return;

      const savedRevision = response.data?.data?.draft?.draftRevision ?? envelope.draftRevision;
      const remoteContent = response.data?.data?.draft?.content;
      const remoteJson = remoteContent ? JSON.stringify(remoteContent) : null;
      if (savedRevision >= acceptedDraftRevisionRef.current && remoteJson === envelope.json) {
        acceptedDraftRevisionRef.current = savedRevision;
        lastSyncedJsonRef.current = envelope.json;
        retryRef.current = false;
      } else {
        retryRef.current = true;
      }
    }).catch((error) => {
      if (!mountedRef.current || generation !== campaignGenerationRef.current) return;
      if (isConflict(error)) {
        retryRef.current = false;
        registerConflict({
          content: envelope.content,
          draftRevision: envelope.draftRevision,
          basePcrRevision: envelope.basePcrRevision,
          currentDraftRevision: error.response?.data?.currentDraftRevision,
          currentPcrRevision: error.response?.data?.currentPcrRevision,
        });
      } else {
        retryRef.current = true;
      }
    }).finally(() => {
      if (!mountedRef.current || generation !== campaignGenerationRef.current) return;
      inFlightRef.current = null;

      const queued = queuedEnvelopeRef.current;
      queuedEnvelopeRef.current = null;
      if (!autosaveBlockedRef.current && queued && queued.draftRevision > acceptedDraftRevisionRef.current) {
        startRedisPut(queued);
      }
    });
  }, [campaignId, editorSessionId, registerConflict]);

  const queueRedisPut = useCallback((envelope, immediate = false) => {
    if (inFlightRef.current || flushInFlightRef.current) {
      if (!queuedEnvelopeRef.current || envelope.draftRevision > queuedEnvelopeRef.current.draftRevision) {
        queuedEnvelopeRef.current = envelope;
      }
      return;
    }

    if (redisTimerRef.current) clearTimeout(redisTimerRef.current);
    redisTimerRef.current = setTimeout(() => {
      redisTimerRef.current = null;
      if (latestEnvelopeRef.current?.draftRevision === envelope.draftRevision) {
        startRedisPut(envelope);
      }
    }, immediate ? 0 : REDIS_DEBOUNCE_MS);
  }, [startRedisPut]);

  // The first state after a successful load is the baseline. Later changes
  // receive an increasing revision and are written to localStorage immediately.
  useEffect(() => {
    if (!isActive) return;

    if (!initialisedRef.current) {
      initialisedRef.current = true;
      draftRevisionRef.current = Number.isInteger(initialDraftRevision) ? initialDraftRevision : 0;
      basePcrRevisionRef.current = pcrRevision;
      lastObservedJsonRef.current = draftJson;
      const remoteDraftMatches = Boolean(
        restoredRemoteDraft &&
        restoredRemoteDraft.draftRevision === draftRevisionRef.current &&
        restoredRemoteDraft.basePcrRevision === pcrRevision &&
        JSON.stringify(restoredRemoteDraft.content) === draftJson
      );
      acceptedDraftRevisionRef.current = remoteDraftMatches ? draftRevisionRef.current : 0;
      if (draftRevisionRef.current > 0) {
        const restoredEnvelope = {
          content: JSON.parse(draftJson),
          json: draftJson,
          draftRevision: draftRevisionRef.current,
          basePcrRevision: pcrRevision,
        };
        latestEnvelopeRef.current = restoredEnvelope;
        lastSyncedJsonRef.current = remoteDraftMatches ? draftJson : null;
        lastFlushedJsonRef.current = null;
        flushedDraftRevisionRef.current = 0;
        flushedPcrRevisionRef.current = null;
        if (!remoteDraftMatches) queueRedisPut(restoredEnvelope, true);
      } else {
        lastSyncedJsonRef.current = draftJson;
        lastFlushedJsonRef.current = draftJson;
        flushedDraftRevisionRef.current = 0;
        flushedPcrRevisionRef.current = pcrRevision;
      }
      return;
    }

    // A successful session flush rebases the same draft to the new PCR row.
    if (basePcrRevisionRef.current !== pcrRevision && latestEnvelopeRef.current) {
      basePcrRevisionRef.current = pcrRevision;
      latestEnvelopeRef.current = {
        ...latestEnvelopeRef.current,
        basePcrRevision: pcrRevision,
      };
    }

    if (draftJson === lastObservedJsonRef.current) return;

    draftRevisionRef.current += 1;
    basePcrRevisionRef.current = pcrRevision;
    const envelope = {
      content: JSON.parse(draftJson),
      json: draftJson,
      draftRevision: draftRevisionRef.current,
      basePcrRevision: pcrRevision,
    };
    latestEnvelopeRef.current = envelope;
    lastObservedJsonRef.current = draftJson;

    // This write is deliberately not debounced. It is the offline-safe copy.
    if (storageKey) {
      setStorage(storageKey, {
        content: envelope.content,
        campaignId,
        editorSessionId,
        draftRevision: envelope.draftRevision,
        basePcrRevision: envelope.basePcrRevision,
      });
    }
    queueRedisPut(envelope);
  }, [
    draftJson,
    campaignId,
    editorSessionId,
    initialDraftRevision,
    restoredRemoteDraft,
    isActive,
    pcrRevision,
    queueRedisPut,
    storageKey,
  ]);

  // Retry only failed transport writes. A revision conflict is surfaced and
  // never silently retried with a different revision.
  useEffect(() => {
    if (!isActive) return undefined;
    const intervalId = setInterval(() => {
      if (!retryRef.current || inFlightRef.current || queuedEnvelopeRef.current) return;
      const envelope = latestEnvelopeRef.current;
      if (envelope && envelope.draftRevision > acceptedDraftRevisionRef.current) {
        queueRedisPut(envelope, true);
      }
    }, RETRY_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isActive, queueRedisPut]);

  // Flush only an ordered, fully accepted draft. The next interval retries if
  // a PUT is still in flight, so a flush can never save an older payload.
  useEffect(() => {
    if (!isActive) return undefined;

    const intervalId = setInterval(async () => {
      const envelope = latestEnvelopeRef.current;
      if (!envelope || inFlightRef.current || queuedEnvelopeRef.current) return;
      if (acceptedDraftRevisionRef.current < envelope.draftRevision) return;
      if (lastSyncedJsonRef.current !== envelope.json) return;
      if (
        flushedDraftRevisionRef.current >= envelope.draftRevision &&
        flushedPcrRevisionRef.current === envelope.basePcrRevision
      ) return;

      const generation = campaignGenerationRef.current;
      try {
        flushInFlightRef.current = true;
        const response = await axios.post(
          `/api/campaign/${campaignId}/pcr/drafts/${editorSessionId}/flush`,
          {
            expectedDraftRevision: envelope.draftRevision,
            expectedPcrRevision: envelope.basePcrRevision,
          }
        );
        const result = response.data?.data;
        if (mountedRef.current && generation === campaignGenerationRef.current && result?.flushed) {
          flushedDraftRevisionRef.current = envelope.draftRevision;
          flushedPcrRevisionRef.current = result.pcrRevision;
          lastFlushedJsonRef.current = envelope.json;
          basePcrRevisionRef.current = result.pcrRevision;
          if (latestEnvelopeRef.current?.basePcrRevision === envelope.basePcrRevision) {
            latestEnvelopeRef.current = {
              ...latestEnvelopeRef.current,
              basePcrRevision: result.pcrRevision,
            };
          }
          if (queuedEnvelopeRef.current?.basePcrRevision === envelope.basePcrRevision) {
            queuedEnvelopeRef.current = {
              ...queuedEnvelopeRef.current,
              basePcrRevision: result.pcrRevision,
            };
          }
          onPcrRevisionUpdate?.(result.pcrRevision);
          setLastAutosavedAt(new Date());
          if (storageKey) {
            const local = getStorage(storageKey);
            if (local?.basePcrRevision === envelope.basePcrRevision) {
              setStorage(storageKey, { ...local, basePcrRevision: result.pcrRevision });
            }
          }
        }
      } catch (error) {
        if (mountedRef.current && generation === campaignGenerationRef.current && isConflict(error)) {
          registerConflict({
            content: envelope.content,
            draftRevision: envelope.draftRevision,
            basePcrRevision: envelope.basePcrRevision,
            currentDraftRevision: error.response?.data?.currentDraftRevision,
            currentPcrRevision: error.response?.data?.currentPcrRevision,
          });
        }
      } finally {
        if (generation === campaignGenerationRef.current) {
          flushInFlightRef.current = false;
          const queued = queuedEnvelopeRef.current;
          queuedEnvelopeRef.current = null;
          if (!autosaveBlockedRef.current && queued && queued.draftRevision > acceptedDraftRevisionRef.current) {
            startRedisPut(queued);
          }
        }
      }
    }, DB_FLUSH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [campaignId, editorSessionId, isActive, onPcrRevisionUpdate, registerConflict, startRedisPut, storageKey]);

  const recoverConflict = useCallback(() => {
    const conflict = conflictDraftRef.current;
    if (!conflict) return false;

    const basePcrRevision = conflict.currentPcrRevision || pcrRevision;
    const draftRevision = Math.max(conflict.maxDraftRevision || 0, conflict.draftRevision || 0) + 1;
    const json = JSON.stringify(conflict.content);
    const envelope = { content: conflict.content, json, draftRevision, basePcrRevision };

    initialisedRef.current = true;
    autosaveBlockedRef.current = false;
    setIsAutosaveBlocked(false);
    conflictDraftRef.current = null;
    setConflictDraft(null);
    draftRevisionRef.current = draftRevision;
    basePcrRevisionRef.current = basePcrRevision;
    acceptedDraftRevisionRef.current = draftRevision - 1;
    flushedDraftRevisionRef.current = 0;
    flushedPcrRevisionRef.current = null;
    lastObservedJsonRef.current = json;
    lastSyncedJsonRef.current = null;
    lastFlushedJsonRef.current = null;
    latestEnvelopeRef.current = envelope;
    if (storageKey) {
      setStorage(storageKey, {
        content: conflict.content,
        campaignId,
        editorSessionId,
        draftRevision,
        basePcrRevision,
      });
    }
    onPcrRevisionUpdate?.(basePcrRevision);
    onRecoverAsCopy?.(conflict.content);
    queueRedisPut(envelope, true);
    return true;
  }, [campaignId, editorSessionId, onPcrRevisionUpdate, onRecoverAsCopy, pcrRevision, queueRedisPut, storageKey]);

  const discardConflict = useCallback(async () => {
    const conflict = conflictDraftRef.current;
    if (!conflict || !campaignId || !editorSessionId) return false;

    try {
      if (conflict.maxDraftRevision > 0) {
        await axios.delete(`/api/campaign/${campaignId}/pcr/drafts/${editorSessionId}`, {
          params: { expectedDraftRevision: conflict.maxDraftRevision },
        });
      }
      if (storageKey) removeStorage(storageKey);
      const currentJson = latestJsonRef.current;
      conflictDraftRef.current = null;
      autosaveBlockedRef.current = false;
      setConflictDraft(null);
      setIsAutosaveBlocked(false);
      initialisedRef.current = true;
      draftRevisionRef.current = conflict.maxDraftRevision || draftRevisionRef.current;
      basePcrRevisionRef.current = conflict.currentPcrRevision || pcrRevision;
      acceptedDraftRevisionRef.current = draftRevisionRef.current;
      lastObservedJsonRef.current = currentJson;
      lastSyncedJsonRef.current = currentJson;
      lastFlushedJsonRef.current = currentJson;
      latestEnvelopeRef.current = null;
      retryRef.current = false;
      onPcrRevisionUpdate?.(basePcrRevisionRef.current);
      onDiscardConflict?.();
      return true;
    } catch (error) {
      if (isConflict(error)) {
        registerConflict({
          ...conflict,
          currentDraftRevision: error.response?.data?.currentDraftRevision,
          currentPcrRevision: error.response?.data?.currentPcrRevision,
        });
      }
      return false;
    }
  }, [campaignId, editorSessionId, onDiscardConflict, onPcrRevisionUpdate, pcrRevision, registerConflict, storageKey]);

  useEffect(() => {
    if (!isActive) return undefined;
    const handleBeforeUnload = (event) => {
      if (latestJsonRef.current === lastFlushedJsonRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive]);

  const clearDraft = useCallback(async (savedJson) => {
    const envelope = latestEnvelopeRef.current;
    if (!campaignId || !editorSessionId) return false;
    if (savedJson && envelope?.json !== savedJson) return false;

    const expectedDraftRevision = envelope?.draftRevision;
    if (redisTimerRef.current) clearTimeout(redisTimerRef.current);
    queuedEnvelopeRef.current = null;

    try {
      if (expectedDraftRevision) {
        await axios.delete(`/api/campaign/${campaignId}/pcr/drafts/${editorSessionId}`, {
          params: { expectedDraftRevision },
        });
      }
      if (storageKey && (!savedJson || latestJsonRef.current === savedJson)) removeStorage(storageKey);
      lastSyncedJsonRef.current = latestJsonRef.current;
      lastFlushedJsonRef.current = latestJsonRef.current;
      latestEnvelopeRef.current = null;
      retryRef.current = false;
      setLastAutosavedAt(null);
      return true;
    } catch (error) {
      if (isConflict(error) && envelope) {
        registerConflict({
          content: envelope.content,
          draftRevision: envelope.draftRevision,
          basePcrRevision: envelope.basePcrRevision,
          currentDraftRevision: error.response?.data?.currentDraftRevision,
          currentPcrRevision: error.response?.data?.currentPcrRevision,
        });
      }
      return false;
    }
  }, [campaignId, editorSessionId, registerConflict, storageKey]);

  const getDraftState = useCallback(() => ({
    draftRevision: latestEnvelopeRef.current?.draftRevision ?? draftRevisionRef.current,
    basePcrRevision: latestEnvelopeRef.current?.basePcrRevision ?? basePcrRevisionRef.current,
    json: latestEnvelopeRef.current?.json ?? latestJsonRef.current,
  }), []);

  return {
    editorSessionId,
    lastAutosavedAt,
    draftRevision: draftRevisionRef.current,
    conflictDraft,
    isAutosaveBlocked,
    recoverConflict,
    discardConflict,
    getDraftState,
    clearDraft,
  };
}
