/* eslint-disable no-nested-ternary */
/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/media-has-caption */
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import EmptyContent from 'src/components/empty-content/empty-content';

import Photos from './firstDraft/photos';
import DraftVideos from './firstDraft/draft-videos';
import RawFootages from './firstDraft/raw-footage';
// import StatusBanner from './firstDraft/status-banner';
// import FeedbackDisplay from './firstDraft/feedback-display';
import { VideoModal, PhotoModal } from './firstDraft/media-modals';
import { ConfirmationApproveModal, ConfirmationRequestModal } from './firstDraft/confirmation-modals';

const FirstDraft = ({ campaign, submission, creator, deliverablesData }) => {
  const { deliverables, deliverableMutate, submissionMutate } = deliverablesData;
  const { user } = useAuthContext();

  // Modal states
  const [selectedTab, setSelectedTab] = useState('videos');

  // Video modal states
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Photo modal states
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Draft video modal states
  const [draftVideoModalOpen, setDraftVideoModalOpen] = useState(false);
  const [currentDraftVideoIndex, setCurrentDraftVideoIndex] = useState(0);

  // Confirmation modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [currentSectionType, setCurrentSectionType] = useState('video');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const checkSubmissionReadiness = async () => {
    try {
      const response = await axiosInstance.get(
        endpoints.submission.admin.checkSubmissionReadiness(submission.id)
      );
      
      if (response.data.isReady) {
        console.log('Submission is ready for final review');
        
        // Update submission status to PENDING_REVIEW if it's currently IN_PROGRESS
        if (submission.status === 'IN_PROGRESS') {
          await axiosInstance.patch(endpoints.submission.admin.updateSubmissionStatus, {
            submissionId: submission.id,
            status: 'PENDING_REVIEW',
          });
          
          // Refresh the data
          await deliverableMutate();
          
          enqueueSnackbar('Submission is now ready for final review!', { 
            variant: 'success' 
          });
        }
      }
    } catch (error) {
      console.error('Error checking submission readiness:', error);
    }
  };

  const onSectionUpdated = async () => {
    try {
      await deliverableMutate();
      await checkSubmissionReadiness();
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  // Individual media update function that refreshes both deliverables and submissions
  const onIndividualMediaUpdated = async () => {
    try {
      await Promise.all([
        deliverableMutate(),
        submissionMutate && submissionMutate()
      ].filter(Boolean));
    } catch (error) {
      console.error('Error updating individual media:', error);
    }
  };

  // Check if all sections are approved and activate posting if needed
  const checkAndActivatePosting = async (selectedDueDate) => {
    try {
      console.log('🔍 Checking if all sections are approved...');
      
      // Wait a moment for the data to be refreshed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Re-fetch the latest deliverables to check current status
      await deliverableMutate();
      
      // Fetch fresh deliverables data directly from API
      const freshDeliverablesResponse = await axiosInstance.get(
        `/api/submission/deliverables/${creator?.user?.id}/${campaign?.id}`
      );
      const currentDeliverables = freshDeliverablesResponse.data;
      
      console.log('📊 Current deliverables status:', {
        videos: currentDeliverables?.videos?.map(v => ({ id: v.id, status: v.status })),
        photos: currentDeliverables?.photos?.map(p => ({ id: p.id, status: p.status })),
        rawFootages: currentDeliverables?.rawFootages?.map(r => ({ id: r.id, status: r.status }))
      });
      
      // Check if all sections are approved
      const videosApproved = !currentDeliverables?.videos?.length || 
        currentDeliverables.videos.every(video => video.status === 'APPROVED');
      const rawFootagesApproved = !currentDeliverables?.rawFootages?.length || 
        currentDeliverables.rawFootages.every(footage => footage.status === 'APPROVED');
      const photosApproved = !currentDeliverables?.photos?.length || 
        currentDeliverables.photos.every(photo => photo.status === 'APPROVED');

      const allSectionsApproved = videosApproved && rawFootagesApproved && photosApproved;

      console.log('✅ Section approval status:', {
        videosApproved,
        rawFootagesApproved,
        photosApproved,
        allSectionsApproved,
        submissionType: submission.submissionType?.type,
        currentStatus: submission.status
      });

      if (allSectionsApproved && submission.submissionType?.type === 'FIRST_DRAFT') {
        console.log('🚀 All sections approved, updating submission status and activating posting...');
        
        // Use the selected due date if provided, otherwise default to 7 days from now
        const dueDate = selectedDueDate 
          ? new Date(selectedDueDate).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        console.log('📅 Using due date:', dueDate);
        
        // Update submission to APPROVED using the correct endpoint
        const response = await axiosInstance.patch('/api/submission/status', {
          submissionId: submission.id,
          status: 'APPROVED',
          updatePosting: true, // This flag tells the backend to activate posting
          dueDate: dueDate,
        });

        console.log('📝 Submission status update response:', response.data);

        // Refresh data
        await Promise.all([
          deliverableMutate(),
          submissionMutate && submissionMutate()
        ].filter(Boolean));

        console.log('🎉 Successfully activated posting submission!');
        enqueueSnackbar('All sections approved!', { 
          variant: 'success' 
        });
      } else {
        console.log('⏳ Not all sections approved yet or not a first draft submission');
      }
    } catch (error) {
      console.error('❌ Error checking and activating posting:', error);
      enqueueSnackbar('Error activating posting submission', { variant: 'error' });
    }
  };

  // V2 Individual Media Management Functions
  const handleIndividualPhotoApprove = async (mediaId, feedback) => {
    try {
      const response = await axiosInstance.patch(endpoints.submission.admin.v2.photos, {
        mediaId,
        status: 'APPROVED',
        feedback,
        preventStatusChange: true,
      });

      await onIndividualMediaUpdated();
      await checkAndActivatePosting(null);
      enqueueSnackbar('Photo approved successfully!', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error approving photo:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error approving photo', { 
        variant: 'error' 
      });
      throw error;
    }
  };

  const handleIndividualPhotoRequestChange = async (mediaId, feedback, reasons) => {
    try {
      const response = await axiosInstance.patch(endpoints.submission.admin.v2.photos, {
        mediaId,
        status: 'CHANGES_REQUIRED',
        feedback,
        reasons: reasons || [],
        preventStatusChange: true,
      });

      await onIndividualMediaUpdated();
      enqueueSnackbar('Changes requested for photo', { variant: 'warning' });
      return response.data;
    } catch (error) {
      console.error('Error requesting photo changes:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error requesting changes', { 
        variant: 'error' 
      });
      throw error;
    }
  };

  const handleIndividualVideoApprove = async (mediaId, feedback, dueDate) => {
    try {
      const response = await axiosInstance.patch(endpoints.submission.admin.v2.videos, {
        mediaId,
        status: 'APPROVED',
        feedback,
        preventStatusChange: true,
      });

      await onIndividualMediaUpdated();
      await checkAndActivatePosting(dueDate);
      enqueueSnackbar('Video approved successfully!', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error approving video:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error approving video', { 
        variant: 'error' 
      });
      throw error;
    }
  };

  const handleIndividualVideoRequestChange = async (mediaId, feedback, reasons) => {
    try {
      const response = await axiosInstance.patch(endpoints.submission.admin.v2.videos, {
        mediaId,
        status: 'CHANGES_REQUIRED',
        feedback,
        reasons: reasons || [],
        preventStatusChange: true,
      });

      await onIndividualMediaUpdated();
      enqueueSnackbar('Changes requested for video', { variant: 'warning' });
      return response.data;
    } catch (error) {
      console.error('Error requesting video changes:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error requesting changes', { 
        variant: 'error' 
      });
      throw error;
    }
  };

  const handleIndividualRawFootageApprove = async (mediaId, feedback) => {
    try {
      const response = await axiosInstance.patch(endpoints.submission.admin.v2.rawFootages, {
        mediaId,
        status: 'APPROVED',
        feedback,
        preventStatusChange: true,
      });

      await onIndividualMediaUpdated();
      await checkAndActivatePosting(null);
      enqueueSnackbar('Raw footage approved successfully!', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error approving raw footage:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error approving raw footage', { 
        variant: 'error' 
      });
      throw error;
    }
  };

  const handleIndividualRawFootageRequestChange = async (mediaId, feedback, reasons) => {
    try {
      const response = await axiosInstance.patch(endpoints.submission.admin.v2.rawFootages, {
        mediaId,
        status: 'CHANGES_REQUIRED',
        feedback,
        reasons: reasons || [],
        preventStatusChange: true,
      });

      await onIndividualMediaUpdated();
      enqueueSnackbar('Changes requested for raw footage', { variant: 'warning' });
      return response.data;
    } catch (error) {
      console.error('Error requesting raw footage changes:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error requesting changes', { 
        variant: 'error' 
      });
      throw error;
    }
  };

  // Modal handlers
  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setFullImageOpen(true);
  };

  const handleFullImageClose = () => {
    setFullImageOpen(false);
  };

  const handlePrevImage = (event) => {
    event.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? deliverables.photos.length - 1 : prev - 1
    );
  };

  const handleNextImage = (event) => {
    event.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === deliverables.photos.length - 1 ? 0 : prev + 1
    );
  };

  const handleVideoClick = (index) => {
    setCurrentVideoIndex(index);
    setVideoModalOpen(true);
  };

  const handleDraftVideoClick = (index) => {
    setCurrentDraftVideoIndex(index);
    setDraftVideoModalOpen(true);
  };

  // Determine available tabs based on deliverables
  const availableTabs = useMemo(() => {
    const tabs = [];
  if (deliverables?.videos?.length > 0) {
      tabs.push({ value: 'videos', count: deliverables.videos.length });
  }
  if (deliverables?.rawFootages?.length > 0) {
      tabs.push({ value: 'rawFootages', count: deliverables.rawFootages.length });
  }
  if (deliverables?.photos?.length > 0) {
      tabs.push({ value: 'photos', count: deliverables.photos.length });
  }
    return tabs;
  }, [deliverables?.videos?.length, deliverables?.rawFootages?.length, deliverables?.photos?.length]);

  // Set initial tab if current tab is not available
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(tab => tab.value === selectedTab)) {
      setSelectedTab(availableTabs[0].value);
    }
  }, [availableTabs, selectedTab]);

  // Helper functions to check approval status
  const isVideosApproved = () => 
    deliverables?.videos?.length > 0 && 
    deliverables.videos.every(video => video.status === 'APPROVED');

  const isRawFootagesApproved = () => 
    deliverables?.rawFootages?.length > 0 && 
    deliverables.rawFootages.every(footage => footage.status === 'APPROVED');

  const isPhotosApproved = () => 
    deliverables?.photos?.length > 0 && 
    deliverables.photos.every(photo => photo.status === 'APPROVED');

  // Helper functions to check if any item has changes required
  const hasVideosChangesRequired = () => 
    deliverables?.videos?.length > 0 && 
    deliverables.videos.some(video => video.status === 'REVISION_REQUESTED');

  const hasRawFootagesChangesRequired = () => 
    deliverables?.rawFootages?.length > 0 && 
    deliverables.rawFootages.some(footage => footage.status === 'REVISION_REQUESTED');

  const hasPhotosChangesRequired = () => 
    deliverables?.photos?.length > 0 && 
    deliverables.photos.some(photo => photo.status === 'REVISION_REQUESTED');

  const getTabBorderColor = (tabType) => {
    if (submission?.status === 'PENDING_REVIEW') return '#FFC702';
    
    switch (tabType) {
      case 'videos':
        if (hasVideosChangesRequired()) return '#D4321C'; // Red for changes required
        return isVideosApproved() ? '#1ABF66' : 'divider'; // Green for all approved, gray for pending
      case 'rawFootages':
        if (hasRawFootagesChangesRequired()) return '#D4321C'; // Red for changes required
        return isRawFootagesApproved() ? '#1ABF66' : 'divider'; // Green for all approved, gray for pending
      case 'photos':
        if (hasPhotosChangesRequired()) return '#D4321C'; // Red for changes required
        return isPhotosApproved() ? '#1ABF66' : 'divider'; // Green for all approved, gray for pending
      default:
        return 'divider';
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'videos':
        return (
          <DraftVideos
            campaign={campaign}
            submission={submission}
            deliverables={deliverables}
            onVideoClick={handleDraftVideoClick}
            onSubmit={onSubmitDraftVideo}
            isDisabled={isDisabled}
            // V2 individual handlers
            onIndividualApprove={handleIndividualVideoApprove}
            onIndividualRequestChange={handleIndividualVideoRequestChange}
          />
        );
      case 'rawFootages':
        return (
          <RawFootages
            campaign={campaign}
            submission={submission}
            deliverables={deliverables}
            onVideoClick={handleVideoClick}
            onSubmit={onSubmitRawFootage}
            isDisabled={isDisabled}
            // V2 individual handlers
            onIndividualApprove={handleIndividualRawFootageApprove}
            onIndividualRequestChange={handleIndividualRawFootageRequestChange}
          />
        );
      case 'photos':
        return (
          <Photos
            campaign={campaign}
            submission={submission}
            deliverables={deliverables}
            onImageClick={handleImageClick}
            onSubmit={onSubmitPhotos}
            isDisabled={isDisabled}
            // V2 individual handlers
            onIndividualApprove={handleIndividualPhotoApprove}
            onIndividualRequestChange={handleIndividualPhotoRequestChange}
          />
        );
      default:
        return null;
    }
  };

  // Confirmation modal handlers
  const handleApproveModalOpen = (sectionType) => {
    setCurrentSectionType(sectionType);
    setApproveModalOpen(true);
  };

  const handleRequestModalOpen = (sectionType) => {
    setCurrentSectionType(sectionType);
    setRequestModalOpen(true);
  };

  // Draft Video submission handler
  const onSubmitDraftVideo = async (payload) => {
    try {
      const endpoint = payload.type === 'approve' 
        ? endpoints.submission.admin.approveDraftVideo
        : endpoints.submission.admin.requestDraftVideoChanges;

      await axiosInstance.patch(endpoint, {
        submissionId: submission.id,
        ...payload,
      });

      await onSectionUpdated();
      enqueueSnackbar(
        payload.type === 'approve' 
          ? 'Draft videos approved successfully' 
          : 'Change request submitted successfully',
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error submitting draft video review:', error);
      throw error;
    }
  };

  // Raw Footage submission handler
  const onSubmitRawFootage = async (payload) => {
    try {
      const endpoint = payload.type === 'approve'
        ? endpoints.submission.admin.approveRawFootage
        : endpoints.submission.admin.requestRawFootageChanges;

      await axiosInstance.patch(endpoint, {
        submissionId: submission.id,
        ...payload,
      });

      await onSectionUpdated();
      enqueueSnackbar(
        payload.type === 'approve'
          ? 'Raw footage approved successfully'
          : 'Change request submitted successfully',
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error submitting raw footage review:', error);
      throw error;
    }
  };

  // Photos submission handler
  const onSubmitPhotos = async (payload) => {
    try {
      const endpoint = payload.type === 'approve'
        ? endpoints.submission.admin.approvePhotos
        : endpoints.submission.admin.requestPhotoChanges;

      await axiosInstance.patch(endpoint, {
        submissionId: submission.id,
        ...payload,
      });

      await onSectionUpdated();
      enqueueSnackbar(
        payload.type === 'approve'
          ? 'Photos approved successfully'
          : 'Change request submitted successfully',
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error submitting photo review:', error);
      throw error;
    }
  };

  if (!deliverables) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>

        {/* Status Banner */}
        {/* <StatusBanner status={submission?.status} /> */}

        {/* Media Selection Navigation */}
        {availableTabs.length > 0 && (
          <Box sx={{ mb: -7, mt: -2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                p: { xs: 1.5, sm: 2 },
                bgcolor: 'background.paper',
                borderRadius: 1,
                // boxShadow: '0 0 12px rgba(0,0,0,0.05)',
              }}
            >
              {/* Draft Videos Tab */}
              {deliverables?.videos?.length > 0 && (
                <Button
                  onClick={() => setSelectedTab('videos')}
                  // startIcon={<Iconify icon="solar:video-frame-bold" />}
                  fullWidth
                  sx={{
                    p: 1.5,
                    color: selectedTab === 'videos' ? '#1844fc' : 'text.secondary',
                    bgcolor: selectedTab === 'videos' ? '#e6ebff' : 'transparent',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: getTabBorderColor('videos'),
                    '&:hover': {
                      bgcolor: selectedTab === 'videos' ? '#e6ebff' : 'action.hover',
                    },
                  }}
                >
                  <Stack alignItems="center">
                    <Typography variant="subtitle2">Draft Videos</Typography>
                    <Typography variant="caption">
                      {deliverables.videos.length} {deliverables.videos.length === 1 ? 'video' : 'videos'}
                    </Typography>
                  </Stack>
                </Button>
              )}

              {/* Raw Footages Tab */}
              {campaign?.rawFootage && deliverables?.rawFootages?.length > 0 && (
                <Button
                  onClick={() => setSelectedTab('rawFootages')}
                  // startIcon={<Iconify icon="solar:gallery-wide-bold" />}
                  fullWidth
                  sx={{
                    p: 1.5,
                    color: selectedTab === 'rawFootages' ? '#1844fc' : 'text.secondary',
                    bgcolor: selectedTab === 'rawFootages' ? '#e6ebff' : 'transparent',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: getTabBorderColor('rawFootages'),
                    '&:hover': {
                      bgcolor: selectedTab === 'rawFootages' ? '#e6ebff' : 'action.hover',
                    },
                  }}
                >
                  <Stack alignItems="center">
                    <Typography variant="subtitle2">Raw Footages</Typography>
                    <Typography variant="caption">
                      {deliverables.rawFootages.length} files
                    </Typography>
                  </Stack>
                </Button>
              )}

              {/* Photos Tab */}
              {campaign?.photos && deliverables?.photos?.length > 0 && (
                <Button
                  onClick={() => setSelectedTab('photos')}
                  // startIcon={<Iconify icon="solar:camera-bold" />}
                  fullWidth
                  sx={{
                    p: 1.5,
                    color: selectedTab === 'photos' ? '#1844fc' : 'text.secondary',
                    bgcolor: selectedTab === 'photos' ? '#e6ebff' : 'transparent',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: getTabBorderColor('photos'),
                    '&:hover': {
                      bgcolor: selectedTab === 'photos' ? '#e6ebff' : 'action.hover',
                    },
                  }}
                >
                  <Stack alignItems="center">
                    <Typography variant="subtitle2">Photos</Typography>
                    <Typography variant="caption">
                      {deliverables.photos.length} images
                    </Typography>
                  </Stack>
                </Button>
              )}
            </Stack>
          </Box>
        )}

        {/* Tabbed Content */}
        {availableTabs.length > 0 ? (
          // <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 0 12px rgba(0,0,0,0.05)', mb: 3, mt: 2 }}>
            <Stack spacing={2} p={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  {availableTabs.find(tab => tab.value === selectedTab)?.label}
                </Typography>
              </Stack>
              {renderTabContent()}
            </Stack>
          // </Paper>
        ) : (
          /* Empty State */
          <EmptyContent
            title="No deliverables found"
            description="This submission doesn't have any deliverables to review yet."
            sx={{ py: 10 }}
          />
        )}

        {/* Feedback Display */}
        {/* <FeedbackDisplay submission={submission} campaign={campaign} /> */}
      </Stack>

      {/* Modals */}
      <VideoModal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videos={deliverables?.rawFootages || []}
        currentIndex={currentVideoIndex}
        setCurrentIndex={setCurrentVideoIndex}
        creator={creator}
        submission={submission}
        showCaption={false}
        onPrev={() => setCurrentVideoIndex(prev => 
          prev === 0 ? deliverables.rawFootages.length - 1 : prev - 1
        )}
        onNext={() => setCurrentVideoIndex(prev => 
          prev === deliverables.rawFootages.length - 1 ? 0 : prev + 1
        )}
      />

      <VideoModal
        open={draftVideoModalOpen}
        onClose={() => setDraftVideoModalOpen(false)}
        videos={deliverables?.videos || []}
        currentIndex={currentDraftVideoIndex}
        setCurrentIndex={setCurrentDraftVideoIndex}
        creator={creator}
        submission={submission}
        showCaption
        onPrev={() => setCurrentDraftVideoIndex(prev => 
          prev === 0 ? deliverables.videos.length - 1 : prev - 1
        )}
        onNext={() => setCurrentDraftVideoIndex(prev => 
          prev === deliverables.videos.length - 1 ? 0 : prev + 1
        )}
      />

      <PhotoModal
        open={fullImageOpen}
        onClose={handleFullImageClose}
        photos={deliverables?.photos || []}
        currentIndex={currentImageIndex}
        setCurrentIndex={setCurrentImageIndex}
        creator={creator}
        onPrev={handlePrevImage}
        onNext={handleNextImage}
      />

      <ConfirmationApproveModal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        sectionType={currentSectionType}
        onConfirm={onSectionUpdated}
      />

      <ConfirmationRequestModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        sectionType={currentSectionType}
        onConfirm={onSectionUpdated}
      />
    </Box>
  );
};

FirstDraft.propTypes = {
  campaign: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  creator: PropTypes.object.isRequired,
  deliverablesData: PropTypes.object.isRequired,
};

export default FirstDraft;
