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
  Grid
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
      return submission.photos?.[0]?.feedback || '';
    }
    if (submission.status === 'PENDING_REVIEW') {
      return 'This creator has submitted photos for your review. Please approve or request changes with comments below.';
    }
    if (submission.status === 'SENT_TO_CLIENT') {
      return 'Great work! Thanks for the submission.';
    }
    return '';
  };
  const [feedback, setFeedback] = useState(getDefaultFeedback());
  // Caption editing
  const [caption, setCaption] = useState(submission.caption || '');
  
  // Photo Modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
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
    
    return {
      photos,
      pendingReview,
      isApproved,
      hasPostingLink,
      hasPendingPostingLink
    };
  }, [submission.photos, submission.status, submission.content]);
  
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

  const handlePostingLinkApproval = useCallback(async (approvalAction) => {
    try {
      setPostingApprovalLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/approve', {
        submissionId: submission.id,
        action: approvalAction,
      });

      enqueueSnackbar(
        `Posting link ${approvalAction}d successfully`, 
        { variant: 'success' }
      );
      
      // Posting approval completed
      onUpdate?.();
    } catch (error) {
      console.error('Error approving posting link:', error);
      enqueueSnackbar(error.message || 'Failed to process posting link approval', { variant: 'error' });
    } finally {
      setPostingApprovalLoading(false);
    }
  }, [submission.id, onUpdate]);

  
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

  return (
      <Box sx={{ 
        overflow: 'hidden',
        bgcolor: 'background.neutral'
      }}>
        {/* Photo Content */}
        {submission.status !== 'CLIENT_APPROVED' && !hasPostingLink && submission.status !== 'REJECTED' && (
        <Box>
          {clientVisible ? (
            // Show actual content to admins or when sent to client
            photos.length > 0 ? (
              <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
                {/* Horizontal Layout: Caption on Left, Photos on Right */}
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
                    justifyContent: 'space-between'
                  }}>
                    {/* Top Content - Flexible space */}
                    <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Caption */}
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
                          <Typography fontSize={14} color={'#636366'}>
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
                            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
                                    fontSize: 12
                                  }}
                                  key={reasonIndex} 
                                  label={reason} 
                                  size="small" 
                                  variant="outlined" 
                                  color="warning" />                                  
                                ))}                                  
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 0.5, mt: 1.5 }}>
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
                      <Box sx={{ flex: '0 0 auto', pt: 2 }}>
                        <Stack spacing={1}>
                          {/* Action Buttons */}
                          <Stack direction="row" spacing={1} width="100%" justifyContent="flex-end">
                            {(clientVisible && !isClientFeedback) && (
                              <Button
                                variant="contained"
                                color="warning"
                                onClick={() => setAction('request_revision')}
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

                  {/* Photo Container - Right Side */}
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
                    {/* Photo Grid Display Area */}
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
                      {photos.map((photo, photoIndex) => (
                        <Box
                          key={photo.id}
                          sx={{
                            flexShrink: 0,
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              cursor: 'pointer',
                              width: 240,
                              height: 390,
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
                                width: 240,
                                height: 390,
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
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
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box p={2}>
                <Typography color="text.secondary">No photos uploaded yet.</Typography>              
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
        )}

        {/* Posting Link */}
        {hasPendingPostingLink && (
          <Box m={2} display={'flex'} flexDirection={'column'} width={400}>        
            <Card sx={{ p: 2, bgcolor: '#fff', mt: 1, borderRadius: 1.5, boxShadow: 'none', border: '1px solid #EBEBEB', width: 400 }}>
              {hasPostingLink ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all' }}>
                    {submission.content}
                  </Typography>
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  {isApproved ? 'Creator can add posting link' : 'Available after approved submission'}
                </Typography>
              )}
            </Card>

            {/* Admin Posting Link Approval */}
            {!isClient && hasPendingPostingLink && (
              <Stack direction="row" spacing={2} alignSelf={'flex-end'} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => handlePostingLinkApproval('reject')}
                  disabled={loading}
                  
                  sx={{
                    display: action === 'request_revision' ? 'none' : 'flex',
                    ...BUTTON_STYLES.base,
                    ...BUTTON_STYLES.warning,
                  }}
                >
                  Request a Change
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handlePostingLinkApproval('approve')}
                  disabled={loading}
                  sx={{
                    display: 'flex',
                    ...BUTTON_STYLES.base,
                    ...BUTTON_STYLES.success,
                  }}
                >
                  Approve
                </Button>
              </Stack>
            )}
          </Box>
        )}
        
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