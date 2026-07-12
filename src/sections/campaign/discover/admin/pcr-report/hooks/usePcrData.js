import axios from 'axios';
import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';

// Applies a loaded PCR content payload (from initial load or post-save reload) to editor state.
function applyLoadedContent(loadedContent, setters) {
  const {
    setEditableContent,
    setSectionOrder,
    setSectionVisibility,
    setShowEducatorCard,
    setShowThirdCard,
    setShowFourthCard,
    setShowFifthCard,
  } = setters;

  setEditableContent(loadedContent);

  if (loadedContent.sectionOrder) {
    setSectionOrder(loadedContent.sectionOrder);
  }
  if (loadedContent.sectionVisibility) {
    setSectionVisibility(loadedContent.sectionVisibility);
  }

  // Restore card visibility states based on saved data - check if any field has content
  const hasEducatorContent = Boolean((loadedContent.educatorTitle && loadedContent.educatorTitle.trim() !== '') ||
                            (loadedContent.educatorContentStyle && loadedContent.educatorContentStyle.trim() !== ''));
  const hasThirdContent = Boolean((loadedContent.thirdTitle && loadedContent.thirdTitle.trim() !== '') ||
                         (loadedContent.thirdContentStyle && loadedContent.thirdContentStyle.trim() !== ''));
  const hasFourthContent = Boolean((loadedContent.fourthTitle && loadedContent.fourthTitle.trim() !== '') ||
                          (loadedContent.fourthContentStyle && loadedContent.fourthContentStyle.trim() !== ''));
  const hasFifthContent = Boolean((loadedContent.fifthTitle && loadedContent.fifthTitle.trim() !== '') ||
                         (loadedContent.fifthContentStyle && loadedContent.fifthContentStyle.trim() !== ''));

  setShowEducatorCard(hasEducatorContent);
  setShowThirdCard(hasThirdContent);
  setShowFourthCard(hasFourthContent);
  setShowFifthCard(hasFifthContent);
}

// Loads, saves, and manages the ready-state of a campaign's PCR report.
export default function usePcrData({
  campaign,
  onCampaignUpdate,
  editableContent,
  setEditableContent,
  sectionOrder,
  setSectionOrder,
  sectionVisibility,
  setSectionVisibility,
  setShowEducatorCard,
  setShowThirdCard,
  setShowFourthCard,
  setShowFifthCard,
  setIsEditMode,
  setSectionEditStates,
  resetHistory,
}) {
  const [isLoadingPCR, setIsLoadingPCR] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPCRReady, setIsPCRReady] = useState(campaign?.isPCRReady || false);

  const cardSetters = {
    setEditableContent,
    setSectionOrder,
    setSectionVisibility,
    setShowEducatorCard,
    setShowThirdCard,
    setShowFourthCard,
    setShowFifthCard,
  };

  // Load PCR data from backend
  useEffect(() => {
    const loadPCRData = async () => {
      if (!campaign?.id) return;

      try {
        setIsLoadingPCR(true);
        const response = await axios.get(`/api/campaign/${campaign.id}/pcr`);

        if (response.data.success && response.data.data.content) {
          applyLoadedContent(response.data.data.content, cardSetters);
        }
      } catch (error) {
        console.error('❌ Error loading PCR data:', error);
      } finally {
        setIsLoadingPCR(false);
      }
    };

    loadPCRData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id]);

  const handleSavePCR = async () => {
    if (!campaign?.id) return;

    try {
      setIsSaving(true);

      const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
        content: {
          ...editableContent,
          sectionOrder,
          sectionVisibility,
        },
      });

      if (response.data.success) {
        enqueueSnackbar('PCR saved successfully', { variant: 'success' });
        setIsEditMode(false);
        resetHistory();
        setSectionEditStates({
          campaignDescription: false,
          engagement: false,
          platformBreakdown: false,
          views: false,
          audienceSentiment: false,
          creatorTiers: false,
          strategies: false,
          recommendations: false,
        });

        // Reload PCR data to ensure display shows the saved content
        try {
          const loadResponse = await axios.get(`/api/campaign/${campaign.id}/pcr`);
          if (loadResponse.data.success && loadResponse.data.data.content) {
            applyLoadedContent(loadResponse.data.data.content, cardSetters);
          }
        } catch (loadError) {
          console.error('Error reloading PCR data after save:', loadError);
        }
      }
    } catch (error) {
      console.error('Error saving PCR data:', error);
      enqueueSnackbar(`Failed to save PCR: ${error.response?.data?.message || error.message}`, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Manual refresh function for insights
  const handleRefreshInsights = async () => {
    try {
      await axios.post(`/api/campaign/${campaign.id}/trends/refresh`);
      alert('Insights refreshed! Please wait a moment and refresh the page.');
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing insights:', error);
      alert(`Failed to refresh insights: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleMarkAsReady = async () => {
    try {
      const response = await axios.patch(`/api/campaign/${campaign.id}/pcr-ready`, {
        isPCRReady: true
      });

      if (response.data.success) {
        setIsPCRReady(true);
        onCampaignUpdate?.({ ...campaign, isPCRReady: true });
        enqueueSnackbar('PCR Report marked as ready for client view', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error marking PCR as ready:', error);
      enqueueSnackbar('Failed to mark PCR as ready', { variant: 'error' });
    }
  };

  const handleMarkAsUnready = async () => {
    try {
      const response = await axios.patch(`/api/campaign/${campaign.id}/pcr-ready`, {
        isPCRReady: false
      });

      if (response.data.success) {
        setIsPCRReady(false);
        onCampaignUpdate?.({ ...campaign, isPCRReady: false });
        enqueueSnackbar('PCR Report marked as not ready', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error marking PCR as unready:', error);
      enqueueSnackbar('Failed to mark PCR as unready', { variant: 'error' });
    }
  };

  return {
    isLoadingPCR,
    isSaving,
    setIsSaving,
    isPCRReady,
    handleSavePCR,
    handleRefreshInsights,
    handleMarkAsReady,
    handleMarkAsUnready,
  };
}
