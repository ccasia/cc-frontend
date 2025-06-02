/* eslint-disable no-nested-ternary */
/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
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

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import Photos from './finalDraft/photos';
import DraftVideos from './finalDraft/draft-videos';
import RawFootages from './finalDraft/raw-footage';
import FeedbackDisplay from './finalDraft/feedback-display';
import { VideoModal, PhotoModal } from './finalDraft/media-modals';
import { ConfirmationApproveModal, ConfirmationRequestModal } from './finalDraft/confirmation-modals';

const FinalDraft = ({ campaign, submission, creator, deliverablesData, firstDraftSubmission }) => {
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
      // Check if all sections are approved for final draft
      const videosApproved = deliverables?.videos?.every(
        (video) => video.status === 'APPROVED'
      );
      const rawFootagesApproved = deliverables?.rawFootages?.every(
        (footage) => footage.status === 'APPROVED'
      );
      const photosApproved = deliverables?.photos?.every(
        (photo) => photo.status === 'APPROVED'
      );

      const allSectionsApproved = videosApproved && rawFootagesApproved && photosApproved;

      if (allSectionsApproved && submission.status === 'PENDING_REVIEW') {
        // Update submission to approved
        await axiosInstance.patch(`/api/submission/status`, {
        submissionId: submission.id,
          status: 'APPROVED',
          feedback: 'All sections have been approved',
          dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        });

        // Update posting status to allow creator to submit links
        const allSubmissionsRes = await axiosInstance.get(
          `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
        );
        
        const postingSubmission = allSubmissionsRes.data.find(
          sub => sub.submissionType?.type === 'POSTING'
        );
        
        if (postingSubmission) {
          await axiosInstance.patch(`/api/submission/status`, {
            submissionId: postingSubmission.id,
            status: 'IN_PROGRESS',
          dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
            sectionOnly: true
          });
        }

        // Refresh the data
        await deliverableMutate();
        
        enqueueSnackbar('Final draft approved! Creator can now submit posting links.', { 
          variant: 'success' 
        });
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
    const filteredPhotos = deliverables?.photos?.filter(photo => photo.status === 'REVISION_REQUESTED') || [];
    setCurrentImageIndex((prev) => 
      prev === 0 ? filteredPhotos.length - 1 : prev - 1
    );
  };

  const handleNextImage = (event) => {
    event.stopPropagation();
    const filteredPhotos = deliverables?.photos?.filter(photo => photo.status === 'REVISION_REQUESTED') || [];
    setCurrentImageIndex((prev) => 
      prev === filteredPhotos.length - 1 ? 0 : prev + 1
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
    
    // Only show content if firstDraft has changes required
    const shouldShowContent = firstDraftSubmission?.status === 'CHANGES_REQUIRED';
    
    if (!shouldShowContent) {
      return tabs; // Return empty tabs if firstDraft is not in CHANGES_REQUIRED status
    }
    
    // Only show videos that need revision
    const videosNeedingRevision = deliverables?.videos?.filter(video => video.status === 'REVISION_REQUESTED') || [];
    if (videosNeedingRevision.length > 0 || submission?.content) {
      tabs.push({ 
        value: 'videos', 
        count: videosNeedingRevision.length || (submission?.content ? 1 : 0),
      });
    }
    
    // Only show raw footages that need revision
    const rawFootagesNeedingRevision = deliverables?.rawFootages?.filter(footage => footage.status === 'REVISION_REQUESTED') || [];
    if (campaign?.rawFootage && rawFootagesNeedingRevision.length > 0) {
      tabs.push({ 
        value: 'rawFootages', 
        count: rawFootagesNeedingRevision.length,
      });
    }
    
    // Only show photos that need revision
    const photosNeedingRevision = deliverables?.photos?.filter(photo => photo.status === 'REVISION_REQUESTED') || [];
    if (campaign?.photos && photosNeedingRevision.length > 0) {
      tabs.push({ 
        value: 'photos', 
        count: photosNeedingRevision.length,
      });
    }
    
    return tabs;
  }, [deliverables?.videos, deliverables?.rawFootages, deliverables?.photos, submission?.content, campaign?.rawFootage, campaign?.photos, firstDraftSubmission?.status]);

  // Set initial tab if current tab is not available
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(tab => tab.value === selectedTab)) {
      setSelectedTab(availableTabs[0].value);
    }
  }, [availableTabs, selectedTab]);

  const renderTabContent = () => {
    // Filter deliverables to only show items that need revision
    const filteredDeliverables = {
      videos: deliverables?.videos?.filter(video => video.status === 'REVISION_REQUESTED') || [],
      rawFootages: deliverables?.rawFootages?.filter(footage => footage.status === 'REVISION_REQUESTED') || [],
      photos: deliverables?.photos?.filter(photo => photo.status === 'REVISION_REQUESTED') || [],
    };

    switch (selectedTab) {
      case 'videos':
      return (
          <DraftVideos
            campaign={campaign}
            submission={submission}
            deliverables={filteredDeliverables}
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
            deliverables={filteredDeliverables}
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
            deliverables={filteredDeliverables}
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
      await axiosInstance.patch('/api/submission/manageVideos', {
          submissionId: submission.id,
        videos: payload.videos || deliverables?.videos?.map(video => video.id) || [],
        type: payload.type,
        feedback: payload.feedback,
        reasons: payload.reasons || [],
        dueDate: payload.type === 'approve' ? payload.dueDate : null,
        sectionOnly: true,
        submissionType: 'FINAL_DRAFT'
      });

      await onSectionUpdated();
      
      enqueueSnackbar(
        payload.type === 'approve' 
          ? 'Draft videos approved successfully!' 
          : 'Changes requested for draft videos.',
        { variant: payload.type === 'approve' ? 'success' : 'warning' }
      );
        
        return true;
    } catch (error) {
      console.error('Error submitting draft video review:', error);
      enqueueSnackbar(error?.response?.data?.message || error?.message || 'Error submitting review', {
        variant: 'error',
      });
      return false;
    }
  };

  // Raw Footage submission handler
  const onSubmitRawFootage = async (payload) => {
    try {
      await axiosInstance.patch('/api/submission/manageRawFootages', {
        submissionId: submission.id,
        rawFootages: payload.rawFootages || deliverables?.rawFootages?.map(footage => footage.id) || [],
        type: payload.type,
        rawFootageContent: payload.footageFeedback || '',
        sectionOnly: true,
        status: payload.type === 'request' ? 'CHANGES_REQUIRED' : 'APPROVED',
        dueDate: payload.type === 'request' ? dayjs().add(7, 'day').format('YYYY-MM-DD') : null
      });

      await onSectionUpdated();
      
      enqueueSnackbar(
        payload.type === 'approve'
          ? 'Raw footages approved successfully!'
          : 'Changes requested for raw footages.',
        { variant: payload.type === 'approve' ? 'success' : 'warning' }
      );
        
        return true;
    } catch (error) {
      console.error('Error submitting raw footage review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
      return false;
    }
  };

  // Photos submission handler
  const onSubmitPhotos = async (payload) => {
    try {
      await axiosInstance.patch('/api/submission/managePhotos', {
        submissionId: submission.id,
        photos: payload.photos || deliverables?.photos?.map(photo => photo.id) || [],
        type: payload.type,
        photoFeedback: payload.photoFeedback || '',
        sectionOnly: true
      });

      await onSectionUpdated();
      
      enqueueSnackbar(
        payload.type === 'approve'
          ? 'Photos approved successfully!'
          : 'Changes requested for photos.',
        { variant: payload.type === 'approve' ? 'success' : 'warning' }
      );

        return true;
    } catch (error) {
      console.error('Error submitting photo review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
      return false;
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
                            }}
                          >
              {/* Draft Videos Tab */}
              {availableTabs.some(tab => tab.value === 'videos') && (
                            <Button
                  onClick={() => setSelectedTab('videos')}
                              fullWidth
                              sx={{
                                p: 1.5,
                    color: selectedTab === 'videos' ? '#1844fc' : 'text.secondary',
                    bgcolor: selectedTab === 'videos' ? '#e6ebff' : 'transparent',
                                borderRadius: 1,
                    border: '1px solid',
                    borderColor: submission?.status === 'PENDING_REVIEW' ? '#FFC702' : 'divider',
                                '&:hover': {
                      bgcolor: selectedTab === 'videos' ? '#e6ebff' : 'action.hover',
                                },
                              }}
                            >
                              <Stack alignItems="center">
                                <Typography variant="subtitle2">Draft Videos</Typography>
                                <Typography variant="caption">
                      {availableTabs.find(tab => tab.value === 'videos')?.count || 0} {
                        (availableTabs.find(tab => tab.value === 'videos')?.count || 0) === 1 ? 'video' : 'videos'
                      }
                                </Typography>
                              </Stack>
                            </Button>
              )}

              {/* Raw Footages Tab */}
              {campaign?.rawFootage && availableTabs.some(tab => tab.value === 'rawFootages') && (
                              <Button
                                onClick={() => setSelectedTab('rawFootages')}
                                fullWidth
                                sx={{
                                  p: 1.5,
                    color: selectedTab === 'rawFootages' ? '#1844fc' : 'text.secondary',
                    bgcolor: selectedTab === 'rawFootages' ? '#e6ebff' : 'transparent',
                                  borderRadius: 1,
                    border: '1px solid',
                    borderColor: submission?.status === 'PENDING_REVIEW' ? '#FFC702' : 'divider',
                                  '&:hover': {
                      bgcolor: selectedTab === 'rawFootages' ? '#e6ebff' : 'action.hover',
                                  },
                                }}
                              >
                                <Stack alignItems="center">
                                  <Typography variant="subtitle2">Raw Footages</Typography>
                                  <Typography variant="caption">
                      {availableTabs.find(tab => tab.value === 'rawFootages')?.count || 0} files
                                  </Typography>
                                </Stack>
                              </Button>
                            )}

              {/* Photos Tab */}
              {campaign?.photos && availableTabs.some(tab => tab.value === 'photos') && (
                              <Button
                                onClick={() => setSelectedTab('photos')}
                                fullWidth
                                sx={{
                                  p: 1.5,
                                  color: selectedTab === 'photos' ? '#1844fc' : 'text.secondary',
                                  bgcolor: selectedTab === 'photos' ? '#e6ebff' : 'transparent',
                                  borderRadius: 1,
                    border: '1px solid',
                    borderColor: submission?.status === 'PENDING_REVIEW' ? '#FFC702' : 'divider',
                                  '&:hover': {
                                    bgcolor: selectedTab === 'photos' ? '#e6ebff' : 'action.hover',
                                  },
                                }}
                              >
                                <Stack alignItems="center">
                                  <Typography variant="subtitle2">Photos</Typography>
                                  <Typography variant="caption">
                      {availableTabs.find(tab => tab.value === 'photos')?.count || 0} images
                                  </Typography>
                                </Stack>
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      )}

        {/* Tabbed Content */}
        {availableTabs.length > 0 ? (
          <Stack spacing={2} p={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                {availableTabs.find(tab => tab.value === selectedTab)?.label}
                                    </Typography>
                                              </Stack>
            {renderTabContent()}
                                    </Stack>
        ) : (
          /* Empty State */
          <EmptyContent
            title="No revisions required"
            description={
              firstDraftSubmission?.status === 'CHANGES_REQUIRED' 
                ? "No deliverables require revision at this time."
                : "Final draft content will appear here when the first draft requires changes."
            }
            sx={{ py: 10 }}
          />
        )}

        {/* Feedback Display */}
        <FeedbackDisplay 
          submission={submission} 
          campaign={campaign} 
          firstDraftSubmission={firstDraftSubmission}
          deliverables={deliverables}
        />
                                              </Stack>
                                              
      {/* Modals */}
      <VideoModal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videos={deliverables?.rawFootages?.filter(footage => footage.status === 'REVISION_REQUESTED') || []}
        currentIndex={currentVideoIndex}
        setCurrentIndex={setCurrentVideoIndex}
        creator={creator}
        onPrev={() => {
          const filteredRawFootages = deliverables?.rawFootages?.filter(footage => footage.status === 'REVISION_REQUESTED') || [];
          setCurrentVideoIndex(prev => 
            prev === 0 ? filteredRawFootages.length - 1 : prev - 1
          );
        }}
        onNext={() => {
          const filteredRawFootages = deliverables?.rawFootages?.filter(footage => footage.status === 'REVISION_REQUESTED') || [];
          setCurrentVideoIndex(prev => 
            prev === filteredRawFootages.length - 1 ? 0 : prev + 1
          );
        }}
      />

      <VideoModal
        open={draftVideoModalOpen}
        onClose={() => setDraftVideoModalOpen(false)}
        videos={deliverables?.videos?.filter(video => video.status === 'REVISION_REQUESTED') || []}
        currentIndex={currentDraftVideoIndex}
        setCurrentIndex={setCurrentDraftVideoIndex}
        creator={creator}
        onPrev={() => {
          const filteredVideos = deliverables?.videos?.filter(video => video.status === 'REVISION_REQUESTED') || [];
          setCurrentDraftVideoIndex(prev => 
            prev === 0 ? filteredVideos.length - 1 : prev - 1
          );
        }}
        onNext={() => {
          const filteredVideos = deliverables?.videos?.filter(video => video.status === 'REVISION_REQUESTED') || [];
          setCurrentDraftVideoIndex(prev => 
            prev === filteredVideos.length - 1 ? 0 : prev + 1
          );
        }}
      />

      <PhotoModal
        open={fullImageOpen}
        onClose={handleFullImageClose}
        photos={deliverables?.photos?.filter(photo => photo.status === 'REVISION_REQUESTED') || []}
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

FinalDraft.propTypes = {
  campaign: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  creator: PropTypes.object.isRequired,
  deliverablesData: PropTypes.object.isRequired,
  firstDraftSubmission: PropTypes.object,
};

export default FinalDraft;
