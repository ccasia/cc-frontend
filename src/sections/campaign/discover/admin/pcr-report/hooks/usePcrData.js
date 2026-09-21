import axios from 'axios';
import { useState, useEffect, useCallback, useRef } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';

import { getStorage } from 'src/hooks/use-local-storage';

import axiosInstance from 'src/utils/axios';

import { pcrDraftStorageKey } from './usePcrAutosave';
import { DEFAULT_EDITABLE_CONTENT, DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from '../constants';

const EMPTY_SECTION_EDIT_STATES = {
  campaignDescription: false,
  engagement: false,
  platformBreakdown: false,
  views: false,
  audienceSentiment: false,
  creatorTiers: false,
  strategies: false,
  recommendations: false,
};

const hasContent = (value) => typeof value === 'string' && value.trim() !== '';

const normalizeRevision = (value) => {
  const revision = Number(value);
  return Number.isFinite(revision) && revision > 0 ? revision : null;
};

function applyLoadedContent(loadedContent, setters, cardOverrides) {
  const {
    setEditableContent,
    setSectionOrder,
    setSectionVisibility,
    setShowEducatorCard,
    setShowThirdCard,
    setShowFourthCard,
    setShowFifthCard,
  } = setters;

  setEditableContent({ ...DEFAULT_EDITABLE_CONTENT, ...loadedContent });
  setSectionOrder(loadedContent.sectionOrder || DEFAULT_SECTION_ORDER);
  setSectionVisibility({ ...DEFAULT_SECTION_VISIBILITY, ...(loadedContent.sectionVisibility || {}) });

  setShowEducatorCard(cardOverrides?.showEducatorCard ?? loadedContent.showEducatorCard ?? (
    hasContent(loadedContent.educatorTitle) || hasContent(loadedContent.educatorContentStyle)
  ));
  setShowThirdCard(cardOverrides?.showThirdCard ?? loadedContent.showThirdCard ?? (
    hasContent(loadedContent.thirdTitle) || hasContent(loadedContent.thirdContentStyle)
  ));
  setShowFourthCard(cardOverrides?.showFourthCard ?? loadedContent.showFourthCard ?? (
    hasContent(loadedContent.fourthTitle) || hasContent(loadedContent.fourthContentStyle)
  ));
  setShowFifthCard(cardOverrides?.showFifthCard ?? loadedContent.showFifthCard ?? (
    hasContent(loadedContent.fifthTitle) || hasContent(loadedContent.fifthContentStyle)
  ));
}

const isUsableDraft = (draft, campaignId, pcrRevision) => Boolean(
  draft?.content &&
  draft.campaignId === campaignId &&
  Number.isInteger(draft.draftRevision) &&
  draft.draftRevision > 0 &&
  draft.basePcrRevision === pcrRevision
);

// Choose by ordered draft revision only. savedAt is not a conflict selector.
const chooseDraft = (localDraft, remoteDraft) => {
  if (!localDraft) return remoteDraft;
  if (!remoteDraft) return localDraft;
  return localDraft.draftRevision >= remoteDraft.draftRevision ? localDraft : remoteDraft;
};

export default function usePcrData({
  campaign,
  userId,
  editorSessionId,
  onCampaignUpdate,
  isClientView,
  bumpHydrationVersion,
  clearDraft,
  getDraftState,
  editableContent,
  setEditableContent,
  sectionOrder,
  setSectionOrder,
  sectionVisibility,
  setSectionVisibility,
  showEducatorCard,
  showThirdCard,
  showFourthCard,
  showFifthCard,
  setShowEducatorCard,
  setShowThirdCard,
  setShowFourthCard,
  setShowFifthCard,
  setIsEditMode,
  setSectionEditStates,
  resetHistory,
  onDraftConflict,
  onStaleDraft,
}) {
  const queryClient = useQueryClient();
  const [isLoadingPCR, setIsLoadingPCR] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPCRReady, setIsPCRReady] = useState(campaign?.isPCRReady || false);
  const [pcrRevision, setPcrRevision] = useState(null);
  const [loadedDraftRevision, setLoadedDraftRevision] = useState(0);
  const [restoredRemoteDraft, setRestoredRemoteDraft] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [draftConflict, setDraftConflict] = useState(null);
  const [draftConflictPayload, setDraftConflictPayload] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const requestGenerationRef = useRef(0);
  const requestControllerRef = useRef(null);

  const resetEditor = useCallback(() => {
    setEditableContent(DEFAULT_EDITABLE_CONTENT);
    setSectionOrder(DEFAULT_SECTION_ORDER);
    setSectionVisibility(DEFAULT_SECTION_VISIBILITY);
    setShowEducatorCard(false);
    setShowThirdCard(false);
    setShowFourthCard(false);
    setShowFifthCard(false);
    setIsEditMode(false);
    setSectionEditStates(EMPTY_SECTION_EDIT_STATES);
    resetHistory();
  }, [
    resetHistory,
    setEditableContent,
    setIsEditMode,
    setSectionEditStates,
    setSectionOrder,
    setSectionVisibility,
    setShowEducatorCard,
    setShowFifthCard,
    setShowFourthCard,
    setShowThirdCard,
  ]);

  const loadPCRData = useCallback(async () => {
    if (!campaign?.id) {
      setIsLoadingPCR(false);
      setLoadError(null);
      return;
    }

    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsLoadingPCR(true);
    setLoadError(null);
    setDraftConflict(null);
    setDraftConflictPayload(null);
    setRestoredRemoteDraft(null);
    resetEditor();

    const cardSetters = {
      setEditableContent,
      setSectionOrder,
      setSectionVisibility,
      setShowEducatorCard,
      setShowThirdCard,
      setShowFourthCard,
      setShowFifthCard,
    };

    try {
      const pcrResponse = await axiosInstance.get(`/api/campaign/${campaign.id}/pcr`, {
        signal: controller.signal,
      });
      if (generation !== requestGenerationRef.current) return;

      const pcrData = pcrResponse.data?.data || {};
      const revision = normalizeRevision(pcrData.revision);
      const serverContent = pcrData.content;
      setPcrRevision(revision);
      setIsPCRReady(Boolean(pcrData.isPCRReady ?? campaign.isPCRReady));

      if (!revision) {
        setLoadError('PCR report could not load.');
        setIsEditMode(false);
        return;
      }

      let remoteDraft = null;
      if (!isClientView && userId && editorSessionId && revision) {
        try {
          const draftResponse = await axiosInstance.get(
            `/api/campaign/${campaign.id}/pcr/drafts/${editorSessionId}`,
            { signal: controller.signal }
          );
          remoteDraft = draftResponse.data?.data?.draft || null;
        } catch (draftError) {
          if (controller.signal.aborted) throw draftError;
          // The saved PCR is still usable when Redis is unavailable. Local
          // storage remains the offline copy and autosave will retry.
        }
      }

      if (generation !== requestGenerationRef.current) return;

      const localDraft = !isClientView && userId && editorSessionId && revision
        ? getStorage(pcrDraftStorageKey(userId, editorSessionId, campaign.id))
        : null;
      const localIsUsable = isUsableDraft(localDraft, campaign.id, revision);
      const remoteIsUsable = isUsableDraft(remoteDraft, campaign.id, revision);
      setRestoredRemoteDraft(remoteIsUsable ? {
        content: remoteDraft.content,
        draftRevision: remoteDraft.draftRevision,
        basePcrRevision: remoteDraft.basePcrRevision,
      } : null);
      const conflictedDraft = [localDraft, remoteDraft]
        .filter((draft) => draft?.content && draft.basePcrRevision !== revision)
        .sort((a, b) => b.draftRevision - a.draftRevision)[0];

      if (conflictedDraft && !localIsUsable && !remoteIsUsable) {
        const conflict = {
          campaignId: campaign.id,
          content: conflictedDraft.content,
          draftRevision: conflictedDraft.draftRevision,
          maxDraftRevision: conflictedDraft.draftRevision,
          basePcrRevision: conflictedDraft.basePcrRevision,
          currentPcrRevision: revision,
        };
        // Never restore an older revision. Discard only this session's stale
        // local/remote draft and reset autosave without showing a conflict UI.
        onStaleDraft?.(conflict);
      }

      const draft = chooseDraft(localIsUsable ? localDraft : null, remoteIsUsable ? remoteDraft : null);
      if (draft?.content) {
        applyLoadedContent(draft.content, cardSetters, {
          showEducatorCard: draft.content.showEducatorCard,
          showThirdCard: draft.content.showThirdCard,
          showFourthCard: draft.content.showFourthCard,
          showFifthCard: draft.content.showFifthCard,
        });
        setLoadedDraftRevision(draft.draftRevision);
        bumpHydrationVersion?.();
        enqueueSnackbar('Restored your unsaved PCR changes.', { variant: 'info' });
      } else {
        setLoadedDraftRevision(0);
        setRestoredRemoteDraft(null);
        if (serverContent) applyLoadedContent(serverContent, cardSetters);
      }
    } catch (error) {
      if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
      console.error('Error loading PCR data:', error);
      setLoadError(error?.response?.data?.message || 'PCR report could not load.');
      setPcrRevision(null);
      setIsEditMode(false);
    } finally {
      if (generation === requestGenerationRef.current) setIsLoadingPCR(false);
    }

  }, [
    bumpHydrationVersion,
    campaign?.id,
    campaign?.isPCRReady,
    editorSessionId,
    isClientView,
    onStaleDraft,
    resetEditor,
    setIsEditMode,
    setEditableContent,
    setSectionOrder,
    setSectionVisibility,
    setShowEducatorCard,
    setShowThirdCard,
    setShowFourthCard,
    setShowFifthCard,
    userId,
  ]);

  useEffect(() => {
    requestGenerationRef.current += 1;
    setPcrRevision(null);
    setLoadedDraftRevision(0);
    setIsPCRReady(Boolean(campaign?.isPCRReady));
    setDraftConflict(null);
    loadPCRData();
    return () => {
      requestGenerationRef.current += 1;
      requestControllerRef.current?.abort();
    };
    // The request is intentionally restarted only when its campaign changes or
    // the retry action increments retryToken.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id, isClientView, retryToken]);

  const handleSavePCR = async () => {
    if (!campaign?.id || isClientView || isLoadingPCR || loadError || !pcrRevision) return null;

    const content = {
      ...editableContent,
      sectionOrder,
      sectionVisibility,
      showEducatorCard,
      showThirdCard,
      showFourthCard,
      showFifthCard,
    };
    const savedJson = JSON.stringify(content);
    const draftState = getDraftState?.();
    const body = {
      content,
      expectedPcrRevision: pcrRevision,
      editorSessionId,
    };
    if (draftState?.draftRevision > 0) body.expectedDraftRevision = draftState.draftRevision;

    try {
      setIsSaving(true);
      const response = await axios.put(`/api/campaign/${campaign.id}/pcr`, body);
      const saved = response.data?.data;
      setPcrRevision(saved?.revision ?? pcrRevision + 1);
      await clearDraft?.(savedJson);
      setIsEditMode(false);
      resetHistory();
      setSectionEditStates(EMPTY_SECTION_EDIT_STATES);
      enqueueSnackbar('PCR saved successfully.', { variant: 'success' });
      return response;
    } catch (error) {
      if (error?.response?.status === 409) {
        const conflictDraftState = getDraftState?.();
        const conflict = {
          campaignId: campaign.id,
          content,
          draftRevision: conflictDraftState?.draftRevision || 1,
          maxDraftRevision: Math.max(
            conflictDraftState?.draftRevision || 1,
            error.response.data?.currentDraftRevision || 0
          ),
          basePcrRevision: conflictDraftState?.basePcrRevision || pcrRevision,
          currentPcrRevision: error.response.data?.currentPcrRevision || pcrRevision,
        };
        setDraftConflict('This PCR changed in another session. Your local work is still here.');
        setDraftConflictPayload(conflict);
        onDraftConflict?.(conflict);
      }
      console.error('Error saving PCR data:', error);
      enqueueSnackbar(error?.response?.data?.message || 'PCR could not be saved. Your local work was kept.', {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshInsights = async () => {
    try {
      await axios.post(`/api/campaign/${campaign.id}/trends/refresh`);
      await queryClient.invalidateQueries({ queryKey: ['socialInsightSnapshots', campaign.id] });
      enqueueSnackbar('Analytics updated.', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(`Failed to refresh insights: ${error.response?.data?.message || error.message}`, {
        variant: 'error',
      });
    }
  };

  const handleMarkAsReady = async () => {
    try {
      const response = await axios.patch(`/api/campaign/${campaign.id}/pcr-ready`, { isPCRReady: true });
      if (response.data.success) {
        setIsPCRReady(true);
        onCampaignUpdate?.({ ...campaign, isPCRReady: true });
        enqueueSnackbar('PCR Report marked as ready for client view', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to mark PCR as ready', { variant: 'error' });
    }
  };

  const handleMarkAsUnready = async () => {
    try {
      const response = await axios.patch(`/api/campaign/${campaign.id}/pcr-ready`, { isPCRReady: false });
      if (response.data.success) {
        setIsPCRReady(false);
        onCampaignUpdate?.({ ...campaign, isPCRReady: false });
        enqueueSnackbar('PCR Report marked as not ready', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to mark PCR as unready', { variant: 'error' });
    }
  };

  return {
    isLoadingPCR,
    isSaving,
    setIsSaving,
    isPCRReady,
    pcrRevision,
    setPcrRevision,
    loadedDraftRevision,
    restoredRemoteDraft,
    loadError,
    draftConflict,
    draftConflictPayload,
    clearDraftConflict: () => {
      setDraftConflict(null);
      setDraftConflictPayload(null);
    },
    retryLoad: () => setRetryToken((value) => value + 1),
    handleSavePCR,
    handleRefreshInsights,
    handleMarkAsReady,
    handleMarkAsUnready,
  };
}
