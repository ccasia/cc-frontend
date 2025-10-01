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
  Tooltip,
  IconButton
} from '@mui/material';

import axiosInstance from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';
import { VideoModal } from '../../creator-stuff/submissions/firstDraft/media-modals';

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
};

function FeedbackDisplay({ feedback, submission, isClient }) {
  if (!feedback) return null;

  // Check if feedback has any content or reasons
  const hasReasons = feedback.reasons && feedback.reasons.length > 0;
  const hasContent = feedback.content && feedback.content.trim().length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}>
      {(!isClient && (hasContent || hasReasons) && submission.status === 'CHANGES_REQUIRED') && <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={1}>CS Feedback</Typography>}
      {(!isClient && hasContent && submission.status === 'SENT_TO_CLIENT') && <Typography variant='caption' fontWeight="bold" color={'#636366'} mb={1}>CS Comments</Typography>}
      {hasReasons && submission.status !== 'CLIENT_FEEDBACK' && (
        <Box>
          {feedback.reasons.map((reason, reasonIndex) => (
            <Chip 
              sx={{...FEEDBACK_CHIP_STYLES, mb: 0.5, }}
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
      {hasContent && submission.status !== 'CLIENT_FEEDBACK' && (
        <Typography fontSize={12} sx={{ mb: 0.5 }}>
          {feedback.content}
        </Typography>
      )}
    </Box>
  );
}

FeedbackDisplay.propTypes = {
  feedback: PropTypes.object,
  isClient: PropTypes.bool.isRequired,
};

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

FeedbackSection.propTypes = {
  submission: PropTypes.object.isRequired,
  isVisible: PropTypes.bool.isRequired,
  isClient: PropTypes.bool.isRequired,
};

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


export default function V4RawFootageSubmission({ submission, campaign, onUpdate }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);

  const [loading, setLoading] = useState(false);
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
      return latestRequestFeedback?.content || submission.rawFootages?.[0]?.feedback || '';
    }
    return '';
  };
  const [feedback, setFeedback] = useState(getDefaultFeedback());
  // Caption editing
  const [caption, setCaption] = useState(submission.caption || '');
  
  // Video Modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Caption overflow detection
  const [captionOverflows, setCaptionOverflows] = useState(false);
  const captionMeasureRef = useRef(null);
  
  // Video dimensions state for responsive sizing
  const [videoDimensions, setVideoDimensions] = useState({});
  
  // Video control states for each raw footage
  const [videoStates, setVideoStates] = useState({});
  const videoRefs = useRef({});
  
  // Video control helper functions
  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);
  
  const togglePlay = useCallback((footageId) => {
    const videoRef = videoRefs.current[footageId];
    if (videoRef) {
      const currentState = videoStates[footageId];
      if (currentState?.isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setVideoStates(prev => ({
        ...prev,
        [footageId]: {
          ...prev[footageId],
          isPlaying: !currentState?.isPlaying
        }
      }));
    }
  }, [videoStates]);
  
  const handleSeek = useCallback((event, footageId) => {
    const videoRef = videoRefs.current[footageId];
    if (videoRef) {
      const rect = event.currentTarget.getBoundingClientRect();
      const pos = (event.clientX - rect.left) / rect.width;
      const newTime = pos * (videoStates[footageId]?.duration || 0);
      videoRef.currentTime = newTime;
      setVideoStates(prev => ({
        ...prev,
        [footageId]: {
          ...prev[footageId],
          currentTime: newTime
        }
      }));
    }
  }, [videoStates]);
  
  const handleTimeUpdate = useCallback((footageId) => {
    const videoRef = videoRefs.current[footageId];
    if (videoRef) {
      setVideoStates(prev => ({
        ...prev,
        [footageId]: {
          ...prev[footageId],
          currentTime: videoRef.currentTime
        }
      }));
    }
  }, []);
  
  const handleVideoMetadataLoaded = useCallback((footageId, videoElement) => {
    if (videoElement) {
      const { videoWidth, videoHeight, duration } = videoElement;
      const aspectRatio = videoWidth / videoHeight;
      
      setVideoDimensions(prev => ({
        ...prev,
        [footageId]: { width: videoWidth, height: videoHeight, aspectRatio }
      }));
      
      setVideoStates(prev => ({
        ...prev,
        [footageId]: {
          ...prev[footageId],
          duration,
          currentTime: 0,
          isPlaying: false
        }
      }));
    }
  }, []);
  
  // Detect client role
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  // Determine if client can see the actual content vs just placeholder
  const clientVisible = !isClient || ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);

  const submissionProps = useMemo(() => {
    const rawFootages = submission.rawFootages || [];
    const pendingReview = ['PENDING_REVIEW'].includes(submission.status);
    
    return {
      rawFootages,
      pendingReview
    };
  }, [submission.rawFootages, submission.status]);
  
  const { rawFootages, pendingReview } = submissionProps;

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

        enqueueSnackbar('Raw footage approved successfully', { variant: 'success' });
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
        enqueueSnackbar('Raw footage approved successfully', { variant: 'success' });
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
      console.error('Error approving raw footage:', error);
      enqueueSnackbar(error.message || 'Failed to approve raw footage', { variant: 'error' });
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

  
  // Video modal handler
  const handleVideoClick = useCallback((index) => {
    setCurrentVideoIndex(index);
    setVideoModalOpen(true);
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
      if (data.submissionId === submission.id && data.hasRawFootage) {
        onUpdate?.(undefined, { revalidate: true });
        enqueueSnackbar('New raw footage submitted', { variant: 'info' });
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

    const handleContentProcessed = (data) => {
      // Only update if this is our submission
      if (data.submissionId === submission.id && data.hasRawFootage) {
        onUpdate?.(undefined, { revalidate: true });
        enqueueSnackbar('Raw footage is now ready for review', { variant: 'success' });
      }
    };

    // Join campaign room for real-time updates
    socket.emit('join-campaign', campaign.id);

    // Listen to socket events
    socket.on('v4:submission:updated', handleSubmissionUpdate);
    socket.on('v4:content:submitted', handleContentSubmitted);
    socket.on('v4:content:processed', handleContentProcessed);
    socket.on('v4:posting:updated', handlePostingUpdated);

    // Cleanup
    return () => {
      socket.off('v4:submission:updated', handleSubmissionUpdate);
      socket.off('v4:content:submitted', handleContentSubmitted);
      socket.off('v4:content:processed', handleContentProcessed);
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
        {/* Raw Footage Content */}
        <Box>
          {clientVisible ? (
            // Show actual content to admins or when sent to client
            rawFootages.length > 0 ? (
              <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
                {/* Horizontal Layout: Caption on Left, Raw Footage on Right */}
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
                    
                    {/* Feedback Section */}
                    <Box sx={{ flex: 'auto 0 1', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      <FeedbackSection 
                        submission={submission}
                        isVisible={submission.status !== 'PENDING_REVIEW'}
                        isClient={isClient}
                      />
                    </Box>


                    {/* Feedback Actions - Visibility controlled by user role and submission status */}
                    {(() => {
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
                              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                {/* Display chips for latest client feedback reasons */}
                                {(() => {
                                  if (submission.status === 'CLIENT_FEEDBACK' && submission.feedback && submission.feedback.length > 0) {
                                    const clientRequestFeedbacks = submission.feedback.filter(fb => 
                                      fb.admin?.role === 'client' && fb.type === 'REQUEST'
                                    );
                                    const latestClientFeedback = clientRequestFeedbacks[0];
                                    
                                    if (latestClientFeedback?.reasons && latestClientFeedback.reasons.length > 0) {
                                      const reasons = latestClientFeedback.reasons;
                                      const hasMultipleReasons = reasons.length > 1;
                                      
                                      return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          {/* First reason chip */}
                                          <Chip 
                                            sx={FEEDBACK_CHIP_STYLES}
                                            label={reasons[0]} 
                                            size="small" 
                                            variant="outlined" 
                                            color="warning" 
                                          />
                                          
                                          {/* Plus sign with tooltip for additional reasons */}
                                          {hasMultipleReasons && (
                                            <Tooltip 
                                              title={
                                                <Box sx={{ maxWidth: 500 }}>
                                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {reasons.slice(1).map((reason, index) => (
                                                      <Chip 
                                                        key={index}
                                                        sx={FEEDBACK_CHIP_STYLES}
                                                        label={reason} 
                                                        size="small" 
                                                        variant="outlined" 
                                                        color="warning" 
                                                      />
                                                    ))}
                                                  </Box>
                                                </Box>
                                              }
                                              placement="top"
                                              PopperProps={{
                                                modifiers: [
                                                  {
                                                    name: 'offset',
                                                    options: {
                                                      offset: [0, 0],
                                                    },
                                                  },
                                                ],
                                              }}
                                              slotProps={{
                                                tooltip: {
                                                  sx: {
                                                    bgcolor: '#f8f9fa',
                                                    color: '#333',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 1.5,
                                                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.20)',
                                                    p: 1,
                                                    maxWidth: 400,
                                                    fontSize: 12
                                                  }
                                                },
                                              }}
                                            >
                                              <Chip 
                                                sx={{
                                                  ...FEEDBACK_CHIP_STYLES,
                                                  minWidth: 28,
                                                  height: 28,
                                                  cursor: 'pointer',
                                                  '& .MuiChip-label': {
                                                    px: 0.5,
                                                    fontSize: 14,
                                                    fontWeight: 'bold'
                                                  }
                                                }}
                                                label={`+${reasons.length - 1}`}
                                                size="small" 
                                                variant="outlined" 
                                                color="warning" 
                                              />
                                            </Tooltip>
                                          )}
                                        </Box>
                                      );
                                    }
                                  }
                                  return <Box />; // Empty box to maintain layout when no chips
                                })()}
                                
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
                                  }}
                                >
                                  {loading ? 'Processing...' : 'Send to Creator'}
                                </Button>
                              </Box>
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

                  {/* Raw Footage Container - Right Side */}
                  <Box 
                    sx={{ 
                      width: { xs: '100%', sm: 400, md: 500, lg: 580 },

                      display: 'flex', 
                      flexDirection: 'column',
                      bgcolor: 'background.paper',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Raw Footage Grid Display Area */}
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
                      {rawFootages.map((rawFootage, footageIndex) => {
                        // Calculate responsive width for raw footage items
                        const getFootageWidth = () => {
                          // Keep video dimensions but make them responsive  
                          return { xs: 160, sm: 180, md: 200, lg: 240 };
                        };
                        
                        const getFootageHeight = () => {
                          // Calculate height to fill container minus padding and scrollbar
                          return 'calc(100% - 8px)';
                        };
                        
                        return (
                        <Box
                          key={rawFootage.id}
                          sx={{
                            flexShrink: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {rawFootage.url ? (
                            <Box
                              sx={{
                                position: 'relative',
                                cursor: 'pointer',
                                width: getFootageWidth(),
                                height: getFootageHeight(),
                                '&:hover .overlay': {
                                  opacity: 1,
                                },
                              }}
                              onClick={() => handleVideoClick(footageIndex)}
                            >
                              <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ flex: 1, position: 'relative' }}>
                                  <video
                                    ref={(el) => {
                                      if (el) videoRefs.current[rawFootage.id] = el;
                                    }}
                                    style={{ 
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                    src={rawFootage.url}
                                    onLoadedMetadata={(e) => handleVideoMetadataLoaded(rawFootage.id, e.target)}
                                    onTimeUpdate={() => handleTimeUpdate(rawFootage.id)}
                                    onPlay={() => setVideoStates(prev => ({
                                      ...prev,
                                      [rawFootage.id]: { ...prev[rawFootage.id], isPlaying: true }
                                    }))}
                                    onPause={() => setVideoStates(prev => ({
                                      ...prev,
                                      [rawFootage.id]: { ...prev[rawFootage.id], isPlaying: false }
                                    }))}
                                  >
                                    <track kind="captions" srcLang="en" label="English" />
                                  </video>
                                </Box>

                                {/* Custom Controls Bar */}
                                <Box 
                                  sx={{ 
                                    width: '100%',
                                    height: 32,
                                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1,
                                    py: 0.5,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Play/Pause Button */}
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePlay(rawFootage.id);
                                    }}
                                    sx={{ 
                                      color: 'white',
                                      bgcolor: 'rgba(255,255,255,0.1)',
                                      border: '1px solid rgba(255,255,255,0.2)',
                                      minWidth: 20,
                                      minHeight: 20,
                                      p: 0.3,
                                      mr: 0.5,
                                      '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.2)'
                                      }
                                    }}
                                  >
                                    {videoStates[rawFootage.id]?.isPlaying ? (
                                      <Box sx={{ 
                                        width: 6, 
                                        height: 7, 
                                        display: 'flex', 
                                        gap: 0.3
                                      }}>
                                        <Box sx={{ 
                                          width: 2.5, 
                                          height: '100%', 
                                          bgcolor: 'white' 
                                        }} />
                                        <Box sx={{ 
                                          width: 2.5, 
                                          height: '100%', 
                                          bgcolor: 'white' 
                                        }} />
                                      </Box>
                                    ) : (
                                      <Box sx={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: '6px solid white',
                                        borderTop: '4px solid transparent',
                                        borderBottom: '4px solid transparent',
                                        ml: 0.2
                                      }} />
                                    )}
                                  </IconButton>

                                  {/* Current Time */}
                                  <Typography variant={'caption'} sx={{ color: 'white', minWidth: '30px', fontSize: 10 }}>
                                    {formatTime(videoStates[rawFootage.id]?.currentTime || 0)}
                                  </Typography>

                                  {/* Progress Bar */}
                                  <Box 
                                    sx={{ 
                                      flex: 1, 
                                      height: 4, 
                                      bgcolor: 'rgba(255,255,255,0.3)', 
                                      borderRadius: 2,
                                      cursor: 'pointer',
                                      mx: 0.5,
                                      '&:hover': {
                                        height: 5
                                      },
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSeek(e, rawFootage.id);
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: `${videoStates[rawFootage.id]?.duration > 0 ? (videoStates[rawFootage.id]?.currentTime / videoStates[rawFootage.id]?.duration) * 100 : 0}%`,
                                        height: '100%',
                                        bgcolor: 'primary.main',
                                        borderRadius: 2,
                                        transition: 'width 0.1s ease'
                                      }}
                                    />
                                  </Box>

                                  {/* Duration */}
                                  <Typography variant={'caption'} sx={{ color: 'white', minWidth: '30px', fontSize: 10 }}>
                                    {formatTime(videoStates[rawFootage.id]?.duration || 0)}
                                  </Typography>

                                  {/* Fullscreen Button */}
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVideoClick(footageIndex);
                                    }}
                                    sx={{ 
                                      color: 'white',
                                      p: 0.3,
                                      ml: 0.5,
                                      '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.1)'
                                      },
                                    }}
                                  >
                                    <Iconify 
                                      icon="eva:expand-fill" 
                                      sx={{ 
                                        fontSize: 14 
                                      }} 
                                    />
                                  </IconButton>
                                </Box>
                              </Box>
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
                                {footageIndex + 1}
                              </Box>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: getFootageWidth(),
                                height: getFootageHeight(),
                                minHeight: { xs: 250, sm: 300, md: 350, lg: 390 },
                                bgcolor: 'background.neutral',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Stack spacing={2} alignItems="center">
                                <Iconify icon="eva:film-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                                <Typography color="text.secondary">No raw footage uploaded yet</Typography>
                              </Stack>
                            </Box>
                          )}
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
                <Iconify icon="eva:film-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                <Typography variant="body2" color="text.secondary">
                  Raw footage content is being processed.
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
        
        {/* Video Modal */}
        {rawFootages.length > 0 && (
          <VideoModal
            open={videoModalOpen}
            onClose={() => setVideoModalOpen(false)}
            videos={rawFootages}
            currentIndex={currentVideoIndex}
            setCurrentIndex={setCurrentVideoIndex}
            creator={submission.user}
            submission={submission}
            showCaption={false}
            title="Raw Footage"
          />
        )}

      </Box>
    );
};

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  onUpdate: PropTypes.func
};