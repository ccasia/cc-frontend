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

import EmptyContent from 'src/components/empty-content/empty-content';

// V3 Client Components removed
import Photos from './finalDraft/photos';
import RawFootages from './finalDraft/raw-footage';
import DraftVideos from './finalDraft/draft-videos';
import { VideoModal, PhotoModal } from './finalDraft/media-modals';
import { ConfirmationApproveModal, ConfirmationRequestModal } from './finalDraft/confirmation-modals';

const FinalDraft = ({ 
  campaign, 
  submission, 
  creator, 
  deliverablesData, 
  firstDraftSubmission, 
  // Individual client approval handlers
  handleClientApproveVideo,
  handleClientApprovePhoto,
  handleClientApproveRawFootage,
  handleClientRejectVideo,
  handleClientRejectPhoto,
  handleClientRejectRawFootage,
}) => {
  // Create wrapper functions that call SWR mutations after client actions
  const handleClientApproveVideoWithMutation = async (...args) => {
    await handleClientApproveVideo(...args);
    await onClientActionCompleted();
  };

  const handleClientApprovePhotoWithMutation = async (...args) => {
    await handleClientApprovePhoto(...args);
    await onClientActionCompleted();
  };

  const handleClientApproveRawFootageWithMutation = async (...args) => {
    await handleClientApproveRawFootage(...args);
    await onClientActionCompleted();
  };

  const handleClientRejectVideoWithMutation = async (...args) => {
    await handleClientRejectVideo(...args);
    await onClientActionCompleted();
  };

  const handleClientRejectPhotoWithMutation = async (...args) => {
    await handleClientRejectPhoto(...args);
    await onClientActionCompleted();
  };

  const handleClientRejectRawFootageWithMutation = async (...args) => {
    await handleClientRejectRawFootage(...args);
    await onClientActionCompleted();
  };
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

  // Track which media items have been sent to creator
  const [sentToCreatorItems, setSentToCreatorItems] = useState(new Set());

  // Check if all client feedback has been sent to creator
  const allFeedbackSentToCreator = useMemo(() => {
    if (!deliverables) return true;
    
    const itemsWithClientFeedback = new Set();
    
    // Check videos
    deliverables.videos?.forEach(video => {
      if (video.status === 'CLIENT_FEEDBACK' || video.status === 'SENT_TO_ADMIN') {
        itemsWithClientFeedback.add(`video_${video.id}`);
      }
    });
    
    // Check photos
    deliverables.photos?.forEach(photo => {
      if (photo.status === 'CLIENT_FEEDBACK' || photo.status === 'SENT_TO_ADMIN') {
        itemsWithClientFeedback.add(`photo_${photo.id}`);
      }
    });
    
    // Check raw footage
    deliverables.rawFootages?.forEach(footage => {
      if (footage.status === 'CLIENT_FEEDBACK' || footage.status === 'SENT_TO_ADMIN') {
        itemsWithClientFeedback.add(`rawFootage_${footage.id}`);
      }
    });
    
    // If no items have client feedback, consider it all sent
    if (itemsWithClientFeedback.size === 0) return true;
    
    // Check if all items with client feedback have been sent to creator
    return Array.from(itemsWithClientFeedback).every(itemKey => sentToCreatorItems.has(itemKey));
  }, [deliverables, sentToCreatorItems]);

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const checkSubmissionReadiness = async () => {
    try {
      // V2 Flow: Original logic for backward compatibility
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
        // Legacy endpoint - direct approval
        await axiosInstance.patch(`/api/submission/status`, {
          submissionId: submission.id,
          status: 'APPROVED',
          feedback: 'All sections have been approved',
          dueDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
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
            dueDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
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

  // Client action completion callback for SWR mutations
  const onClientActionCompleted = async () => {
    try {
      await Promise.all([
        deliverableMutate(),
        submissionMutate && submissionMutate()
      ].filter(Boolean));
    } catch (error) {
      console.error('Error updating after client action:', error);
    }
  };

  // Check if all sections are approved and activate posting if needed
  const checkAndActivatePosting = async (selectedDueDate) => {
    try {
      console.log('🔍 checkAndActivatePosting called');
      
      // Wait a moment for the data to be refreshed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Re-fetch the latest deliverables to check current status
      await deliverableMutate();
      
      // Fetch fresh deliverables data directly from API
      const freshDeliverablesResponse = await axiosInstance.get(
        `/api/submission/deliverables/${creator?.user?.id}/${campaign?.id}`
      );
      const currentDeliverables = freshDeliverablesResponse.data;
      
      // V2 Flow: Original logic for backward compatibility
      const videosApproved = !currentDeliverables?.videos?.length || 
        currentDeliverables.videos.every(video => video.status === 'APPROVED');
      const rawFootagesApproved = !currentDeliverables?.rawFootages?.length || 
        currentDeliverables.rawFootages.every(footage => footage.status === 'APPROVED');
      const photosApproved = !currentDeliverables?.photos?.length || 
        currentDeliverables.photos.every(photo => photo.status === 'APPROVED');

      const allSectionsApproved = videosApproved && rawFootagesApproved && photosApproved;

      if (allSectionsApproved && submission.submissionType?.type === 'FINAL_DRAFT') {
        // Use the selected due date if provided, otherwise default to 3 days from today
        const dueDate = selectedDueDate 
          ? new Date(selectedDueDate).toISOString()
          : (() => {
              const threeDaysFromToday = new Date();
              threeDaysFromToday.setDate(threeDaysFromToday.getDate() + 3);
              threeDaysFromToday.setHours(23, 59, 59, 999);
              return threeDaysFromToday.toISOString();
            })();
        
        // Update submission to APPROVED using the correct endpoint
        const response = await axiosInstance.patch('/api/submission/status', {
          submissionId: submission.id,
          status: 'APPROVED',
          updatePosting: true, // This flag tells the backend to activate posting
          dueDate,
        });

        // Wait for backend to complete all updates
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Refresh data multiple times to ensure consistency
        await Promise.all([
          deliverableMutate(),
          submissionMutate && submissionMutate()
        ].filter(Boolean));

        // Additional refresh after a short delay to catch any delayed updates
        setTimeout(async () => {
          await Promise.all([
            deliverableMutate(),
            submissionMutate && submissionMutate()
          ].filter(Boolean));
        }, 1000);

        enqueueSnackbar('All sections approved!', { 
          variant: 'success' 
        });
      }
    } catch (error) {
      console.error('❌ Error checking and activating posting:', error);
      enqueueSnackbar('Error activating posting submission', { variant: 'error' });
    }
  };

  // V2 Individual Media Management Functions
  const handleIndividualPhotoApprove = async (mediaId, feedback) => {
    try {
      // V2 flow: Use V2 endpoint
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
      // V2 flow: Use V2 endpoint
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
      console.log('🔍 Admin approving video:', { mediaId, feedback, dueDate, user: user?.role, adminMode: user?.admin?.mode });
      
      // V2 flow: Use V2 endpoint
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
      console.error('❌ Error approving video:', error);
      console.error('❌ Error response:', error?.response);
      console.error('❌ Error status:', error?.response?.status);
      console.error('❌ Error data:', error?.response?.data);
      enqueueSnackbar(error?.response?.data?.message || 'Error approving video', { 
        variant: 'error' 
      });
      throw error;
    }
  };

  const handleIndividualVideoRequestChange = async (mediaId, feedback, reasons) => {
    try {
      console.log('🔍 Admin requesting video changes:', { mediaId, feedback, reasons, user: user?.role, adminMode: user?.admin?.mode });
      
      // V2 flow: Use V2 endpoint
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
      console.error('❌ Error requesting video changes:', error);
      console.error('❌ Error response:', error?.response);
      console.error('❌ Error status:', error?.response?.status);
      console.error('❌ Error data:', error?.response?.data);
      enqueueSnackbar(error?.response?.data?.message || 'Error requesting changes', { 
        variant: 'error' 
      });
      throw error;
    }
  };

  const handleIndividualRawFootageApprove = async (mediaId, feedback) => {
    try {
      // V2 flow: Use V2 endpoint
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

  // Admin feedback handlers - V3 submissions removed
  const handleAdminEditFeedback = async (mediaId, feedbackId, adminFeedback) => {
    console.log('V3 submissions removed - API call disabled');
    enqueueSnackbar('V3 submissions removed - functionality disabled', { variant: 'info' });
    return false;
  };

  const handleAdminSendToCreator = async (mediaId, feedbackId, onStatusUpdate, mediaType = 'video') => {
    console.log('V3 submissions removed - API call disabled');
    enqueueSnackbar('V3 submissions removed - functionality disabled', { variant: 'info' });
    return false;
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
    
    // Show content if firstDraft has changes required OR if final draft is pending review OR if final draft has changes required
    const shouldShowContent = firstDraftSubmission?.status === 'CHANGES_REQUIRED' || 
                             submission?.status === 'PENDING_REVIEW' ||
                             submission?.status === 'CHANGES_REQUIRED';
    
    if (!shouldShowContent) {
      return tabs; // Return empty tabs if conditions are not met
    }
    
    // Show all videos in final draft (not just those needing revision)
    if (deliverables?.videos?.length > 0 || submission?.content) {
      tabs.push({ 
        value: 'videos', 
        count: deliverables?.videos?.length || (submission?.content ? 1 : 0),
        // label: 'Draft Videos'
      });
    }
    
    // Show all raw footages in final draft
    if (campaign?.rawFootage && deliverables?.rawFootages?.length > 0) {
      tabs.push({ 
        value: 'rawFootages', 
        count: deliverables.rawFootages.length,
        // label: 'Raw Footages'
      });
    }
    
    // Show all photos in final draft
    if (campaign?.photos && deliverables?.photos?.length > 0) {
      tabs.push({ 
        value: 'photos', 
        count: deliverables.photos.length,
        // label: 'Photos'
      });
    }
    
    return tabs;
  }, [deliverables?.videos, deliverables?.rawFootages, deliverables?.photos, submission?.content, submission?.status, campaign?.rawFootage, campaign?.photos, firstDraftSubmission?.status]);

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
  const hasVideosChangesRequired = () => deliverables?.videos?.length > 0 && 
      deliverables.videos.some(video => video.status === 'CHANGES_REQUIRED');

  const hasRawFootagesChangesRequired = () => deliverables?.rawFootages?.length > 0 && 
      deliverables.rawFootages.some(footage => footage.status === 'CHANGES_REQUIRED');

  const hasPhotosChangesRequired = () => deliverables?.photos?.length > 0 && 
      deliverables.photos.some(photo => photo.status === 'CHANGES_REQUIRED');

  const getTabBorderColor = (tabType) => {
    const status = submission.displayStatus || submission.status;
    const userRole = user?.admin?.role?.name;

    // Check for changes required first (highest priority)
    switch (tabType) {
      case 'videos':
        if (hasVideosChangesRequired()) return '#D4321C'; // Red for changes required
        if (isVideosApproved()) return '#1ABF66'; // Green for all approved
        break;
      case 'rawFootages':
        if (hasRawFootagesChangesRequired()) return '#D4321C'; // Red for changes required
        if (isRawFootagesApproved()) return '#1ABF66'; // Green for all approved
        break;
      case 'photos':
        if (hasPhotosChangesRequired()) return '#D4321C'; // Red for changes required
        if (isPhotosApproved()) return '#1ABF66'; // Green for all approved
        break;
    }

    // If submission is pending review and no items are approved, show yellow
    if (submission?.status === 'PENDING_REVIEW') return '#FFC702';
    
    // Default to gray border
    return 'divider';
  };

  const renderTabContent = () => {
    // For Final Draft, show all deliverables regardless of status
    // since creators may have uploaded new content that needs review
    const filteredDeliverables = {
      videos: deliverables?.videos || [],
      rawFootages: deliverables?.rawFootages || [],
      photos: deliverables?.photos || [],
    };

    // Common props for V2 components
    const commonProps = {
      campaign,
      submission,
      deliverables: filteredDeliverables,
      isDisabled,
      // Add mutation functions for SWR updates
      deliverableMutate,
      submissionMutate,
    };

    switch (selectedTab) {
      case 'videos':
        return (
          <DraftVideos
            {...commonProps}
            onVideoClick={handleDraftVideoClick}
            onSubmit={onSubmitDraftVideo}
            // V2 individual handlers
            onIndividualApprove={handleIndividualVideoApprove}
            onIndividualRequestChange={handleIndividualVideoRequestChange}
            // Individual client approval handlers
            handleClientApproveVideo={handleClientApproveVideo}
            handleClientApprovePhoto={handleClientApprovePhoto}
            handleClientApproveRawFootage={handleClientApproveRawFootage}
            handleClientRejectVideo={handleClientRejectVideo}
            handleClientRejectPhoto={handleClientRejectPhoto}
            handleClientRejectRawFootage={handleClientRejectRawFootage}
            // Admin feedback handlers
            handleAdminEditFeedback={handleAdminEditFeedback}
            handleAdminSendToCreator={handleAdminSendToCreator}
          />
        );
      case 'rawFootages':
        return (
          <RawFootages
            {...commonProps}
            onVideoClick={handleVideoClick}
            onSubmit={onSubmitRawFootage}
            // V2 individual handlers
            onIndividualApprove={handleIndividualRawFootageApprove}
            onIndividualRequestChange={handleIndividualRawFootageRequestChange}
            // Individual client approval handlers
            handleClientApproveVideo={handleClientApproveVideo}
            handleClientApprovePhoto={handleClientApprovePhoto}
            handleClientApproveRawFootage={handleClientApproveRawFootage}
            handleClientRejectVideo={handleClientRejectVideo}
            handleClientRejectPhoto={handleClientRejectPhoto}
            handleClientRejectRawFootage={handleClientRejectRawFootage}
            // Admin feedback handlers
            handleAdminEditFeedback={handleAdminEditFeedback}
            handleAdminSendToCreator={handleAdminSendToCreator}
          />
        );
      case 'photos':
        return (
          <Photos
            {...commonProps}
            onImageClick={handleImageClick}
            onSubmit={onSubmitPhotos}
            // V2 individual handlers
            onIndividualApprove={handleIndividualPhotoApprove}
            onIndividualRequestChange={handleIndividualPhotoRequestChange}
            // Individual client approval handlers
            handleClientApproveVideo={handleClientApproveVideo}
            handleClientApprovePhoto={handleClientApprovePhoto}
            handleClientApproveRawFootage={handleClientApproveRawFootage}
            handleClientRejectVideo={handleClientRejectVideo}
            handleClientRejectPhoto={handleClientRejectPhoto}
            handleClientRejectRawFootage={handleClientRejectRawFootage}
            // Admin feedback handlers
            handleAdminEditFeedback={handleAdminEditFeedback}
            handleAdminSendToCreator={handleAdminSendToCreator}
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
      // V2 endpoint for admin-created campaigns
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
      // V2 endpoint for admin-created campaigns
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
      // V2 endpoint for admin-created campaigns
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
        {/* <FeedbackDisplay 
          submission={submission} 
          campaign={campaign} 
          firstDraftSubmission={firstDraftSubmission}
          deliverables={deliverables}
        /> */}
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

FinalDraft.propTypes = {
  campaign: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  creator: PropTypes.object.isRequired,
  deliverablesData: PropTypes.object.isRequired,
  firstDraftSubmission: PropTypes.object,
  // Individual client approval handlers
  handleClientApproveVideo: PropTypes.func,
  handleClientApprovePhoto: PropTypes.func,
  handleClientApproveRawFootage: PropTypes.func,
  handleClientRejectVideo: PropTypes.func,
  handleClientRejectPhoto: PropTypes.func,
  handleClientRejectRawFootage: PropTypes.func,
};

export default FinalDraft;