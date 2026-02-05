import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { Box, Card, Stack, Typography, useMediaQuery, CircularProgress } from '@mui/material';

import { useGetSubmissions } from 'src/hooks/use-get-submission';
import { useGetDeliverables } from 'src/hooks/use-get-deliverables';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import CampaignPosting from './submissions/campaign-posting';
import LogisticsForm from './submissions/campaign-logistics';
import MobileSubmissionLayout from './mobile-submission-layout';
import CampaignAgreement from './submissions/campaign-agreement';
import CampaignFirstDraft from './submissions/campaign-first-draft';
import CampaignFinalDraft from './submissions/campaign-final-draft';

/**
 * Campaign My Tasks Component
 * 
 * V2 Flow Only:
 * - Handles V2 statuses: PENDING_REVIEW, CHANGES_REQUIRED, APPROVED
 * - Stage visibility logic for V2 workflow
 * - Socket event listeners for V2 flow updates
 * - Status display and completion indicators for V2 flows
 * 
 * IMPORTANT: 1st Draft vs 2nd Draft Clarity
 * - When 2nd Draft is active, 1st Draft shows as "In Review" to prevent confusion
 * - When 1st Draft has "Changes Required", it shows as "Completed" (green) to make creators focus on 2nd Draft
 * - This ensures creators know they should work on the 2nd Draft, not the 1st Draft
 * - Simple color scheme: Green for completed, Yellow for everything else
 * 
 * Status: ✅ V2 Flow Only - V3 Removed
 * Status: ✅ 1st Draft vs 2nd Draft Confusion Prevention Implemented
 * Status: ✅ Simplified Color Scheme (Yellow/Green Only)
 */
export const defaultSubmission = [
  {
    name: 'Agreement Submission ✍',
    value: 'Agreement',
    type: 'AGREEMENT_FORM',
    stage: 1,
  },
  {
    name: 'Product Delivery Info 📦',
    value: 'Product Delivery',
    type: 'PRODUCT_DELIVERY',
    stage: 2,
  },
  {
    name: 'Draft Submission 📝',
    value: 'First Draft',
    type: 'FIRST_DRAFT',
    stage: 3,
  },
  {
    name: '2nd Draft Submission 📝',
    value: 'Final Draft',
    type: 'FINAL_DRAFT',
    stage: 4,
  },
  {
    name: 'Posting Link Submission 🔗',
    value: 'Posting',
    type: 'POSTING',
    stage: 5,
  },
];

