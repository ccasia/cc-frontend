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
  const { deliverables, deliverableMutate } = deliverablesData;
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

  const getTabBorderColor = (tabType) => {
    if (submission?.status === 'PENDING_REVIEW') return '#FFC702';
    
    switch (tabType) {
      case 'videos':
        return isVideosApproved() ? '#1ABF66' : 'divider';
      case 'rawFootages':
        return isRawFootagesApproved() ? '#1ABF66' : 'divider';
      case 'photos':
        return isPhotosApproved() ? '#1ABF66' : 'divider';
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
