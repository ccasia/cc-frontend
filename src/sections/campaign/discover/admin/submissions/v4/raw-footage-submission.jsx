import { useState, useCallback, useMemo, useEffect } from 'react';
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


export default function V4RawFootageSubmission({ submission, campaign, onUpdate }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);

  const [loading, setLoading] = useState(false);
  const [postingApprovalLoading, setPostingApprovalLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [localActionInProgress, setLocalActionInProgress] = useState(false);
  const [reasons, setReasons] = useState(() => {
    if (isClientFeedback && submission.feedback && submission.feedback.length > 0) {
      // Find the most recent client feedback and use its reasons
      const clientFeedbacks = submission.feedback.filter(fb => fb.admin?.role === 'client');
      const latestClientFeedback = clientFeedbacks[0];
      return latestClientFeedback?.reasons || [];
    }
    return [];
  });

  // Feedback
  const getDefaultFeedback = () => {
    if (isClientFeedback) {
      return submission.rawFootages?.[0]?.feedback || '';
    }
    if (submission.status === 'PENDING_REVIEW') {
      return 'This creator has submitted raw footage for your review. Please approve or request changes with comments below.';
    }
    if (submission.status === 'SENT_TO_CLIENT') {
      return 'Great work! Thanks for the submission.';
    }
    return '';
  };
  const [feedback, setFeedback] = useState(getDefaultFeedback());
  const [previousFeedback, setPreviousFeedback] = useState(getDefaultFeedback());
  // Caption editing
  const [caption, setCaption] = useState(submission.caption || '');
  
  // Video Modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Video dimensions state for responsive sizing
  const [videoDimensions, setVideoDimensions] = useState({});
  
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
  
  // Handle video metadata loaded to get dimensions
  const handleVideoMetadata = useCallback((footageId, videoElement) => {
    if (videoElement) {
      const { videoWidth, videoHeight } = videoElement;
      const aspectRatio = videoWidth / videoHeight;
      setVideoDimensions(prev => ({
        ...prev,
        [footageId]: { width: videoWidth, height: videoHeight, aspectRatio }
      }));
    }
  }, []);
  
  // Calculate responsive video dimensions
  const getVideoStyles = useCallback((footageId) => {
    const dimensions = videoDimensions[footageId];
    if (!dimensions) {
      return { width: 240, height: 390 }; // Default portrait dimensions
    }
    
    const { aspectRatio } = dimensions;
    
    if (aspectRatio > 1) {
      // Landscape video - fit within container width, maintain aspect ratio
      const maxWidth = 520; // Fit within the 580px container with some padding
      const height = Math.min(350, maxWidth / aspectRatio); // Max height to fit in container
      const width = height * aspectRatio;
      return { width, height };
    } else {
      // Portrait video - use default mobile dimensions
      return { width: 240, height: 390 };
    }
  }, [videoDimensions]);

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

  return (
      <Box sx={{ 
        overflow: 'hidden',
        bgcolor: 'background.neutral'
      }}>
        {/* Raw Footage Content */}
        {submission.status !== 'CLIENT_APPROVED' && (
        <Box>
          {clientVisible ? (
            // Show actual content to admins or when sent to client
            rawFootages.length > 0 ? (
              <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
                {/* Horizontal Layout: Caption on Left, Raw Footage on Right */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  alignItems: 'stretch',
                  minHeight: 405
                }}>
                  {/* Caption Section - Left Side */}
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    maxWidth: 400
                  }}>
                    {/* Top Content - Flexible space */}
                    <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                      {/* Caption */}
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
                        <Box>
                          <Typography fontSize={14} color={'#636366'} sx={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                            {submission.caption}
                          </Typography>
                        </Box>
                      ) : null}
                    </Box>

                    <Box sx={{ flex: 'auto 0 1', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      {submission.feedback && submission.feedback.length > 0 && (
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                        <Stack spacing={1}>
                          {[submission.feedback[0]].map((feedback, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                              <Box sx={{ flex: 1 }}>
                                {feedback.reasons?.map((reason, reasonIndex) => (
                                  <Chip 
                                  sx={{
                                    border: '1px solid',
                                    pb: 1.8,
                                    pt: 1.6,
                                    mr: 0.5,
                                    mb: 0.4,
                                    borderColor: '#D4321C',
                                    borderRadius: 0.8,
                                    boxShadow: `0px -1.7px 0px 0px #D4321C inset`,
                                    bgcolor: '#fff',
                                    color: '#D4321C',
                                    fontWeight: 'bold',
                                    fontSize: 12,
                                    mr: 0.5,
                                    mb: 0.4,
                                  }}
                                  key={reasonIndex} 
                                  label={reason} 
                                  size="small" 
                                  variant="outlined" 
                                  color="warning" />                                  
                                ))}                                  
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 0.5, mt: 1 }}>
                                  {(feedback.content || feedback.reasons) && 
                                    <Typography variant='caption' fontWeight="bold" color={'#636366'}>
                                      {feedback.admin?.name || 'CS Comments'}
                                    </Typography>
                                  }
                                </Box>
                                <Typography fontSize={12} sx={{ mb: feedback.reasons && feedback.reasons.length > 0 ? 1 : 0 }}>
                                  {feedback.content}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                        </Box>
                      )}
                    </Box>

                    {/* Feedback Section */}
                    {((!isClient && (submission.status === 'PENDING_REVIEW' || submission.status === 'CLIENT_FEEDBACK')) || (isClient && submission.status === 'SENT_TO_CLIENT')) && (
                      <Box sx={{ flex: '0 0 auto' }}>
                        <Stack spacing={1}>
                          {/* Action Buttons */}
                          <Stack direction="row" spacing={1} width="100%" justifyContent="flex-end">
                            {(clientVisible && !isClientFeedback) && (
                              <Button
                                variant="contained"
                                color="warning"
                                onClick={() => {
                                  // Store current feedback before changing
                                  setPreviousFeedback(feedback);
                                  setAction('request_revision');
                                  setFeedback('This submission needs to be revisited.')
                                }}
                                disabled={loading}
                                
                                sx={{
                                  display: action === 'request_revision' ? 'none' : 'flex',
                                  ...BUTTON_STYLES.base,
                                  ...BUTTON_STYLES.warning,
                                }}
                              >
                                {loading ? 'Processing...' : 'Request a Change'}
                              </Button>
                            )}
                            {(action === 'request_revision' && clientVisible) ? (
                              <Box display="flex" flexDirection="row" width="100%" gap={1} justifyContent="flex-end">
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  onClick={() => {
                                    setAction('approve');
                                    setReasons([]);
                                    // Revert to previous feedback message
                                    setFeedback(previousFeedback);
                                  }}
                                  disabled={loading}
                                  sx={{
                                    display: 'flex',
                                    ...BUTTON_STYLES.base,
                                    ...BUTTON_STYLES.secondary,
                                  }}
                                >
                                  Cancel Change Request
                                </Button>
                                <Button
                                  variant="contained"
                                  color={!isClient ? "success" : 'warning'}
                                  onClick={handleRequestChanges}
                                  disabled={loading}
                                  sx={{
                                    display: 'flex',
                                    ...BUTTON_STYLES.base,
                                    ...BUTTON_STYLES.success,
                                  }}
                                >
                                  {loading ? 'Processing...' : !isClient ? 'Send to Creator' : 'Request a Change'}
                                </Button>
                              </Box>
                              ) : !isClientFeedback && (
                              <Button
                                variant="contained"
                                color="success"
                                onClick={handleApprove}
                                disabled={loading}
                                sx={{
                                  display: 'flex',
                                  ...BUTTON_STYLES.base,
                                  ...BUTTON_STYLES.success,
                                }}
                              >
                                {loading ? 'Processing...' : !isClient ? 'Send to Client' : 'Approve'}
                              </Button>
                              )
                            }

                            {!isClient && isClientFeedback &&
                              <Stack spacing={1} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  onClick={handleRequestChanges}
                                  disabled={loading}
                                  sx={{
                                    display: action === 'request_revision' ? 'none' : 'flex',
                                    ...BUTTON_STYLES.base,
                                    ...BUTTON_STYLES.warning,
                                    width: 140,
                                    alignSelf: 'flex-end'
                                  }}
                                >
                                  {loading ? 'Processing...' : 'Send to Creator'}
                                </Button>
                              </Stack>
                            }
                          </Stack>

                          {(action === 'request_revision' || action === 'request_changes') &&
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
                          }

                          {/* Feedback Message Box */}
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
                    )}
                  </Box>

                  {/* Raw Footage Container - Right Side */}
                  <Box 
                    sx={{ 
                      width: 580, 
                      height: 405,
                      display: 'flex', 
                      flexDirection: 'column',
                      bgcolor: 'background.paper',
                      flexShrink: 0,
                    }}
                  >
                    {/* Raw Footage Grid Display Area */}
                    <Box 
                      sx={{ 
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        bgcolor: 'background.neutral',
                        height: '100%',
                        alignItems: 'center',
                        '&::-webkit-scrollbar': {
                          height: 5,
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
                      {rawFootages.map((rawFootage, footageIndex) => (
                        <Box
                          key={rawFootage.id}
                          sx={{
                            flexShrink: 0,
                          }}
                        >
                          {rawFootage.url ? (
                            <Box
                              sx={{
                                position: 'relative',
                                cursor: 'pointer',
                                ...getVideoStyles(rawFootage.id),
                                '&:hover .overlay': {
                                  opacity: 1,
                                },
                              }}
                              onClick={() => handleVideoClick(footageIndex)}
                            >
                              <video
                                style={{ 
                                  ...getVideoStyles(rawFootage.id),
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                                src={rawFootage.url}
                                onLoadedMetadata={(e) => handleVideoMetadata(rawFootage.id, e.target)}
                              >
                                <track kind="captions" srcLang="en" label="English" />
                              </video>
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
                                }}
                              >
                                <Iconify
                                  icon="eva:expand-fill"
                                  sx={{
                                    color: 'white',
                                    width: 40,
                                    height: 40,
                                    opacity: 0.9,
                                  }}
                                />
                              </Box>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: 240,
                                height: 390,
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
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box p={2}>
                <Typography color="text.secondary">No raw footage uploaded yet.</Typography>              
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
        )}
        
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
  index: PropTypes.number,
  onUpdate: PropTypes.func
};