const CampaignMyTasks = ({ campaign, logistic, mutateLogistic, setCurrentTab, onConfirm }) => {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const [selectedStage, setSelectedStage] = useState('AGREEMENT_FORM');
  const { data, isLoading, mutate: deliverableMutate } = useGetDeliverables(user?.id, campaign.id);
  const isMobile = useMediaQuery('(max-width: 900px)');

  const isLogisticsCompleted = !!logistic;
  const isDelivery = campaign?.logisticsType === 'PRODUCT_DELIVERY';

  // Track if user has manually selected a stage (to prevent auto-selection from overriding)
  const hasManualSelection = useRef(false);

  // Initialize viewedStages from localStorage if available
  const [viewedStages, setViewedStages] = useState(() => {
    const saved = localStorage.getItem(`viewedStages-${campaign.id}-${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const agreementStatus = user?.shortlisted?.find(
    (item) => item?.campaignId === campaign?.id
  )?.isAgreementReady;

  const {
    data: submissions,
    mutate: submissionMutate,
    isLoading: submissionLoading,
  } = useGetSubmissions(user.id, campaign?.id);

  const getDueDate = (name) =>
    submissions?.find((submission) => submission?.submissionType?.type === name)?.dueDate;

  const value = useCallback(
    (name) => submissions?.find((item) => item.submissionType.type === name),
    [submissions]
  );

  const timeline = campaign?.campaignTimeline;

  const getDependency = useCallback(
    (submissionId) => {
      const isDependencyeExist = submissions?.find((item) => item.id === submissionId)
        ?.dependentOn[0];
      return isDependencyeExist;
    },
    [submissions]
  );

  useEffect(() => {
    // Track which events we've already handled to prevent duplicates
    const handledEvents = new Set();
    
    socket?.on('draft', () => {
      if (!handledEvents.has('draft')) {
        handledEvents.add('draft');
        console.log('🔄 Draft event received, updating first draft data');
      mutate(endpoints.campaign.draft.getFirstDraftForCreator(campaign.id));
        // Remove from handled events after a delay to allow future events
        setTimeout(() => handledEvents.delete('draft'), 5000);
      }
    });

    socket?.on('newFeedback', () => {
      if (!handledEvents.has('newFeedback')) {
        handledEvents.add('newFeedback');
        console.log('🔄 New feedback event received, updating submissions');
        submissionMutate();
        // Remove from handled events after a delay to allow future events
        setTimeout(() => handledEvents.delete('newFeedback'), 5000);
      }
    });

    socket?.on('agreementReady', () => {
      if (!handledEvents.has('agreementReady')) {
        handledEvents.add('agreementReady');
        console.log('🔄 Agreement ready event received, updating user data');
      mutate(endpoints.auth.me);
        // Remove from handled events after a delay to allow future events
        setTimeout(() => handledEvents.delete('agreementReady'), 5000);
      }
    });

    // V2 flow socket events with duplicate prevention
    socket?.on('submissionStatusChanged', () => {
      if (!handledEvents.has('submissionStatusChanged')) {
        handledEvents.add('submissionStatusChanged');
        console.log('🔄 Submission status changed event received, updating submissions');
      submissionMutate();
        // Remove from handled events after a delay to allow future events
        setTimeout(() => handledEvents.delete('submissionStatusChanged'), 5000);
      }
    });

    socket?.on('draftSubmitted', () => {
      if (!handledEvents.has('draftSubmitted')) {
        handledEvents.add('draftSubmitted');
        console.log('🔄 Draft submitted event received, updating submissions');
      submissionMutate();
        // Remove from handled events after a delay to allow future events
        setTimeout(() => handledEvents.delete('draftSubmitted'), 5000);
      }
    });

    socket?.on('draftApproved', () => {
      if (!handledEvents.has('draftApproved')) {
        handledEvents.add('draftApproved');
        console.log('🔄 Draft approved event received, updating submissions');
      submissionMutate();
        // Remove from handled events after a delay to allow future events
        setTimeout(() => handledEvents.delete('draftApproved'), 5000);
      }
    });

    socket?.on('changesRequested', () => {
      if (!handledEvents.has('changesRequested')) {
        handledEvents.add('changesRequested');
        console.log('🔄 Changes requested event received, updating submissions');
      submissionMutate();
        // Remove from handled events after a delay to allow future events
        setTimeout(() => handledEvents.delete('changesRequested'), 5000);
      }
    });

    return () => {
      socket?.off('draft');
      socket?.off('newFeedback');
      socket?.off('agreementReady');
      socket?.off('submissionStatusChanged');
      socket?.off('draftSubmitted');
      socket?.off('draftApproved');
      socket?.off('changesRequested');
    };
  }, [campaign, submissionMutate, socket]);

  // Auto-select posting stage when it becomes available (only on initial load)
  useEffect(() => {
    // Don't auto-select if user has manually selected a stage
    if (hasManualSelection.current || !submissions) {
      return;
    }
    
    const firstDraftSubmission = submissions.find((item) => item.submissionType?.type === 'FIRST_DRAFT');
    const finalDraftSubmission = submissions.find((item) => item.submissionType?.type === 'FINAL_DRAFT');
    const postingSubmission = submissions.find((item) => item.submissionType?.type === 'POSTING');
    
    // If First Draft or Final Draft is approved and posting is available, select posting stage
    if (
      ((firstDraftSubmission?.status === 'APPROVED' || firstDraftSubmission?.status === 'CLIENT_APPROVED') ||
       (finalDraftSubmission?.status === 'APPROVED' || finalDraftSubmission?.status === 'CLIENT_APPROVED')) &&
      postingSubmission?.status === 'IN_PROGRESS' &&
      selectedStage !== 'POSTING'
    ) {
      console.log('Auto-selecting POSTING stage');
      setSelectedStage('POSTING');
      return;
    }
    
    // DO NOT auto-select Final Draft - let creator manually choose
  }, [submissions, selectedStage]);

  const getVisibleStages = useCallback(() => {
    let stages = [];
    const addedStages = new Set(); // Track which stages have been added
    const agreementSubmission = value('AGREEMENT_FORM');
    const firstDraftSubmission = value('FIRST_DRAFT');
    const finalDraftSubmission = value('FINAL_DRAFT');
    const postingSubmission = value('POSTING');

    console.log('Stage visibility check:', {
      agreementStatus: agreementSubmission?.status,
      firstDraftStatus: firstDraftSubmission?.status,
      finalDraftStatus: finalDraftSubmission?.status,
      postingStatus: postingSubmission?.status,
      hasFinalDraft: !!finalDraftSubmission,
      firstDraftId: firstDraftSubmission?.id,
      finalDraftId: finalDraftSubmission?.id,
    });

    // Always show Agreement stage (will be last and always Stage 01)
    stages.unshift({ ...defaultSubmission[0] });
    addedStages.add('AGREEMENT_FORM');

    // Show Product Delivery info if applicable and Agreement is approved
    if (
      isDelivery &&
      (agreementSubmission?.status === 'APPROVED' ||
        agreementSubmission?.status === 'CLIENT_APPROVED')
    ) {
      stages.unshift({ ...defaultSubmission[1] });
      addedStages.add('PRODUCT_DELIVERY');
    }

    // Show First Draft if Agreement is approved AND (if delivery campaign, delivery info must be submitted)
    if (
      (agreementSubmission?.status === 'APPROVED' ||
        agreementSubmission?.status === 'CLIENT_APPROVED') &&
      (!isDelivery || isLogisticsCompleted) &&
      !addedStages.has('FIRST_DRAFT')
    ) {
      stages.unshift({ ...defaultSubmission.find((s) => s.type === 'FIRST_DRAFT') });
      addedStages.add('FIRST_DRAFT');
    }

    // Show First Draft if Agreement is approved
    // if (
    //   (agreementSubmission?.status === 'APPROVED' ||
    //     agreementSubmission?.status === 'CLIENT_APPROVED') &&
    //   !addedStages.has('FIRST_DRAFT')
    // ) {
    //   stages.unshift({ ...defaultSubmission[1] });
    //   addedStages.add('FIRST_DRAFT');
    // }

    // Show Final Draft ONLY if First Draft is in CHANGES_REQUIRED status
    // OR if Final Draft already exists and is active
    if (
      (firstDraftSubmission?.status === 'CHANGES_REQUIRED' || 
       (finalDraftSubmission && 
      (finalDraftSubmission?.status === 'IN_PROGRESS' || 
       finalDraftSubmission?.status === 'CHANGES_REQUIRED' ||
       finalDraftSubmission?.status === 'PENDING_REVIEW' ||
         finalDraftSubmission?.status === 'APPROVED'))) &&
      !addedStages.has('FINAL_DRAFT')
    ) {
      stages.unshift({ ...defaultSubmission[3] });
      addedStages.add('FINAL_DRAFT');
    }

    // Show Posting if either First Draft or Final Draft is APPROVED
    // Only show posting when the previous stage is fully approved
    if (
      ((firstDraftSubmission?.status === 'APPROVED' && !finalDraftSubmission) ||
       (finalDraftSubmission?.status === 'APPROVED')) &&
      !addedStages.has('POSTING')
    ) {
      stages.unshift({ ...defaultSubmission[4] });
      addedStages.add('POSTING');
    }

    // Show Posting if First Draft is approved without changes (skip Final Draft)
    if (
      firstDraftSubmission?.status === 'APPROVED' &&
      (!finalDraftSubmission || finalDraftSubmission?.status === 'NOT_STARTED') &&
      !addedStages.has('POSTING')
    ) {
      stages.unshift({ ...defaultSubmission[4] });
      addedStages.add('POSTING');
    }

    // Show Posting if it's in progress, pending review, or approved
    if (
      postingSubmission && 
      (postingSubmission?.status === 'IN_PROGRESS' || 
       postingSubmission?.status === 'PENDING_REVIEW' ||
       postingSubmission?.status === 'APPROVED') &&
      !addedStages.has('POSTING')
    ) {
      stages.unshift({ ...defaultSubmission[4] });
      addedStages.add('POSTING');
    }

    if (!postingSubmission) {
      stages = stages.filter((stage) => stage.value !== 'Posting');
    }

    console.log('Final stages to show:', stages.map(s => ({ name: s.name, type: s.type })));

    // Add sequential stage numbers starting from the bottom
    return stages.map((stage, index) => ({
      ...stage,
      stage: stages.length - index, // This makes the bottom item Stage 01
    }));
  }, [value, isDelivery, isLogisticsCompleted]);

  // Helper function to check if a stage is completed (V2 only)
  const isStageCompleted = useCallback(
    (stageType) => {
      if (stageType === 'PRODUCT_DELIVERY') return isLogisticsCompleted;

      const stageValue = value(stageType);
      if (!stageValue) return false;

      // If Posting stage is active, mark First Draft and Final Draft as completed
      const postingSubmission = value('POSTING');
      if (
        (stageType === 'FIRST_DRAFT' || stageType === 'FINAL_DRAFT') &&
        postingSubmission &&
        (postingSubmission.status === 'IN_PROGRESS' ||
          postingSubmission.status === 'PENDING_REVIEW' ||
          postingSubmission.status === 'APPROVED')
      ) {
        return true;
      }

      // V2 statuses - Only APPROVED means completed
      if (stageValue.status === 'APPROVED') {
        return true;
      }

      return false;
    },
    [value, isLogisticsCompleted]
  );

  // Helper function to check if a stage is in progress (V2 only)
  const isStageInProgress = useCallback((stageType) => {
    const stageValue = value(stageType);
    if (!stageValue) return false;
    
    // Only show as "in progress" if it's actually being worked on
    return stageValue.status === 'IN_PROGRESS';
  }, [value]);

  // Helper function to check if a stage needs changes (V2 only)
  const isStageNeedsChanges = useCallback((stageType) => {
    const stageValue = value(stageType);
    if (!stageValue) return false;
    
    // Only show as "needs changes" if changes are actually required
    return stageValue.status === 'CHANGES_REQUIRED';
  }, [value]);

  // Helper function to check if a stage is pending review (V2 only)
  const isStagePendingReview = useCallback((stageType) => {
    const stageValue = value(stageType);
    if (!stageValue) return false;
    
    // Show as "pending review" if it's waiting for admin/client review
    return stageValue.status === 'PENDING_REVIEW' || 
           stageValue.status === 'SENT_TO_CLIENT' ||
           stageValue.status === 'SENT_TO_ADMIN' ||
           stageValue.status === 'CLIENT_FEEDBACK';
  }, [value]);

  // Helper function to get status text for display
  const getStatusText = useCallback(
    (stageType) => {
      if (stageType === 'PRODUCT_DELIVERY')
        return isLogisticsCompleted ? 'Completed' : 'In Progress';

      const stageValue = value(stageType);
      if (!stageValue) return 'Not Started';

      // If Posting stage is active, show First Draft and Final Draft as "Approved"
      const postingSubmission = value('POSTING');
      if (
        (stageType === 'FIRST_DRAFT' || stageType === 'FINAL_DRAFT') &&
        postingSubmission &&
        (postingSubmission.status === 'IN_PROGRESS' ||
          postingSubmission.status === 'PENDING_REVIEW' ||
          postingSubmission.status === 'APPROVED')
      ) {
        return 'Approved';
      }

      // Special handling for 1st Draft when 2nd Draft is active
      // Show 1st Draft as "In Review" when 2nd Draft exists and is being worked on
      // BUT only if the first draft doesn't have CHANGES_REQUIRED status
      if (stageType === 'FIRST_DRAFT' && stageValue.status !== 'CHANGES_REQUIRED') {
        const finalDraftSubmission = value('FINAL_DRAFT');

        // If 2nd Draft exists and is active, show 1st Draft as "In Review"
        if (
          finalDraftSubmission &&
          (finalDraftSubmission.status === 'IN_PROGRESS' ||
            finalDraftSubmission.status === 'PENDING_REVIEW' ||
            finalDraftSubmission.status === 'SENT_TO_CLIENT' ||
            finalDraftSubmission.status === 'CLIENT_FEEDBACK' ||
            finalDraftSubmission.status === 'CHANGES_REQUIRED')
        ) {
          return 'In Review';
        }
      }

      switch (stageValue.status) {
        case 'NOT_STARTED':
          return 'Not Started';
        case 'IN_PROGRESS':
          return 'In Progress';
        case 'PENDING_REVIEW':
          return 'Pending Review';
        case 'SENT_TO_CLIENT':
          return 'In Review'; // For creators, SENT_TO_CLIENT means "In Review"
        case 'CLIENT_FEEDBACK':
          return 'In Review'; // For creators, CLIENT_FEEDBACK means "In Review" (client requested changes, admin reviewing)
        case 'CHANGES_REQUIRED':
          return 'Revision Requested';
        case 'APPROVED':
          return 'Approved';
        case 'CLIENT_APPROVED':
          return 'Submission Approved!'; // Special message for client approval
        case 'SENT_TO_ADMIN':
          return 'In Review'; // For creators, SENT_TO_ADMIN also means "In Review"
        default:
          return stageValue.status;
      }
    },
    [value, isLogisticsCompleted]
  );

  // Helper function to get status color for the label
  const getStatusColor = useCallback(
    (stageType) => {
      if (stageType === 'PRODUCT_DELIVERY') return isLogisticsCompleted ? '#5abc6f' : '#f6c945';

      const stageValue = value(stageType);
      if (!stageValue) return '#f6c945'; // Default yellow for not started

      if (isStageCompleted(stageType)) {
        return '#5abc6f'; // Green for completed
      }

      return '#f6c945'; // Yellow for everything else (in progress, pending, etc.)
    },
    [value, isStageCompleted, isLogisticsCompleted]
  );

  // Helper function to get status icon
  const getStatusIcon = useCallback(
    (stageType) => {
      if (stageType === 'PRODUCT_DELIVERY')
        return isLogisticsCompleted ? 'mingcute:check-circle-fill' : 'mdi:clock';

      const stageValue = value(stageType);
      if (!stageValue) return 'mdi:clock';

      if (isStageCompleted(stageType)) {
        return 'mingcute:check-circle-fill';
      }

      return 'mdi:clock';
    },
    [value, isStageCompleted, isLogisticsCompleted]
  );

  const handleStageClick = (stageType) => {
    console.log('Stage clicked:', stageType);
    console.log('Current selectedStage:', selectedStage);
    console.log('Stage value:', value(stageType));
    console.log('Stage status:', value(stageType)?.status);
    
    // Mark that user has manually selected a stage
    hasManualSelection.current = true;
    
    setSelectedStage(stageType);
    if (!viewedStages.includes(stageType)) {
      const newViewedStages = [...viewedStages, stageType];
      setViewedStages(newViewedStages);
      // Save to localStorage
      localStorage.setItem(
        `viewedStages-${campaign.id}-${user.id}`,
        JSON.stringify(newViewedStages)
      );
    }
  };

  const isNewStage = (stageType) => {
    const stageValue = value(stageType);
    
    // Don't show NEW if stage is already viewed
    if (viewedStages.includes(stageType)) {
      return false;
    }
    
    // Don't show NEW if stage is completed
    if (isStageCompleted(stageType)) {
      return false;
    }
    
    // Don't show NEW for stages that are just waiting for review/feedback
    // These don't require creator action
    if (isStagePendingReview(stageType)) {
      return false;
    }
    
    // Don't show NEW for stages that need changes (creator already knows about this)
    if (isStageNeedsChanges(stageType)) {
      return false;
    }
    
    // Only show NEW for stages that are actually ready for creator to work on
    return stageValue?.status === 'IN_PROGRESS' || stageValue?.status === 'NOT_STARTED';
  };

  // Debug function to track feedback flow and prevent confusion
  const debugFeedbackFlow = useCallback(() => {
    if (!submissions) return;
    
    console.log('🔍 Debugging Feedback Flow for Campaign:', campaign.name);
    console.log('📊 All Submissions:', submissions);
    
    submissions.forEach((submission) => {
      const { submissionType, status, id } = submission;
      console.log(`  ${submissionType?.type}: ${status} (ID: ${id})`);
      
      // Track feedback flow for V2
      if (submissionType?.type === 'FIRST_DRAFT') {
        if (status === 'CHANGES_REQUIRED') {
          console.log('    ⚠️  Creator needs to make changes based on admin feedback');
        } else if (status === 'PENDING_REVIEW') {
          console.log('    🔍 Submission is pending admin review');
        } else if (status === 'APPROVED') {
          console.log('    ✅ Admin approved, stage completed');
        }
      }
      
      if (submissionType?.type === 'FINAL_DRAFT') {
        if (status === 'CHANGES_REQUIRED') {
          console.log('    ⚠️  Creator needs to make changes based on admin feedback');
        } else if (status === 'PENDING_REVIEW') {
          console.log('    🔍 Submission is pending admin review');
        } else if (status === 'APPROVED') {
          console.log('    ✅ Admin approved, stage completed');
        }
      }
    });
    
    console.log('🎯 Current Stage Selection:', selectedStage);
    console.log('👀 Viewed Stages:', viewedStages);
  }, [submissions, campaign.name, selectedStage, viewedStages]);

  // Call debug function when submissions change
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      debugFeedbackFlow();
    }
  }, [submissions, debugFeedbackFlow]);

  if (submissionLoading || isLoading) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  // Render mobile layout on small screens
  if (isMobile) {
    return (
      <MobileSubmissionLayout
        campaign={campaign}
        submissions={submissions}
        value={value}
        user={user}
        getDependency={getDependency}
        getVisibleStages={getVisibleStages}
        getDueDate={getDueDate}
        agreementStatus={agreementStatus}
        logistic={logistic}
        onConfirm={onConfirm}
        mutateLogistic={mutateLogistic}
        setCurrentTab={setCurrentTab}
        deliverablesData={{ deliverables: data, deliverableMutate }}
        viewedStages={viewedStages}
        setViewedStages={setViewedStages}
        isNewStage={isNewStage}
      />
    );
  }

  // Desktop layout (existing code)
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ width: '100%' }}>
      {campaign.status === 'PAUSED' ? (
        <Box component={Card} p={{ xs: 3, md: 20 }}>
          <Stack alignItems="center" justifyContent="center" spacing={2}>
            <Iconify icon="hugeicons:license-maintenance" width={50} />
            <Typography variant="h6" color="text.secondary">
              Campaign is currently under maintenance.
            </Typography>
          </Stack>
        </Box>
      ) : (
        <>
          {/* Left Column - Navigation */}
          <Card
            sx={{
              width: { xs: '100%', md: '50%' },
              minWidth: { md: '320px' },
              maxWidth: { md: '600px' },
              boxShadow: 'none',
              ml: { xs: 0, md: -2 },
              mr: { xs: 0, md: -1.5 },
              mt: { xs: 0, md: -2 },
              mb: { xs: 2, md: 0 },
            }}
          >
            <Box
              sx={{
                height: '100%',
                py: 2,
                px: { xs: 1, md: 0 },
              }}
            >
              {getVisibleStages()?.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    mx: 2,
                    mb: 1,
                    p: 2.5,
                    cursor: 'pointer',
                    borderRadius: 2,
                    bgcolor: selectedStage === item.type ? '#f5f5f5' : 'transparent',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                    },
                    minHeight: 75,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={() => handleStageClick(item.type)}
                >
                  <Stack direction="row" spacing={2} alignItems="center" width="100%">
                    <Label
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: getStatusColor(item.type),
                      }}
                    >
                        <Iconify
                        icon={getStatusIcon(item.type)}
                          sx={{ color: '#fff' }}
                          width={20}
                        />
                    </Label>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#8e8e93',
                          display: 'block',
                          mb: 0.4,
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        Stage {String(item.stage).padStart(2, '0')}
                      </Typography>

                      <Typography variant="subtitle1" sx={{ mb: 0.2 }}>
                        {item.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: '#636366',
                          display: 'block',
                          ...(isStageCompleted(item.type) && {
                            textDecoration: 'line-through',
                            color: '#b0b0b0',
                          }),
                        }}
                      >
                        Due:{' '}
                        {dayjs(
                          item.type === 'PRODUCT_DELIVERY'
                            ? getDueDate('AGREEMENT_FORM')
                            : getDueDate(item.type)
                        ).format('D MMMM, YYYY')}{' '}
                      </Typography>
                      
                      {/* Show status text */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#636366',
                          display: 'block',
                          mt: 0.5,
                          fontWeight: 500,
                        }}
                      >
                        Status: {getStatusText(item.type)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {isNewStage(item.type) && (
                        <Label
                          sx={{
                            bgcolor: 'transparent',
                            color: '#eb4a26',
                            border: '1px solid #eb4a26',
                            borderBottom: '3px solid #eb4a26',
                            borderRadius: 0.7,
                            px: 0.8,
                            py: 1.5,
                            mr: 0.5,
                          }}
                        >
                          NEW
                        </Label>
                      )}
                      <Iconify
                        icon="eva:arrow-ios-forward-fill"
                        sx={{
                          color: 'text.secondary',
                          width: 26,
                          height: 26,
                          ml: 1,
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Card>

          {/* Right Column - Content */}
          <Card
            sx={{
              width: { xs: '100%', md: '60%' },
              flexGrow: 1,
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              mr: { xs: 0, md: 0 },
              mt: { xs: 0 },
              maxWidth: '100%',
              overflow: 'visible',
              height: 'fit-content',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                p: { xs: 2, md: 3 },
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {selectedStage === 'AGREEMENT_FORM' && (
                <CampaignAgreement
                  campaign={campaign}
                  timeline={timeline}
                  submission={value('AGREEMENT_FORM')}
                  getDependency={getDependency}
                  agreementStatus={agreementStatus}
                />
              )}
              {selectedStage === 'PRODUCT_DELIVERY' && (
                <LogisticsForm
                  user={user}
                  isLogisticsCompleted={isLogisticsCompleted}
                  submission={value('AGREEMENT_FORM')}
                  onConfirm={onConfirm}
                  campaignId={campaign.id}
                  onUpdate={async () => {
                    await mutateLogistic();
                    await submissionMutate();
                  }}
                />
              )}
              {selectedStage === 'FIRST_DRAFT' && (
                <CampaignFirstDraft
                  campaign={campaign}
                  timeline={timeline}
                  fullSubmission={submissions}
                  submission={value('FIRST_DRAFT')}
                  getDependency={getDependency}
                  setCurrentTab={setCurrentTab}
                  deliverablesData={{ deliverables: data, deliverableMutate }}
                />
              )}
              {selectedStage === 'FINAL_DRAFT' && (
                <CampaignFinalDraft
                  campaign={campaign}
                  timeline={timeline}
                  submission={value('FINAL_DRAFT')}
                  fullSubmission={submissions}
                  getDependency={getDependency}
                  setCurrentTab={setCurrentTab}
                  deliverablesData={{ deliverables: data, deliverableMutate }}
                />
              )}
              {selectedStage === 'POSTING' && (
                <>
                  {console.log('Rendering POSTING component with:', {
                    submission: value('POSTING'),
                    selectedStage,
                    campaign
                  })}
                  <CampaignPosting
                    campaign={campaign}
                    timeline={timeline}
                    submission={value('POSTING')}
                    fullSubmission={submissions}
                    getDependency={getDependency}
                  />
                </>
              )}
            </Box>
          </Card>
        </>
      )}
    </Stack>
  );
};

export default CampaignMyTasks;

CampaignMyTasks.propTypes = {
  campaign: PropTypes.object,
  logistic: PropTypes.func,
  mutateLogistic: PropTypes.func,
  setCurrentTab: PropTypes.func,
  onConfirm: PropTypes.func,
};