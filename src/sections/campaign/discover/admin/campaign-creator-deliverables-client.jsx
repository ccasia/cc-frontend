/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Avatar,
  TextField,
  Button,
  Accordion,
  Typography,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tooltip,
  InputAdornment,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useGetSubmissionsV3 } from 'src/hooks/use-get-submission-v3';
import { useGetDeliverables } from 'src/hooks/use-get-deliverables';
import socket from 'src/hooks/socket';
import { useAuthContext } from 'src/auth/hooks';
import { useSnackbar } from 'notistack';
import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import FirstDraft from './creator-stuff/submissions/firstDraft';
import FinalDraft from './creator-stuff/submissions/finalDraft';
import Posting from './creator-stuff/submissions/posting/posting';

const CampaignCreatorDeliverablesClient = ({ campaign }) => {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [creatorStatuses, setCreatorStatuses] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'undecided', or 'approved'
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get shortlisted creators from campaign
  const shortlistedCreators = useMemo(() => campaign?.shortlisted || [], [campaign?.shortlisted]);

  // Sort creators alphabetically
  const sortedCreators = useMemo(() => {
    if (!shortlistedCreators.length) return [];

    return [...shortlistedCreators].sort((a, b) => {
      const nameA = (a.user?.name || '').toLowerCase();
      const nameB = (b.user?.name || '').toLowerCase();

      return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [shortlistedCreators, sortDirection]);

  // Get V3 submissions for selected creator
  const {
    data: submissions,
    isLoading: loadingSubmissions,
    mutate: submissionMutate,
  } = useGetSubmissionsV3(selectedCreator?.userId, campaign?.id);

  // Debug logging for submissions
  useEffect(() => {
    console.log('🔍 Client component - Submissions data:', {
      selectedCreator: selectedCreator?.userId,
      campaignId: campaign?.id,
      submissions: submissions?.map(s => ({
        id: s.id,
        type: s.submissionType?.type,
        status: s.status,
        displayStatus: s.displayStatus
      })),
      loadingSubmissions,
      userRole: user?.role,
      isV3: campaign?.origin === 'CLIENT'
    });
  }, [submissions, selectedCreator?.userId, campaign?.id, loadingSubmissions, user?.role, campaign?.origin]);

  // Get deliverables for selected creator
  const {
    data: deliverablesData,
    isLoading: loadingDeliverables,
    mutate: deliverableMutate,
  } = useGetDeliverables(selectedCreator?.userId, campaign?.id);

  // Socket.io progress handling for V3 campaigns
  useEffect(() => {
    if (!socket || campaign?.origin !== 'CLIENT') return;

    const handleProgress = (data) => {
      console.log('V3 Progress received:', data);
      
      // Set processing to true when we receive the first progress event
      if (!isProcessing) {
        setIsProcessing(true);
      }
      
      setUploadProgress((prev) => {
        const exists = prev.some((item) => item.fileName === data.fileName);

        if (exists) {
          return prev.map((item) =>
            item.fileName === data.fileName ? { ...item, ...data } : item
          );
        }
        return [...prev, data];
      });
    };

    socket.on('progress', handleProgress);

    return () => {
      socket.off('progress', handleProgress);
    };
  }, [socket, campaign?.origin, isProcessing]);

  // Check if all uploads are complete
  const checkProgress = useCallback(() => {
    if (uploadProgress?.length && uploadProgress?.every((x) => x.progress === 100)) {
      const timer = setTimeout(() => {
        setIsProcessing(false);
        setUploadProgress([]);
        
        // Refresh data
        if (selectedCreator?.userId && campaign?.id) {
          submissionMutate();
          deliverableMutate();
        }
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
    return null;
  }, [uploadProgress, selectedCreator?.userId, campaign?.id, submissionMutate, deliverableMutate]);

  useEffect(() => {
    checkProgress();
  }, [checkProgress]);

  // Find submissions by type
  const firstDraftSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'FIRST_DRAFT'),
    [submissions]
  );

  const finalDraftSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'FINAL_DRAFT'),
    [submissions]
  );

  const postingSubmission = useMemo(
    () => submissions?.find((item) => item.submissionType.type === 'POSTING'),
    [submissions]
  );

  // Debug logging for posting submission
  useEffect(() => {
    console.log('🔍 Client component - Posting submission:', {
      postingSubmission: postingSubmission ? {
        id: postingSubmission.id,
        type: postingSubmission.submissionType?.type,
        status: postingSubmission.status,
        displayStatus: postingSubmission.displayStatus
      } : null,
      hasSubmissions: !!submissions,
      submissionsCount: submissions?.length,
      userRole: user?.role,
      isV3: campaign?.origin === 'CLIENT'
    });
  }, [postingSubmission, submissions, user?.role, campaign?.origin]);

  const filteredCreators = useMemo(() => {
    let filtered = sortedCreators;

    // Apply status filter
    if (selectedFilter === 'undecided') {
      filtered = filtered.filter((creator) => creator.status === 'undecided');
    } else if (selectedFilter === 'approved') {
      filtered = filtered.filter((creator) => creator.status === 'approved');
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter((elem) =>
        elem.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        (elem.user.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (elem.user.creator?.instagram?.toLowerCase() || '').includes(search.toLowerCase())
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const nameA = a.user.name?.toLowerCase() || '';
      const nameB = b.user.name?.toLowerCase() || '';
      
      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      }
      return nameB.localeCompare(nameA);
    });
  }, [sortedCreators, search, sortDirection, selectedFilter]);

  // Fetch all creator statuses on component mount
  useEffect(() => {
    const fetchAllCreatorStatuses = async () => {
      if (!campaign?.id) return;

      setLoadingStatuses(true);
      const statuses = {};

      try {
        // Fetch statuses for all creators in parallel
        const statusPromises = shortlistedCreators.map(async (creator) => {
          try {
            // For client view, we'll use the V3 submissions API
            const response = await fetch(`/api/submission/v3?campaignId=${campaign.id}&userId=${creator.userId}`);
            const submissions = await response.json();
            
            // Get the most relevant submission status for display
            const firstDraft = submissions.find(s => s.submissionType?.type === 'FIRST_DRAFT');
            const finalDraft = submissions.find(s => s.submissionType?.type === 'FINAL_DRAFT');
            const posting = submissions.find(s => s.submissionType?.type === 'POSTING');
            
            // Debug logging
            console.log(`Creator ${creator.userId} submissions:`, {
              firstDraft: firstDraft?.displayStatus || firstDraft?.status,
              finalDraft: finalDraft?.displayStatus || finalDraft?.status,
              posting: posting?.displayStatus || posting?.status,
              rawFirstDraft: firstDraft,
              rawFinalDraft: finalDraft,
              rawPosting: posting
            });
            
            // Determine overall status based on V3 flow
            let overallStatus = 'NOT_STARTED';
            if (posting?.displayStatus === 'APPROVED') {
              overallStatus = 'APPROVED';
            } else if (finalDraft?.displayStatus === 'APPROVED') {
              overallStatus = 'APPROVED';
            } else if (firstDraft?.displayStatus === 'APPROVED') {
              overallStatus = 'APPROVED';
            } else if (firstDraft?.displayStatus === 'PENDING_REVIEW') {
              overallStatus = 'PENDING_REVIEW';
            } else if (firstDraft?.displayStatus === 'NOT_STARTED') {
              overallStatus = 'NOT_STARTED';
            }
            
            statuses[creator.userId] = overallStatus;
          } catch (error) {
            console.error(`Error fetching status for creator ${creator.userId}:`, error);
            statuses[creator.userId] = 'NOT_STARTED';
          }
        });

        await Promise.all(statusPromises);
        setCreatorStatuses(statuses);
      } catch (error) {
        console.error('Error fetching creator statuses:', error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchAllCreatorStatuses();
  }, [campaign?.id, shortlistedCreators]);

  // Update creator statuses when submissions change for the selected creator
  useEffect(() => {
    if (selectedCreator?.userId && submissions) {
      setCreatorStatuses((prevStatuses) => {
        const newStatuses = { ...prevStatuses };
        
        // Filter out agreement submissions - only consider FIRST_DRAFT, FINAL_DRAFT, and POSTING
        const relevantSubmissions = submissions.filter(
          submission => 
            submission.submissionType?.type === 'FIRST_DRAFT' || 
            submission.submissionType?.type === 'FINAL_DRAFT' || 
            submission.submissionType?.type === 'POSTING'
        );
        
        if (relevantSubmissions.length === 0) {
          newStatuses[selectedCreator.userId] = 'NOT_STARTED';
          return newStatuses;
        }
        
        // Find submissions by type
        const firstDraftSubmission = relevantSubmissions.find(
          item => item.submissionType.type === 'FIRST_DRAFT'
        );
        const finalDraftSubmission = relevantSubmissions.find(
          item => item.submissionType.type === 'FINAL_DRAFT'
        );
        const postingSubmission = relevantSubmissions.find(
          item => item.submissionType.type === 'POSTING'
        );
        
        // Determine the status based on the latest stage in the workflow
        // Priority: Posting > Final Draft > First Draft
        if (postingSubmission) {
          newStatuses[selectedCreator.userId] = postingSubmission.displayStatus || postingSubmission.status;
        } else if (finalDraftSubmission) {
          newStatuses[selectedCreator.userId] = finalDraftSubmission.displayStatus || finalDraftSubmission.status;
        } else if (firstDraftSubmission) {
          newStatuses[selectedCreator.userId] = firstDraftSubmission.displayStatus || firstDraftSubmission.status;
        } else {
          newStatuses[selectedCreator.userId] = 'NOT_STARTED';
        }
        
        return newStatuses;
      });
    }
  }, [selectedCreator?.userId, submissions]);

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Set first creator as selected by default
  useEffect(() => {
    if (filteredCreators?.length && !selectedCreator) {
      setSelectedCreator(filteredCreators[0]);
    }
  }, [filteredCreators, selectedCreator]);

  // Handle creator selection
  const handleCreatorSelect = (creator) => {
    setSelectedCreator(creator);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      APPROVED: {
        color: '#1ABF66',
        borderColor: '#1ABF66',
        tooltip: 'All deliverables have been approved',
      },
      CLIENT_APPROVED: {
        color: '#1ABF66',
        borderColor: '#1ABF66',
        tooltip: 'All deliverables have been approved by client',
      },
      REJECTED: {
        color: '#FF4842',
        borderColor: '#FF4842',
        tooltip: 'One or more deliverables have been rejected',
      },
      PENDING_REVIEW: {
        color: '#FFC702',
        borderColor: '#FFC702',
        tooltip: 'Waiting for admin review',
      },
      IN_PROGRESS: {
        color: '#8A5AFE',
        borderColor: '#8A5AFE',
        tooltip: 'Creator is working on deliverables',
      },
      CHANGES_REQUIRED: {
        color: '#D4321C',
        borderColor: '#D4321C',
        tooltip: 'Changes requested by admin',
      },
      SENT_TO_ADMIN: {
        color: '#D4321C',
        borderColor: '#D4321C',
        tooltip: 'Client feedback sent to admin for review',
      },
      CLIENT_FEEDBACK: {
        color: '#D4321C',
        borderColor: '#D4321C',
        tooltip: 'Client feedback sent to admin for review',
      },
      SENT_TO_CLIENT: {
        color: '#8a5afe',
        borderColor: '#8a5afe',
        tooltip: 'Sent to client for review',
      },
      NOT_STARTED: {
        color: '#8E8E93',
        borderColor: '#8E8E93',
        tooltip: 'Creator has not started work yet',
      },
    };
    
    return statusMap[status] || statusMap.NOT_STARTED;
  };

  const renderCreatorStatus = (userId) => {
    if (loadingStatuses) return <CircularProgress size={16} />;
    
    const status = creatorStatuses[userId] || 'NOT_STARTED';
    let statusText = status.replace(/_/g, ' ');
    
    // Special handling for posting submissions: show "POSTED" when status is "APPROVED"
    // We need to check if this is a posting status by looking at the submissions
    if (status === 'APPROVED' && submissions) {
      const postingSubmission = submissions.find(s => s.submissionType?.type === 'POSTING');
      if (postingSubmission && (postingSubmission.displayStatus === 'APPROVED' || postingSubmission.status === 'APPROVED')) {
        statusText = 'POSTED';
      }
    }
    
    const statusInfo = getStatusInfo(status);
    
    // Debug logging for creator status
    console.log('🔍 Creator status debug:', {
      userId,
      status,
      statusText,
      submissions: submissions?.map(s => ({
        id: s.id,
        type: s.submissionType?.type,
        status: s.status,
        displayStatus: s.displayStatus
      })),
      userRole: userRole,
      isV3: campaign?.origin === 'CLIENT'
    });
    
    return (
      <Tooltip title={statusInfo.tooltip} arrow>
        <Typography
          variant="body2"
          sx={{
            textTransform: 'uppercase',
            display: 'inline-block',
            px: { xs: 0.8, md: 1.2 },
            py: { xs: 0.3, md: 0.4 },
            fontSize: { xs: '0.65rem', md: '0.7rem' },
            fontWeight: 600,
            border: '1px solid',
            borderBottom: { xs: '1.5px solid', md: '2px solid' },
            borderRadius: 0.8,
            bgcolor: 'white',
            whiteSpace: 'nowrap',
            color: statusInfo.color,
            borderColor: statusInfo.color,
          }}
        >
          {statusText}
        </Typography>
      </Tooltip>
    );
  };

  const renderAccordionStatus = (submission) => {
    if (!submission) return null;

    // Use displayStatus for V3 submissions, fallback to regular status
    let status = submission.displayStatus || submission.status;
    let statusText = status ? status.replace(/_/g, ' ') : '';
    
    // Handle SENT_TO_ADMIN status display for admin and client users
    if (status === 'SENT_TO_ADMIN' && (userRole === 'admin' || userRole === 'superadmin' || userRole === 'client')) {
      statusText = 'CLIENT FEEDBACK';
    }
    
    // Special handling for posting submissions: show "POSTED" when status is "APPROVED"
    if (submission.submissionType?.type === 'POSTING' && status === 'APPROVED') {
      statusText = 'POSTED';
    }
    
    const statusInfo = getStatusInfo(status);

    // Enhanced debug logging to understand status transformation
    console.log('🔍 Accordion status debug:', {
      submissionId: submission.id,
      originalStatus: submission.status,
      displayStatus: submission.displayStatus,
      finalStatus: status,
      statusText,
      submissionType: submission.submissionType?.type,
      userRole: userRole,
      isV3: campaign?.origin === 'CLIENT',
      campaignOrigin: campaign?.origin
    });

    return (
      <Tooltip title={statusInfo.tooltip} arrow>
        <Typography
          variant="body2"
          sx={{
            textTransform: 'uppercase',
            display: 'inline-block',
            px: { xs: 1, md: 1.5 },
            py: { xs: 0.4, md: 0.6 },
            fontSize: { xs: '0.65rem', md: '0.75rem' },
            fontWeight: 600,
            border: '1px solid',
            borderBottom: { xs: '2px solid', md: '3px solid' },
            borderRadius: 0.8,
            bgcolor: 'white',
            whiteSpace: 'nowrap',
            color: statusInfo.color,
            borderColor: statusInfo.color,
            ml: { xs: 1, md: 2 },
          }}
        >
          {statusText}
        </Typography>
      </Tooltip>
    );
  };

  const isV3 = campaign?.origin === 'CLIENT';
  const userRole = user?.role; // Use the actual user role from the auth context

  // Helper function to check if deliverables should be shown to clients
  const shouldShowDeliverablesToClient = (submission) => {
    if (!submission) return false;
    
    // For clients, show deliverables when status is PENDING_REVIEW, APPROVED, or other relevant statuses
    if (userRole === 'client') {
      const status = submission.displayStatus || submission.status;
      return status === 'PENDING_REVIEW' || 
             status === 'APPROVED' || 
             status === 'CLIENT_FEEDBACK' ||
             status === 'SENT_TO_CLIENT' ||
             status === 'CHANGES_REQUIRED' ||
             status === 'SENT_TO_ADMIN';
    }
    
    // For admins, show all deliverables
    return true;
  };

  // Handler for admin 'Send to Client'
  const handleSendToClient = async (submissionId) => {
    try {
      // Assuming axiosInstance is available globally or imported elsewhere
      // For now, using fetch for simplicity, but ideally use axiosInstance
      const response = await fetch(`/api/submission/v3/${submissionId}/approve/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: 'All sections approved by admin' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error sending to client');
      }
      // This sets status to SENT_TO_CLIENT
      submissionMutate();
      deliverableMutate();
      // Assuming enqueueSnackbar is available globally or imported elsewhere
      // For now, using console.log for simplicity
      console.log('Sent to client!');
    } catch (error) {
      // Assuming enqueueSnackbar is available globally or imported elsewhere
      // For now, using console.error for simplicity
      console.error(error?.response?.data?.message || 'Error sending to client', error);
    }
  };

  // Client approval handler for V3
  const handleClientApprove = async (submissionId) => {
    try {
      const response = await fetch(`/api/submission/v3/${submissionId}/approve/client`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          submissionId, 
          feedback: 'Approved by client' 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error approving submission');
      }
      
      submissionMutate();
      deliverableMutate();
      enqueueSnackbar('Submission approved successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error approving submission:', error);
      enqueueSnackbar(error.message || 'Error approving submission', { variant: 'error' });
    }
  };

  // Client rejection handler for V3
  const handleClientReject = async (submissionId) => {
    try {
      const response = await fetch(`/api/submission/v3/${submissionId}/request-changes/client`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          submissionId, 
          feedback: 'Changes requested by client',
          reasons: ['Client feedback']
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error rejecting submission');
      }
      
      submissionMutate();
      deliverableMutate();
      enqueueSnackbar('Changes requested successfully!', { variant: 'warning' });
    } catch (error) {
      console.error('Error rejecting submission:', error);
      enqueueSnackbar(error.message || 'Error requesting changes', { variant: 'error' });
    }
  };

  // Individual client approval handlers for media items
  const handleClientApproveVideo = async (mediaId) => {
    try {
      // Optimistic update
      const optimisticData = submissions?.map(submission => {
        if (submission.video?.some(v => v.id === mediaId)) {
          return {
            ...submission,
            video: submission.video.map(v => 
              v.id === mediaId ? { ...v, status: 'APPROVED' } : v
            )
          };
        }
        return submission;
      });
      
      submissionMutate(optimisticData, false);

      const response = await axiosInstance.patch('/api/submission/v3/media/approve/client', {
        mediaId,
        mediaType: 'video',
        feedback: 'Approved by client'
      });
      
      enqueueSnackbar('Video approved successfully!', { variant: 'success' });
      submissionMutate();
      deliverableMutate();
    } catch (error) {
      console.error('Error approving video:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error approving video', { variant: 'error' });
      // Revert optimistic update on error
      submissionMutate();
    }
  };

  const handleClientApprovePhoto = async (mediaId) => {
    try {
      // Optimistic update
      const optimisticData = submissions?.map(submission => {
        if (submission.photos?.some(p => p.id === mediaId)) {
          return {
            ...submission,
            photos: submission.photos.map(p => 
              p.id === mediaId ? { ...p, status: 'APPROVED' } : p
            )
          };
        }
        return submission;
      });
      
      submissionMutate(optimisticData, false);

      const response = await axiosInstance.patch('/api/submission/v3/media/approve/client', {
        mediaId,
        mediaType: 'photo',
        feedback: 'Approved by client'
      });
      
      enqueueSnackbar('Photo approved successfully!', { variant: 'success' });
      submissionMutate();
      deliverableMutate();
    } catch (error) {
      console.error('Error approving photo:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error approving photo', { variant: 'error' });
      // Revert optimistic update on error
      submissionMutate();
    }
  };

  const handleClientApproveRawFootage = async (mediaId) => {
    try {
      // Optimistic update
      const optimisticData = submissions?.map(submission => {
        if (submission.rawFootages?.some(r => r.id === mediaId)) {
          return {
            ...submission,
            rawFootages: submission.rawFootages.map(r => 
              r.id === mediaId ? { ...r, status: 'APPROVED' } : r
            )
          };
        }
        return submission;
      });
      
      submissionMutate(optimisticData, false);

      const response = await axiosInstance.patch('/api/submission/v3/media/approve/client', {
        mediaId,
        mediaType: 'rawFootage',
        feedback: 'Approved by client'
      });
      
      enqueueSnackbar('Raw footage approved successfully!', { variant: 'success' });
      submissionMutate();
      deliverableMutate();
    } catch (error) {
      console.error('Error approving raw footage:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error approving raw footage', { variant: 'error' });
      // Revert optimistic update on error
      submissionMutate();
    }
  };

  const handleClientRejectVideo = async (mediaId, feedback = 'Changes requested by client', reasons = ['Client feedback']) => {
    try {
      const response = await axiosInstance.patch('/api/submission/v3/media/request-changes/client', {
        mediaId,
        mediaType: 'video',
        feedback,
        reasons: reasons || ['Client feedback']
      });
      enqueueSnackbar('Changes requested for video!', { variant: 'warning' });
      submissionMutate();
      deliverableMutate();
    } catch (error) {
      console.error('Error rejecting video:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error requesting changes', { variant: 'error' });
    }
  };

  const handleClientRejectPhoto = async (mediaId, feedback = 'Changes requested by client', reasons = ['Client feedback']) => {
    try {
      const response = await axiosInstance.patch('/api/submission/v3/media/request-changes/client', {
        mediaId,
        mediaType: 'photo',
        feedback,
        reasons: reasons || ['Client feedback']
      });
      enqueueSnackbar('Changes requested for photo!', { variant: 'warning' });
      submissionMutate();
      deliverableMutate();
    } catch (error) {
      console.error('Error rejecting photo:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error requesting changes', { variant: 'error' });
    }
  };

  const handleClientRejectRawFootage = async (mediaId, feedback = 'Changes requested by client', reasons = ['Client feedback']) => {
    try {
      const response = await axiosInstance.patch('/api/submission/v3/media/request-changes/client', {
        mediaId,
        mediaType: 'rawFootage',
        feedback,
        reasons: reasons || ['Client feedback']
      });
      enqueueSnackbar('Changes requested for raw footage!', { variant: 'warning' });
      submissionMutate();
      deliverableMutate();
    } catch (error) {
      console.error('Error rejecting raw footage:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error requesting changes', { variant: 'error' });
    }
  };

  // Handler for admin to review and forward client feedback
  const handleReviewAndForwardFeedback = async (submissionId, adminFeedback) => {
    try {
      console.log('Admin reviewing and forwarding client feedback for submission:', submissionId);
      
      const response = await axiosInstance.patch(endpoints.submission.v3.reviewAndForwardFeedback, {
        submissionId,
        adminFeedback
      });

      if (response.status === 200) {
        enqueueSnackbar('Client feedback reviewed and forwarded to creator successfully!', {
          variant: 'success',
        });
        
        // Refresh data
        await submissionMutate();
        await deliverableMutate();
      }
    } catch (error) {
      console.error('Error reviewing and forwarding client feedback:', error);
      enqueueSnackbar('Failed to review and forward client feedback', {
        variant: 'error',
      });
    }
  };

  return (
    <Stack
      direction="column"
      spacing={2}
      sx={{
        width: '100%',
        px: { xs: 1, md: 0 },
      }}
    >
      {/* Search and Sort Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 2 },
          justifyContent: { xs: 'stretch', sm: 'flex-start' },
          alignItems: { xs: 'stretch', sm: 'center' },
          width: '100%',
          mb: { xs: 1, sm: 2 },
        }}
      >
        <TextField
          placeholder="Search by Creator Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
            sx: {
              height: '42px',
              '& input': {
                py: 3,
                height: '42px',
              },
            },
          }}
          sx={{
            width: '100%',
            maxWidth: { sm: 260 },
            flexGrow: { sm: 0 },
            '& .MuiOutlinedInput-root': {
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
            },
          }}
        />
        <Button
          onClick={handleToggleSort}
          endIcon={
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {sortDirection === 'asc' ? (
                <Stack direction="column" alignItems="center" spacing={0}>
                  <Typography
                    variant="caption"
                    sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                  >
                    A
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                  >
                    Z
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="column" alignItems="center" spacing={0}>
                  <Typography
                    variant="caption"
                    sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                  >
                    Z
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                  >
                    A
                  </Typography>
                </Stack>
              )}
              <Iconify
                icon={sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'}
                width={12}
              />
            </Stack>
          }
          sx={{
            px: 1.5,
            py: 0.75,
            height: '42px',
            color: '#637381',
            fontWeight: 600,
            fontSize: '0.875rem',
            backgroundColor: { xs: '#f9f9f9', sm: 'transparent' },
            border: { xs: '1px solid #e7e7e7', sm: 'none' },
            borderBottom: { xs: '3px solid #e7e7e7', sm: 'none' },
            borderRadius: 1,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: '140px' },
            justifyContent: { xs: 'space-between', sm: 'center' },
            '&:hover': {
              backgroundColor: { xs: '#f5f5f5', sm: 'transparent' },
              color: '#221f20',
            },
          }}
        >
          Alphabetical
        </Button>
      </Box>

      {/* Progress Display for V3 Uploads */}
      {campaign?.origin === 'CLIENT' && isProcessing && uploadProgress.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, color: '#221f20', fontWeight: 600 }}>
            Processing Uploads...
          </Typography>
          <Stack spacing={2}>
            {uploadProgress.map((currentFile) => (
              <Box
                sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2, border: '1px solid #e7e7e7' }}
                key={currentFile.fileName}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {currentFile?.type?.startsWith('video') ? (
                      <Box
                        sx={{
                          width: 120,
                          height: 68,
                          borderRadius: 1,
                          overflow: 'hidden',
                          position: 'relative',
                          bgcolor: 'background.paper',
                          boxShadow: (theme) => theme.customShadows.z8,
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.neutral',
                          }}
                        >
                          <Iconify
                            icon="solar:video-library-bold"
                            width={24}
                            sx={{ color: 'text.secondary' }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src="/assets/icons/files/ic_img.svg"
                        sx={{ width: 40, height: 40 }}
                      />
                    )}

                    <Stack spacing={1} flexGrow={1}>
                      <Typography variant="subtitle2" noWrap>
                        {currentFile?.fileName || 'Processing file...'}
                      </Typography>
                      <Stack spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={currentFile?.progress || 0}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1,
                              bgcolor: currentFile?.progress === 100 ? 'success.main' : 'primary.main',
                            },
                          }}
                        />
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {currentFile?.progress === 100 ? (
                              <Box
                                component="span"
                                sx={{ color: 'success.main', fontWeight: 600 }}
                              >
                                Processing Complete
                              </Box>
                            ) : (
                              `Processing... ${currentFile?.progress || 0}%`
                            )}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {currentFile?.name || 'Processing'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Content Row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 1.5, md: 2.5 }}
        sx={{
          width: '100%',
        }}
      >
        {/* Left Column - Creator Navigation */}
        <Box
          sx={{
            width: { xs: '100%', md: '35%' },
            minWidth: { xs: '100%', md: '320px' },
            maxWidth: { xs: '100%', md: '600px' },
            boxShadow: 'none',
            ml: { xs: 0, md: -2 },
            mr: { xs: 0, md: -1.5 },
            mt: { xs: 0, md: -1.55 },
            mb: { xs: 2, md: 0 },
          }}
        >
          <Box
            sx={{
              py: { xs: 1, md: 2 },
              px: { xs: 0, md: 0 },
              height: '100%',
              maxHeight: { xs: '50vh', md: '80vh' },
              overflowY: 'auto',
              border: { xs: '1px solid #e7e7e7', md: 'none' },
              borderRadius: { xs: 2, md: 0 },
            }}
          >
            {filteredCreators.length > 0 ? (
              filteredCreators.map((creator) => (
                <Box
                  key={creator.userId}
                  sx={{
                    mx: { xs: 1, md: 2 },
                    mb: 1,
                    p: { xs: 2, md: 2.5 },
                    cursor: 'pointer',
                    borderRadius: 2,
                    bgcolor: selectedCreator?.userId === creator.userId ? '#f5f5f5' : 'transparent',
                    '&:hover': { bgcolor: '#f5f5f5' },
                    minHeight: 75,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={() => handleCreatorSelect(creator)}
                >
                  <Stack direction="row" spacing={2} alignItems="center" width="100%">
                    <Avatar
                      src={creator.user?.photoURL || '/assets/images/avatar/avatar_default.jpg'}
                      alt={creator.user?.name}
                      sx={{
                        width: { xs: 40, md: 48 },
                        height: { xs: 40, md: 48 },
                      }}
                    />

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        sx={{ mb: 0.2, fontWeight: 400, fontSize: { xs: '0.9rem', md: '1rem' }, color: '#231F20' }}
                      >
                        {creator.user?.name}
                      </Typography>
                    </Box>

                    {renderCreatorStatus(creator.userId)}

                    <Iconify
                      icon="eva:arrow-ios-forward-fill"
                      sx={{
                        color: 'text.secondary',
                        width: { xs: 20, md: 26 },
                        height: { xs: 20, md: 26 },
                        ml: 1,
                        display: { xs: 'none', sm: 'block' },
                      }}
                    />
                  </Stack>
                </Box>
              ))
            ) : (
              <EmptyContent title="No shortlisted creators found" />
            )}
          </Box>
        </Box>

        {/* Right Column - Content */}
        <Box
          sx={{
            width: { xs: '100%', md: '55%' },
            flexGrow: 1,
            mr: { xs: 0, md: 0 },
            mt: { xs: 0, md: 0 },
            overflow: 'auto',
          }}
        >
          {!selectedCreator && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: { xs: 2, md: 3 },
              }}
            >
              <EmptyContent title="Select a creator from the left panel to view their submissions." />
            </Box>
          )}

          {selectedCreator && loadingSubmissions && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: { xs: 2, md: 3 },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
              }}
            >
              <Typography>Loading submissions...</Typography>
            </Box>
          )}

          {selectedCreator && !loadingSubmissions && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: { xs: 1.5, md: 2.5 },
                boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Stack spacing={1.5}>
                {/* First Draft Accordion */}
                <Accordion
                  expanded={expandedAccordion === 'firstDraft'}
                  onChange={handleAccordionChange('firstDraft')}
                  sx={{
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '16px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: 0,
                    },
                    '& .MuiAccordionSummary-root': {
                      borderRadius: expandedAccordion === 'firstDraft' ? '16px 16px 0 0' : 16,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expandedAccordion === 'firstDraft' ? (
                        <Iconify
                          icon="eva:arrow-ios-upward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      ) : (
                        <Iconify
                          icon="eva:arrow-ios-forward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      )
                    }
                    sx={{
                      borderBottom: expandedAccordion === 'firstDraft' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor:
                        expandedAccordion === 'firstDraft' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="flex-start"
                      spacing={1.5}
                      width="100%"
                      pr={2}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#231F20',
                            fontSize: { xs: '0.9rem', md: '1.125rem' },
                            ml: 1,
                            width: 110,
                          }}
                        >
                          First Draft
                        </Typography>
                        {renderAccordionStatus(firstDraftSubmission)}
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      p: 0,
                      '& > *': {
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 1.5, md: 2 },
                      },
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
                    {firstDraftSubmission ? (
                      <>
                        {isV3 && userRole === 'admin' && firstDraftSubmission?.displayStatus === 'PENDING_REVIEW' && (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ 
                              mb: 2,
                              fontSize: '0.75rem',
                              py: 0.8,
                              px: 1.5,
                              minWidth: 'auto',
                              bgcolor: '#FFC702',
                              borderBottom: '3px solid #e6b300',
                              fontWeight: 600,
                              borderRadius: '8px',
                              textTransform: 'none',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#e6b300',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(255, 199, 2, 0.3)',
                              },
                            }}
                            onClick={() => handleSendToClient(firstDraftSubmission.id)}
                          >
                            Send to Client
                          </Button>
                        )}
                        {isV3 && userRole === 'admin' && firstDraftSubmission?.displayStatus === 'SENT_TO_ADMIN' && (
                          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                // TODO: Open feedback edit modal
                                const adminFeedback = prompt('Edit client feedback (optional):');
                                if (adminFeedback !== null) {
                                  handleReviewAndForwardFeedback(firstDraftSubmission.id, adminFeedback);
                                }
                              }}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.8,
                                px: 1.5,
                                minWidth: 'auto',
                                border: '1.5px solid #e0e0e0',
                                borderBottom: '3px solid #e0e0e0',
                                color: '#000000',
                                fontWeight: 600,
                                borderRadius: '8px',
                                textTransform: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#f5f5f5',
                                  color: '#000000',
                                  borderColor: '#d0d0d0',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                },
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleReviewAndForwardFeedback(firstDraftSubmission.id)}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.8,
                                px: 1.5,
                                minWidth: 'auto',
                                bgcolor: '#ffffff',
                                border: '1.5px solid #e0e0e0',
                                borderBottom: '3px solid #e0e0e0',
                                color: '#1ABF66',
                                fontWeight: 600,
                                borderRadius: '8px',
                                textTransform: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#f0f9f0',
                                  color: '#1ABF66',
                                  borderColor: '#d0d0d0',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(26, 191, 102, 0.2)',
                                },
                              }}
                            >
                              Send to Creator
                            </Button>
                          </Stack>
                        )}
                        {shouldShowDeliverablesToClient(firstDraftSubmission) ? (
                          <FirstDraft
                            submission={firstDraftSubmission}
                            campaign={campaign}
                            creator={selectedCreator}
                            deliverablesData={{
                              deliverables: deliverablesData,
                              deliverableMutate,
                              submissionMutate,
                            }}
                            isV3={true}
                            // Individual client approval handlers
                            handleClientApproveVideo={handleClientApproveVideo}
                            handleClientApprovePhoto={handleClientApprovePhoto}
                            handleClientApproveRawFootage={handleClientApproveRawFootage}
                            handleClientRejectVideo={handleClientRejectVideo}
                            handleClientRejectPhoto={handleClientRejectPhoto}
                            handleClientRejectRawFootage={handleClientRejectRawFootage}
                          />
                        ) : (
                          <Box sx={{ p: 3 }}>
                            <EmptyContent 
                              title="No deliverables found" 
                              description="This submission doesn't have any deliverables available for review yet."
                            />
                          </Box>
                        )}
                      </>
                    ) : (
                      <Box sx={{ p: 3 }}>
                        <EmptyContent title="No first draft submission found" />
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Final Draft Accordion */}
                <Accordion
                  expanded={expandedAccordion === 'finalDraft'}
                  onChange={handleAccordionChange('finalDraft')}
                  sx={{
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '16px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: 0,
                    },
                    '& .MuiAccordionSummary-root': {
                      borderRadius: expandedAccordion === 'finalDraft' ? '16px 16px 0 0' : 16,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expandedAccordion === 'finalDraft' ? (
                        <Iconify
                          icon="eva:arrow-ios-upward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      ) : (
                        <Iconify
                          icon="eva:arrow-ios-forward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      )
                    }
                    sx={{
                      borderBottom: expandedAccordion === 'finalDraft' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor:
                        expandedAccordion === 'finalDraft' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="flex-start"
                      spacing={1.5}
                      width="100%"
                      pr={2}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#221f20',
                            fontSize: { xs: '0.9rem', md: '1.125rem' },
                            ml: 1,
                            width: 110,
                          }}
                        >
                          Final Draft
                        </Typography>
                        {renderAccordionStatus(finalDraftSubmission)}
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      p: 0,
                      '& > *': {
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 1.5, md: 2 },
                      },
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
                    {finalDraftSubmission ? (
                      <>
                        {isV3 && userRole === 'admin' && finalDraftSubmission?.displayStatus === 'PENDING_REVIEW' && (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ 
                              mb: 2,
                              fontSize: '0.75rem',
                              py: 0.8,
                              px: 1.5,
                              minWidth: 'auto',
                              bgcolor: '#FFC702',
                              borderBottom: '3px solid #e6b300',
                              fontWeight: 600,
                              borderRadius: '8px',
                              textTransform: 'none',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#e6b300',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(255, 199, 2, 0.3)',
                              },
                            }}
                            onClick={() => handleSendToClient(finalDraftSubmission.id)}
                          >
                            Send to Client
                          </Button>
                        )}
                        {isV3 && userRole === 'admin' && finalDraftSubmission?.displayStatus === 'CLIENT_FEEDBACK' && (
                          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                // TODO: Open feedback edit modal
                                const adminFeedback = prompt('Edit client feedback (optional):');
                                if (adminFeedback !== null) {
                                  handleReviewAndForwardFeedback(finalDraftSubmission.id, adminFeedback);
                                }
                              }}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.8,
                                px: 1.5,
                                minWidth: 'auto',
                                border: '1.5px solid #e0e0e0',
                                borderBottom: '3px solid #e0e0e0',
                                color: '#000000',
                                fontWeight: 600,
                                borderRadius: '8px',
                                textTransform: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#f5f5f5',
                                  color: '#000000',
                                  borderColor: '#d0d0d0',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                },
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleReviewAndForwardFeedback(finalDraftSubmission.id)}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.8,
                                px: 1.5,
                                minWidth: 'auto',
                                bgcolor: '#ffffff',
                                border: '1.5px solid #e0e0e0',
                                borderBottom: '3px solid #e0e0e0',
                                color: '#1ABF66',
                                fontWeight: 600,
                                borderRadius: '8px',
                                textTransform: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#f0f9f0',
                                  color: '#1ABF66',
                                  borderColor: '#d0d0d0',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(26, 191, 102, 0.2)',
                                },
                              }}
                            >
                              Send to Creator
                            </Button>
                          </Stack>
                        )}
                        {shouldShowDeliverablesToClient(finalDraftSubmission) ? (
                          <FinalDraft
                            submission={finalDraftSubmission}
                            campaign={campaign}
                            creator={selectedCreator}
                            firstDraftSubmission={firstDraftSubmission}
                            deliverablesData={{
                              deliverables: deliverablesData,
                              deliverableMutate,
                              submissionMutate,
                            }}
                            isV3={true}
                            // Individual client approval handlers
                            handleClientApproveVideo={handleClientApproveVideo}
                            handleClientApprovePhoto={handleClientApprovePhoto}
                            handleClientApproveRawFootage={handleClientApproveRawFootage}
                            handleClientRejectVideo={handleClientRejectVideo}
                            handleClientRejectPhoto={handleClientRejectPhoto}
                            handleClientRejectRawFootage={handleClientRejectRawFootage}
                          />
                        ) : (
                          <Box sx={{ p: 3 }}>
                            <EmptyContent 
                              title="No deliverables found" 
                              description="This submission doesn't have any deliverables available for review yet."
                            />
                          </Box>
                        )}
                      </>
                    ) : (
                      <Box sx={{ p: 3 }}>
                        <EmptyContent title="No final draft submission found" />
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Posting Link Accordion */}
                <Accordion
                  expanded={expandedAccordion === 'posting'}
                  onChange={handleAccordionChange('posting')}
                  sx={{
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '16px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: 0,
                    },
                    '& .MuiAccordionSummary-root': {
                      borderRadius: expandedAccordion === 'posting' ? '16px 16px 0 0' : 16,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      expandedAccordion === 'posting' ? (
                        <Iconify
                          icon="eva:arrow-ios-upward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      ) : (
                        <Iconify
                          icon="eva:arrow-ios-forward-fill"
                          width={24}
                          height={24}
                          color="#8E8E93"
                        />
                      )
                    }
                    sx={{
                      borderBottom: expandedAccordion === 'posting' ? '1px solid' : 'none',
                      borderColor: 'divider',
                      p: { xs: 1, md: 1.5 },
                      minHeight: { xs: 48, md: 54 },
                      bgcolor:
                        expandedAccordion === 'posting' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="flex-start"
                      spacing={1.5}
                      width="100%"
                      pr={2}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#221f20',
                            fontSize: { xs: '0.9rem', md: '1.125rem' },
                            ml: 1,
                            width: 110,
                          }}
                        >
                          Posting Link
                        </Typography>
                        {renderAccordionStatus(postingSubmission)}
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      p: 0,
                      '& > *': {
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 1.5, md: 2 },
                      },
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
                    {postingSubmission ? (
                      <>
                        {isV3 && userRole === 'admin' && postingSubmission?.displayStatus === 'PENDING_REVIEW' && (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ 
                              mb: 2,
                              fontSize: '0.75rem',
                              py: 0.8,
                              px: 1.5,
                              minWidth: 'auto',
                              bgcolor: '#FFC702',
                              borderBottom: '3px solid #e6b300',
                              fontWeight: 600,
                              borderRadius: '8px',
                              textTransform: 'none',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#e6b300',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(255, 199, 2, 0.3)',
                              },
                            }}
                            onClick={() => handleSendToClient(postingSubmission.id)}
                          >
                            Send to Client
                          </Button>
                        )}
                        {isV3 && userRole === 'admin' && postingSubmission?.displayStatus === 'CLIENT_FEEDBACK' && (
                          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                // TODO: Open feedback edit modal
                                const adminFeedback = prompt('Edit client feedback (optional):');
                                if (adminFeedback !== null) {
                                  handleReviewAndForwardFeedback(postingSubmission.id, adminFeedback);
                                }
                              }}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.8,
                                px: 1.5,
                                minWidth: 'auto',
                                border: '1.5px solid #e0e0e0',
                                borderBottom: '3px solid #e0e0e0',
                                color: '#000000',
                                fontWeight: 600,
                                borderRadius: '8px',
                                textTransform: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#f5f5f5',
                                  color: '#000000',
                                  borderColor: '#d0d0d0',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                },
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleReviewAndForwardFeedback(postingSubmission.id)}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.8,
                                px: 1.5,
                                minWidth: 'auto',
                                bgcolor: '#ffffff',
                                border: '1.5px solid #e0e0e0',
                                borderBottom: '3px solid #e0e0e0',
                                color: '#1ABF66',
                                fontWeight: 600,
                                borderRadius: '8px',
                                textTransform: 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: '#f0f9f0',
                                  color: '#1ABF66',
                                  borderColor: '#d0d0d0',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(26, 191, 102, 0.2)',
                                },
                              }}
                            >
                              Send to Creator
                            </Button>
                          </Stack>
                        )}
                        {shouldShowDeliverablesToClient(postingSubmission) ? (
                          <Posting
                            submission={postingSubmission}
                            campaign={campaign}
                            creator={selectedCreator}
                            isV3={true}
                            // Individual client approval handlers
                            handleClientApproveVideo={handleClientApproveVideo}
                            handleClientApprovePhoto={handleClientApprovePhoto}
                            handleClientApproveRawFootage={handleClientApproveRawFootage}
                            handleClientRejectVideo={handleClientRejectVideo}
                            handleClientRejectPhoto={handleClientRejectPhoto}
                            handleClientRejectRawFootage={handleClientRejectRawFootage}
                          />
                        ) : (
                          <Box sx={{ p: 3 }}>
                            <EmptyContent 
                              title="No deliverables found" 
                              description="This submission doesn't have any deliverables available for review yet."
                            />
                          </Box>
                        )}
                      </>
                    ) : (
                      <Box sx={{ p: 3 }}>
                        <EmptyContent title="No posting submission found" />
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Stack>
            </Box>
          )}
        </Box>
      </Stack>
    </Stack>
  );
};

CampaignCreatorDeliverablesClient.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignCreatorDeliverablesClient; 