import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Link
} from '@mui/material';

import axiosInstance from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';
import { PhotoModal } from '../../creator-stuff/submissions/firstDraft/media-modals';

import { options_changes } from './constants';

// ----------------------------------------------------------------------

const BUTTON_STYLES = {
  base: {
    borderRadius: 1,
    border: '1px solid #E7E7E7',
    backgroundColor: '#FFFFFF',
    boxShadow: 'inset 0px -2px 0px 0px #E7E7E7',
    fontSize: 12,
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: '#F5F5F5',
      boxShadow: 'inset 0px -2px 0px 0px #E7E7E7'
    },
  },
  success: {
    color: '#1ABF66',
  },
  warning: {
    color: '#D4321C',
  },
  secondary: {
    color: '#000',
  }
};

const FEEDBACK_CHIP_STYLES = {
  border: '1px solid',
  pb: 1.8,
  pt: 1.6,
  borderColor: '#D4321C',
  borderRadius: 0.8,
  boxShadow: `0px -1.7px 0px 0px #D4321C inset`,
  bgcolor: '#fff',
  color: '#D4321C',
  fontWeight: 'bold',
  fontSize: 12,
  mr: 0.5,
  mb: 0.5
};

function FeedbackDisplay({ feedback, submission, isClient }) {
  if (!feedback) return null;

  // Check if feedback has any content or reasons
  const hasReasons = feedback.reasons && feedback.reasons.length > 0;
  const hasContent = feedback.content && feedback.content.trim().length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}>
      {(!isClient && hasContent && submission.status === 'CHANGES_REQUIRED') && <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={1}>CS Feedback</Typography>}
      {(!isClient && hasContent && submission.status === 'SENT_TO_CLIENT') && <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={1}>CS Comments</Typography>}
      {hasReasons && (
        <Box>
          {feedback.reasons.map((reason, reasonIndex) => (
            <Chip 
              sx={FEEDBACK_CHIP_STYLES}
              key={reasonIndex} 
              label={reason} 
              size="small" 
              variant="outlined" 
              color="warning" 
            />
          ))}
        </Box>
      )}
      {(isClient && hasContent && submission.status === 'SENT_TO_CLIENT') && <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={0.5}>CS Comments</Typography>}
      {(!isClient && hasContent && submission.status === 'CLIENT_APPROVED') && <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={0.5}>Client Feedback</Typography>}
      {hasContent && (
        <Typography fontSize={12} sx={{ mb: 0.5 }}>
          {feedback.content}
        </Typography>
      )}
    </Box>
  );
}

function PostingLinkSection({ submission, onUpdate }) {
  const { user } = useAuthContext();
  const [postingLink, setPostingLink] = useState(submission.content || '');
  const [loading, setLoading] = useState(false);

  // Determine user role hierarchy
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isSuperAdmin = userRole.toLowerCase() === 'superadmin';
  
  const handleSubmitPostingLink = useCallback(async () => {
    if (!postingLink.trim()) {
      enqueueSnackbar('Please enter a posting link', { variant: 'warning' });
      return;
    }

    // Validate URL format
    try {
      new URL(postingLink.trim());
    } catch {
      enqueueSnackbar('Please enter a valid URL', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.put('/api/submissions/v4/posting-link', {
        submissionId: submission.id,
        postingLink: postingLink.trim()
      });

      enqueueSnackbar('Posting link updated successfully', { variant: 'success' });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating posting link:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to update posting link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [postingLink, submission.id, onUpdate]);

  const handleApprovePosting = useCallback(async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/approve', {
        submissionId: submission.id,
        action: 'approve'
      });

      enqueueSnackbar('Posting link approved successfully', { variant: 'success' });
      onUpdate?.();
    } catch (error) {
      console.error('Error approving posting link:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve posting link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [submission.id, onUpdate]);

  const handleRejectPosting = useCallback(async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/approve', {
        submissionId: submission.id,
        action: 'reject'
      });

      enqueueSnackbar('Posting link rejected successfully', { variant: 'success' });
      onUpdate?.();
    } catch (error) {
      console.error('Error rejecting posting link:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to reject posting link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [submission.id, onUpdate]);

  const isPosted = submission.status === 'POSTED';
  
  // Determine who added the posting link and show appropriate controls
  const postingLinkAddedByAdmin = Boolean(submission.admin?.userId);

  return (
    <Box sx={{ flex: '0 0 auto' }}>

        <Box>
          {isPosted && (
            <Box display="flex" sx={{ mb: 1 }}>
              <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ mr: 0.5 }}>
                Date approved:
              </Typography>
              <Typography variant="caption" color="#636366">
                {new Date(submission.updatedAt).toLocaleDateString('en-GB')}
              </Typography>
            </Box>
          )}
          
          {/* Show who added the posting link if it was an admin */}
          {!isPosted && postingLinkAddedByAdmin && submission.content && (
            <Box display="flex" sx={{ mb: 1 }}>
              <Typography variant="caption" color="#636366" sx={{ fontStyle: 'italic' }}>
                Added by admin: {submission.admin?.user?.name} • Requires superadmin approval
              </Typography>
            </Box>
          )}

          {/* Posting link content exists */}
          {submission.content && 
            <Box sx={{ 
              p: 2, 
              border: '1px solid #E7E7E7', 
              borderRadius: 1, 
              bgcolor: 'background.paper',
              mb: 2
            }}>
              <Link 
                href={submission.content} 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  wordBreak: 'break-all',
                  color: '#0062CD',
                  textDecoration: 'underline',
                  fontSize: 14,
                  '&:hover': {
                    color: '#004A9F'
                  }
                }}
              >
                {submission.content}
              </Link>
            </Box>          
          }
          
          {/* Posting link by creator and user is Admin/Superadmin */}
          {!postingLinkAddedByAdmin && !isPosted && submission.content && (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="contained"
                color="warning"
                size="small"
                onClick={handleRejectPosting}
                disabled={loading}
                sx={{
                  ...BUTTON_STYLES.base,
                  ...BUTTON_STYLES.warning,
                }}
              >
                {loading ? 'Processing...' : 'Request a Change'}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={handleApprovePosting}
                disabled={loading}
                sx={{
                  ...BUTTON_STYLES.base,
                  ...BUTTON_STYLES.success,
                }}
              >
                {loading ? 'Processing...' : 'Approve'}
              </Button>
            </Stack>
          )}

          {/* Posting link added by admin and user is Superadmin */}
          {postingLinkAddedByAdmin && !isPosted && submission.content && isSuperAdmin && (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="contained"
                color="warning"
                size="small"
                onClick={handleRejectPosting}
                disabled={loading}
                sx={{
                  ...BUTTON_STYLES.base,
                  ...BUTTON_STYLES.warning,
                }}
              >
                {loading ? 'Processing...' : 'Request a Change'}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={handleApprovePosting}
                disabled={loading}
                sx={{
                  ...BUTTON_STYLES.base,
                  ...BUTTON_STYLES.success,
                }}
              >
                {loading ? 'Processing...' : 'Approve'}
              </Button>
            </Stack>
          )}

          {/* Posting link content is null */}
          {!submission.content &&
            <Box display={'flex'} flexDirection={'column'}>
              <Typography variant="caption" fontWeight="bold" color="#636366">
                Posting Link
              </Typography>
              <TextField
                fullWidth
                size="medium"
                placeholder="Enter posting link URL..."
                value={postingLink}
                onChange={(e) => setPostingLink(e.target.value)}
                disabled={loading}
                sx={{
                  mt: 1,
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
              <Box alignSelf={'flex-end'}>
                <Button
                  variant="contained"
                  color="success"
                  size='small'
                  onClick={handleSubmitPostingLink}
                  disabled={loading}
                  sx={{
                    ...BUTTON_STYLES.base,
                    ...BUTTON_STYLES.success
                  }}
                >
                  {loading ? 'Saving...' : 'Approve'}
                </Button>
              </Box>
            </Box>          
          }

        </Box>
    </Box>
  );
}

function FeedbackSection({ submission, isVisible, isClient }) {
  if (!isVisible || !submission.feedback || submission.feedback.length === 0) {
    return null;
  }

  // Filter feedback based on user role and feedback type
  const filteredFeedback = submission.feedback.filter(feedback => {
    if (isClient) {
      // Clients should only see COMMENT type feedback (when admin sends to client)
      return feedback.type === 'COMMENT';
    } else {
      return feedback.type;
    }
  });

  // Always show the latest relevant feedback, even if it's empty
  // This ensures consistent display so users know the latest action
  if (filteredFeedback.length === 0) {
    return null;
  }

  const latestFeedback = filteredFeedback[0];
  const showContent = submission.status !== 'CLIENT_FEEDBACK';

  return (
    <Box sx={{ flex: 1, overflow: 'auto' }}>
      <Stack spacing={1}>
        <FeedbackDisplay 
          submission={submission}
          feedback={latestFeedback} 
          showContent={showContent}
          isClient={isClient}
        />
      </Stack>
    </Box>
  );
}

/*
 * Helper function to determine visibility and permissions for feedback actions
 * 
 * VISIBILITY RULES:
 * 1. Admins see feedback actions when submission is PENDING_REVIEW or CLIENT_FEEDBACK
 * 2. Clients see feedback actions when submission is SENT_TO_CLIENT
 * 3. Request Change button: visible when content is visible AND not in client feedback
 * 4. Approve button: visible when NOT in client feedback AND NOT in request mode
 * 5. Admin-only actions: only admins see client feedback response buttons
 */
function getFeedbackActionsVisibility({
  isClient,
  submission,
  clientVisible,
  isClientFeedback,
  action
}) {
  // Main section visibility:
  // - Admins: when submission is PENDING_REVIEW or CLIENT_FEEDBACK
  // - Clients: when submission is SENT_TO_CLIENT
  const showFeedbackActions = 
    (!isClient && (submission.status === 'PENDING_REVIEW' || submission.status === 'CLIENT_FEEDBACK')) ||
    (isClient && submission.status === 'SENT_TO_CLIENT');

  // Request Change button visibility:
  // - Visible when client can see content AND not in client feedback status
  const showRequestChangeButton = clientVisible && !isClientFeedback && action !== 'request_revision';

  // Change request form visibility:
  // - Visible when user is in request_revision mode AND client can see content
  const showChangeRequestForm = action === 'request_revision' && clientVisible;

  // Approve button visibility:
  // - Visible when NOT in client feedback status AND NOT in request_revision mode
  const showApproveButton = !isClientFeedback && action !== 'request_revision';

  // Admin-only client feedback actions:
  // - Only admins can see this when submission has client feedback
  const showAdminClientFeedbackActions = !isClient && isClientFeedback && action !== 'request_revision';

  // Reasons dropdown visibility:
  // - Visible when user is in request mode
  const showReasonsDropdown = action === 'request_revision' || action === 'request_changes';

  return {
    showFeedbackActions,
    showRequestChangeButton,
    showChangeRequestForm,
    showApproveButton,
    showAdminClientFeedbackActions,
    showReasonsDropdown
  };
}


export default function V4PhotoSubmission({ submission, campaign, onUpdate }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);

  const [loading, setLoading] = useState(false);
  const [postingApprovalLoading, setPostingApprovalLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [localActionInProgress, setLocalActionInProgress] = useState(false);
  const [reasons, setReasons] = useState(() => {
    if (isClientFeedback && submission.feedback && submission.feedback.length > 0) {
      // Find the most recent REQUEST type feedback from client
      const clientRequestFeedbacks = submission.feedback.filter(fb => 
        fb.admin?.role === 'client' && fb.type === 'REQUEST'
      );
      const latestClientFeedback = clientRequestFeedbacks[0];
      return latestClientFeedback?.reasons || [];
    }
    return [];
  });

  // Feedback
  const getDefaultFeedback = () => {
    if (isClientFeedback) {
      // Get the most recent REQUEST type feedback for initialization
      const requestFeedbacks = submission.feedback?.filter(fb => fb.type === 'REQUEST') || [];
      const latestRequestFeedback = requestFeedbacks[0];
      return latestRequestFeedback?.content || submission.photos?.[0]?.feedback || '';
    }
    return '';
  };
  const [feedback, setFeedback] = useState(getDefaultFeedback());
  const [previousFeedback, setPreviousFeedback] = useState(getDefaultFeedback());
  // Caption editing
  const [caption, setCaption] = useState(submission.caption || '');
  
  // Photo Modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Caption overflow detection
  const [captionOverflows, setCaptionOverflows] = useState(false);
  const captionMeasureRef = useRef(null);

  // Detect client role
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  // Determine if client can see the actual content vs just placeholder
  const clientVisible = !isClient || ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);

  const submissionProps = useMemo(() => {
    const photos = submission.photos || [];
    const pendingReview = ['PENDING_REVIEW'].includes(submission.status);
    const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
    const hasPostingLink = Boolean(submission.content);
    const hasPendingPostingLink = hasPostingLink && submission.status !== 'POSTED';
    
    // Debug logging for admin photo display
    console.log('🖼️ Admin Photo Debug:', {
      submissionId: submission.id,
      submissionStatus: submission.status,
      totalPhotosInSubmission: photos.length,
      photoIds: photos.map(p => p.id),
      photoUrls: photos.map(p => p.url),
      fullSubmissionData: submission
    });
    
    return {
      photos,
      pendingReview,
      isApproved,
      hasPostingLink,
      hasPendingPostingLink
    };
  }, [submission.photos, submission.status, submission.content, submission.id]);
  
  const { photos, pendingReview, isApproved, hasPostingLink, hasPendingPostingLink } = submissionProps;

  const handleApprove = useCallback(async () => {
    try {
      console.log('🚀 Starting handleApprove:', {
        isClient,
        submissionId: submission.id,
        currentStatus: submission.status,
        campaignOrigin: campaign?.origin,
        action: 'approve'
      });
      setLoading(true);
      setLocalActionInProgress(true);
      
      // Mark that this user is performing an action - will block ALL socket updates for this user
      
      if (isClient) {
        // Client-specific endpoint
        await axiosInstance.post('/api/submissions/v4/approve/client', {
          submissionId: submission.id,
          action: 'approve',
          feedback: feedback.trim(),
          reasons: reasons || []
        });

        enqueueSnackbar('Photos approved successfully', { variant: 'success' });
      } else {
        // Admin endpoint
        const result = await approveV4Submission({
          submissionId: submission.id,
          action: 'approve',
          feedback: feedback.trim() || undefined,
          reasons: reasons || [],
          caption: caption.trim() || undefined,
        });

        console.log('✅ Admin approve API response:', result);
        enqueueSnackbar('Photos approved successfully', { variant: 'success' });
      }
      setFeedback('');
      setReasons([]);
      setAction('approve');
      
      // Add delay to ensure backend has committed changes before fetching
      console.log('⏳ Waiting before onUpdate to ensure backend commit...');
      setTimeout(() => {
        console.log('📞 Calling onUpdate from handleApprove');
        onUpdate?.(true); // Pass true to force cache refresh if supported
        
        // Re-enable socket updates after local action completes (longer delay for safety)
        setTimeout(() => {
          console.log('🔓 Re-enabling socket updates');
          setLocalActionInProgress(false);
          
          // Socket updates will be re-enabled automatically via the flag
        }, 500);
      }, 200);
    } catch (error) {
      console.error('Error approving photos:', error);
      enqueueSnackbar(error.message || 'Failed to approve photos', { variant: 'error' });
    } finally {
      setLoading(false);
      // Also reset flag on error
      if (localActionInProgress) {
        setTimeout(() => setLocalActionInProgress(false), 300);
      }
    }
  }, [feedback, reasons, caption, submission.id, onUpdate, isClient]);

  const handleRequestChanges = useCallback(async () => {
    // Capture current values immediately to avoid race conditions with socket updates
    const currentFeedback = feedback;
    const currentReasons = reasons;
    
    try {
      setLoading(true);
      setLocalActionInProgress(true);
      
      // Mark that this user is performing an action - will block ALL socket updates for this user
      
      // Ensure we have either feedback content or reasons
      const hasContent = currentFeedback.trim();
      const hasReasons = currentReasons && currentReasons.length > 0;
      
      if (!hasContent && !hasReasons) {
        enqueueSnackbar('Please provide feedback or select reasons for changes', { variant: 'warning' });
        setLoading(false);
        return;
      }
      
      if (isClient) {
        // Client-specific endpoint
        await axiosInstance.post('/api/submissions/v4/approve/client', {
          submissionId: submission.id,
          action: 'request_changes',
          feedback: hasContent ? currentFeedback.trim() : '',
          reasons: currentReasons || []
        });

        enqueueSnackbar('Changes requested successfully', { variant: 'success' });
      } else {
        // Admin endpoint
        await approveV4Submission({
          submissionId: submission.id,
          action: 'request_revision',
          feedback: hasContent ? currentFeedback.trim() : '',
          reasons: currentReasons || [],
          caption: caption.trim() || undefined,
        });

        enqueueSnackbar('Changes requested successfully', { variant: 'success' });
      }
      setFeedback('');
      setReasons([]);
      setAction('approve');
      
      // Add delay to ensure backend has committed changes before fetching
      setTimeout(() => {
        onUpdate?.(true); // Pass true to force cache refresh if supported
        
        // Re-enable socket updates after local action completes (longer delay for safety)
        setTimeout(() => {
          setLocalActionInProgress(false);
        }, 500);
      }, 200);
    } catch (error) {
      console.error('Error requesting changes:', error);
      enqueueSnackbar(error.message || 'Failed to request changes', { variant: 'error' });
    } finally {
      setLoading(false);
      // Also reset flag on error
      if (localActionInProgress) {
        setTimeout(() => setLocalActionInProgress(false), 300);
      }
    }
  }, [feedback, reasons, caption, submission.id, onUpdate, isClient]);
  
  // Photo modal handler
  const handlePhotoClick = useCallback((index) => {
    setCurrentPhotoIndex(index);
    setPhotoModalOpen(true);
  }, []);

  // Socket listener for real-time submission updates
  useEffect(() => {
    if (!socket || !campaign?.id) return;

    const handleSubmissionUpdate = (data) => {
      // Only update if this is our submission
      if (data.submissionId === submission.id) {
        console.log('🔄 Socket event received:', {
          action: data.action,
          submissionId: data.submissionId,
          loading,
          postingApprovalLoading,
          currentStatus: submission.status,
          byClient: data.byClient,
          localActionInProgress,
          socketUserId: data.userId,
          currentUserId: user?.id
        });
        
        // Strong protection: block if local action in progress OR if this user triggered the event
        const isOwnAction = data.userId === user?.id;
        const shouldBlock = localActionInProgress || isOwnAction;
        
        if (shouldBlock) {
          console.log('🚫 Blocked socket update:', {
            reason: localActionInProgress ? 'local action in progress' : 'own action',
            isOwnAction,
            localActionInProgress
          });
        } else {
          console.log('✅ Calling onUpdate from socket (delayed to avoid race conditions)');
          // Add small delay to ensure any concurrent local updates complete first
          setTimeout(() => {
            onUpdate?.(true); // Force cache refresh
          }, 100);
        }
        
        // Show notification based on the action
        const actionMessages = {
          'approve': 'Submission approved',
          'reject': 'Submission rejected', 
          'request_revision': 'Changes requested',
          'posting_link_approve': 'Posting link approved',
          'posting_link_reject': 'Posting link rejected'
        };
        
        const message = actionMessages[data.action] || 'Submission updated';
        if (data.byClient) {
          enqueueSnackbar(`${message} by client`, { variant: 'info' });
        } else {
          enqueueSnackbar(message, { variant: 'info' });
        }
      }
    };

    const handleContentSubmitted = (data) => {
      // Only update if this is our submission
      if (data.submissionId === submission.id && data.hasPhotos) {
        onUpdate?.();
        enqueueSnackbar('New photos submitted', { variant: 'info' });
      }
    };

    const handlePostingUpdated = (data) => {
      // Only update if this is our submission
      if (data.submissionId === submission.id) {
        console.log('📎 Posting link updated via socket:', {
          submissionId: data.submissionId,
          postingLink: data.postingLink,
          updatedAt: data.updatedAt
        });
        
        // Don't trigger update if this user is performing an action
        if (!localActionInProgress) {
          console.log('✅ Calling onUpdate from posting link socket event');
          setTimeout(() => {
            onUpdate?.(true); // Force cache refresh
          }, 100);
          enqueueSnackbar('Posting link updated', { variant: 'info' });
        } else {
          console.log('🚫 Blocked posting link socket update - local action in progress');
        }
      }
    };

    // Join campaign room for real-time updates
    socket.emit('join-campaign', campaign.id);

    // Listen to socket events
    socket.on('v4:submission:updated', handleSubmissionUpdate);
    socket.on('v4:content:submitted', handleContentSubmitted);
    socket.on('v4:posting:updated', handlePostingUpdated);

    // Cleanup
    return () => {
      socket.off('v4:submission:updated', handleSubmissionUpdate);
      socket.off('v4:content:submitted', handleContentSubmitted);
      socket.off('v4:posting:updated', handlePostingUpdated);
      socket.emit('leave-campaign', campaign.id);
    };
  }, [socket, submission?.id, campaign?.id, onUpdate, localActionInProgress, user?.id]);

  // Check if caption overflows the height limits
  useEffect(() => {
    if (captionMeasureRef.current && submission.caption) {
      const element = captionMeasureRef.current;
      const maxHeight = window.innerWidth < 600 ? 50 : window.innerWidth < 900 ? 80 : 100;
      setCaptionOverflows(element.scrollHeight > maxHeight);
    }
  }, [submission.caption]);

  return (
      <Box sx={{ 
        overflow: 'hidden',
        bgcolor: 'background.neutral'
      }}>
        {/* Photo Content */}
        <Box>
          {clientVisible ? (
            // Show actual content to admins or when sent to client
            photos.length > 0 ? (
              <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
                {/* Horizontal Layout: Caption on Left, Photos on Right */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  minHeight: { xs: 400, sm: 450, md: 500 },
                  flexDirection: { xs: 'column', md: 'row' }
                }}>
                  {/* Left Side */}
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    maxWidth: { xs: '100%', md: 400, lg: 600 },
                    minWidth: { xs: '100%', md: 350 },
                  }}>
                    {/* Caption */}
                    <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant='caption' fontWeight={'bold'} color={'#636366'} mb={0.5}>Caption</Typography>
                      {pendingReview ? (
                        <Box>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Enter caption here..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper',
                              },
                            }}
                          />
                        </Box>
                      ) : submission.caption ? (
                        <>
                          {/* Hidden element to measure caption height */}
                          <Box
                            ref={captionMeasureRef}
                            sx={{
                              visibility: 'hidden',
                              position: 'absolute',
                              width: '100%',
                              maxWidth: 400,
                              pointerEvents: 'none'
                            }}
                          >
                            <Typography fontSize={14} sx={{ 
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              lineHeight: 1.5
                            }}>
                              {submission.caption}
                            </Typography>
                          </Box>
                          
                          {/* Conditional rendering based on overflow */}
                          {captionOverflows ? (
                            <Box sx={{ 
                              maxHeight: { xs: 50, sm: 80, md: 100 },
                              overflow: 'auto',
                              border: '1px solid #E7E7E7',
                              borderRadius: 0.5,
                              p: 1,
                              bgcolor: 'background.paper',
                            }}>
                              <Typography fontSize={14} color={'#636366'} sx={{ 
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                lineHeight: 1.5
                              }}>
                                {submission.caption}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography fontSize={14} color={'#636366'} sx={{ 
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              lineHeight: 1.5
                            }}>
                              {submission.caption}
                            </Typography>
                          )}
                        </>
                      ) : null}
                    </Box>

                    {/* Feedback/Posting Link Section */}
                    <Box sx={{ flex: 'auto 0 1', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      {/* Show Posting Link Section for CLIENT_APPROVED or POSTED submissions in normal campaigns */}
                      {!isClient && (submission.status === 'CLIENT_APPROVED' || submission.status === 'POSTED' || submission.status === 'REJECTED') && campaign?.campaignType === 'normal' ? (
                        <PostingLinkSection 
                          submission={submission}
                          campaign={campaign}
                          onUpdate={onUpdate}
                          isClient={isClient}
                        />
                      ) : (
                        <FeedbackSection 
                          submission={submission}
                          isVisible={submission.status !== 'PENDING_REVIEW'}
                          isClient={isClient}
                        />
                      )}
                    </Box>


                    {/* Feedback Actions - Visibility controlled by user role and submission status */}
                    {(() => {
                      // Don't show feedback actions when displaying posting link section
                      if ((submission.status === 'CLIENT_APPROVED' || submission.status === 'POSTED') && campaign?.campaignType === 'normal') {
                        return null;
                      }

                      const visibility = getFeedbackActionsVisibility({
                        isClient,
                        submission,
                        clientVisible,
                        isClientFeedback,
                        action
                      });

                      if (!visibility.showFeedbackActions) return null;

                      return (
                      <Box sx={{ flex: '0 0 auto' }}>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} width="100%" justifyContent="flex-end">
                            {/* Request Change Button - Visible to both admins and clients when content is visible */}
                            {visibility.showRequestChangeButton && (
                              <Button
                                variant="contained"
                                color="warning"
                                size='small'
                                onClick={() => {
                                  setPreviousFeedback(feedback);
                                  setAction('request_revision');
                                }}
                                disabled={loading}
                                sx={{
                                  ...BUTTON_STYLES.base,
                                  ...BUTTON_STYLES.warning,
                                }}
                              >
                                {loading ? 'Processing...' : 'Request a Change'}
                              </Button>
                            )}
                            {/* Change Request Form - Visible when user is in request mode */}
                            {visibility.showChangeRequestForm && (
                              <Box display="flex" flexDirection="row" width="100%" gap={1} justifyContent="flex-end">
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  size='small'
                                  onClick={() => {
                                    setAction('approve');
                                    setReasons([]);
                                  }}
                                  disabled={loading}
                                  sx={{
                                    ...BUTTON_STYLES.base,
                                    ...BUTTON_STYLES.secondary,
                                  }}
                                >
                                  Cancel Change Request
                                </Button>
                                <Button
                                  variant="contained"
                                  color={'warning'}
                                  size='small'
                                  onClick={handleRequestChanges}
                                  disabled={loading}
                                  sx={{
                                    ...BUTTON_STYLES.base,
                                    ...BUTTON_STYLES.warning,
                                  }}
                                >
                                  {loading ? 'Processing...' : !isClient ? 'Send to Creator' : 'Request a Change'}
                                </Button>
                              </Box>
                            )}

                            {/* Approve Button - Visible when not in client feedback and not in request mode */}
                            {visibility.showApproveButton && (
                              <Button
                                variant="contained"
                                color="success"
                                size='small'
                                onClick={handleApprove}
                                disabled={loading}
                                sx={{
                                  ...BUTTON_STYLES.base,
                                  ...BUTTON_STYLES.success,
                                }}
                              >
                                {loading ? 'Processing...' : !isClient ? 'Send to Client' : 'Approve'}
                              </Button>
                            )}

                            {/* Admin-only Client Feedback Actions - Only admins see this for client feedback */}
                            {visibility.showAdminClientFeedbackActions && (
                              <Button
                                variant="contained"
                                color="secondary"
                                size='small'
                                onClick={handleRequestChanges}
                                disabled={loading}
                                sx={{
                                  ...BUTTON_STYLES.base,
                                  ...BUTTON_STYLES.warning,
                                  width: 140,
                                  alignSelf: 'flex-end'
                                }}
                              >
                                {loading ? 'Processing...' : 'Send to Creator'}
                              </Button>
                            )}
                          </Stack>

                          {/* Reasons Dropdown - Visible when requesting changes */}
                          {visibility.showReasonsDropdown && (
                            <FormControl fullWidth style={{ backgroundColor: '#fff', borderRadius: 10 }} hiddenLabel size='small'>
                              <Select
                                multiple
                                value={reasons}
                                onChange={(e) => setReasons(e.target.value)}
                                displayEmpty
                                renderValue={(selected) => {
                                  if (selected.length === 0) {
                                    return <span style={{ color: '#999' }}>Change Request Reasons</span>;
                                  }
                                  return (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 35 }}>
                                      {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                      ))}
                                    </Box>
                                  );
                                }}
                              >
                                {options_changes.map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}

                          {/* Feedback Label - Shows who provided the feedback */}
                          {(() => {
                            // Filter feedback based on user role
                            const filteredFeedback = submission.feedback?.filter(feedback => {
                              if (isClient) {
                                // Clients should only see COMMENT type feedback
                                return feedback.type === 'COMMENT';
                              } else {
                                // Admins should see:
                                // - REQUEST type feedback (when admin/client requests changes)
                                // - COMMENT type feedback when status is SENT_TO_CLIENT (to see what they sent to client)
                                if (submission.status === 'SENT_TO_CLIENT') {
                                  return feedback.type === 'COMMENT';
                                }
                                return feedback.type === 'REQUEST';
                              }
                            }) || [];
                            
                            const latestRelevantFeedback = filteredFeedback[0];
                            
                            // Always show feedback label if there is relevant feedback, even if empty
                            // This ensures consistent display so users know the latest action
                            if (!latestRelevantFeedback) {
                              return null;
                            }
                            
                            return (
                              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant='caption' fontWeight="bold" color={'#636366'}>
                                  {!isClient && latestRelevantFeedback.type === 'REQUEST' && latestRelevantFeedback.admin?.role === 'client' && 'Client Feedback'}
                                </Typography>
                              </Box>
                            );
                          })()}

                          {/* Feedback Message Box - Available to all users when actions are visible */}
                          <TextField
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="Insert optional comments here"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper',
                              },
                            }}
                            size='small'
                          />
                        </Stack>
                      </Box>
                      );
                    })()}
                  </Box>

                  {/* Photo Container - Right Side */}
                  <Box 
                    sx={{ 
                      width: { xs: '100%', sm: 400, md: 500, lg: 580 },
                      height: { xs: 300, sm: 400, md: 450, lg: 500 },
                      display: 'flex', 
                      flexDirection: 'column',
                      bgcolor: 'background.paper',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Photo Grid Display Area */}
                    <Box 
                      sx={{ 
                        display: 'flex',
                        gap: { xs: 1, sm: 1.5, md: 2 },
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        bgcolor: 'background.neutral',
                        height: '100%',
                        alignItems: 'stretch',
                        '&::-webkit-scrollbar': {
                          height: 2,
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)',
                          },
                        },
                      }}
                    >
                      {photos.map((photo, photoIndex) => {
                        // Calculate responsive width based on container size
                        const getPhotoWidth = () => {
                          // Base width that adapts to container
                          return { xs: 160, sm: 180, md: 220, lg: 240 };
                        };
                        
                        const getPhotoHeight = () => {
                          // Calculate height to fill container minus padding and scrollbar
                          return 'calc(100% - 8px)';
                        };
                        
                        return (
                        <Box
                          key={photo.id}
                          sx={{
                            flexShrink: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              cursor: 'pointer',
                              width: getPhotoWidth(),
                              height: getPhotoHeight(),
                              minHeight: { xs: 350, sm: 400, md: 450, lg: 480 },
                              '&:hover .overlay': {
                                opacity: 1,
                              },
                            }}
                            onClick={() => handlePhotoClick(photoIndex)}
                          >
                            <Box
                              component="img"
                              src={photo.url}
                              alt={`Photo ${photoIndex + 1}`}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 12,
                                right: { xs: 6, sm: 7, md: 8 },
                                width: { xs: 18, sm: 20, md: 21 },
                                height: { xs: 26, sm: 28, md: 31 },
                                backgroundColor: 'white',
                                color: 'black',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: { xs: 10, sm: 11, md: 12 },
                                fontWeight: 'bold',
                                zIndex: 10,
                                border: '1px solid #EBEBEB',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                p: { xs: 0.5, sm: 0.75, md: 1 }
                              }}
                            >
                              {photoIndex + 1}
                            </Box>
                            <Box
                              className="overlay"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgcolor: 'rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s ease',
                                borderRadius: 1,
                              }}
                            >
                              <Iconify
                                icon="eva:expand-fill"
                                sx={{
                                  color: 'white',
                                  width: { xs: 28, sm: 32, md: 36, lg: 40 },
                                  height: { xs: 28, sm: 32, md: 36, lg: 40 },
                                  opacity: 0.9,
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" sx={{p: 8, justifyContent: 'center' }}>
                <Box component="img" src="/assets/icons/empty/ic_content.svg" alt="No content" sx={{ width: 150, height: 150, mb: 3, opacity: 0.6 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No deliverables found
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={4}>
                  This submission doesn't have any deliverables to review yet.
                </Typography>
              </Box>
            )
          ) : (
            // Show placeholder for clients when content is being processed
            <Card sx={{ p: 3, bgcolor: 'background.neutral', textAlign: 'center' }}>
              <Stack spacing={2} alignItems="center">
                <Iconify icon="eva:image-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                <Typography variant="body2" color="text.secondary">
                  Photo content is being processed.
                </Typography>
                <Chip
                  label="In Progress"
                  color="info"
                  size="small"
                />
              </Stack>
            </Card>
          )}
        </Box>
        
        {/* Photo Modal */}
        {photos.length > 0 && (
          <PhotoModal
            open={photoModalOpen}
            onClose={() => setPhotoModalOpen(false)}
            photos={photos}
            currentIndex={currentPhotoIndex}
            setCurrentIndex={setCurrentPhotoIndex}
            creator={submission.user}
          />
        )}
      </Box>
    );
};

V4PhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  index: PropTypes.number,
  onUpdate: PropTypes.func
};