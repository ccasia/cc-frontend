import { useState, useCallback, useRef, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Slider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

import axiosInstance from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';
import { getDueDateStatus } from 'src/utils/dueDateHelpers';

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

const STATUS_COLORS = {
  PENDING_REVIEW: 'warning',
  IN_PROGRESS: 'info', 
  APPROVED: 'success',
  POSTED: 'success',
  REJECTED: 'error',
  CHANGES_REQUIRED: 'warning',
  SENT_TO_CLIENT: 'primary',
  CLIENT_APPROVED: 'success',
  CLIENT_FEEDBACK: 'warning',
  SENT_TO_ADMIN: 'info',
};

export default function V4VideoSubmission({ submission, index = 1, onUpdate }) {
  const { user } = useAuthContext();

  console.log('submission vids', submission.video)

  const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);

  const [loading, setLoading] = useState(false);
  const [postingApprovalLoading, setPostingApprovalLoading] = useState(false);
  const [action, setAction] = useState('approve');
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
      return submission.video?.[0]?.feedback || '';
    }
    if (submission.status === 'PENDING_REVIEW') {
      return 'This creator has submitted a video for your review. Please approve or request changes with comments below.';
    }
    if (submission.status === 'SENT_TO_CLIENT') {
      return 'Great work! Thanks for the submission.';
    }
    return '';
  };
  const [feedback, setFeedback] = useState(getDefaultFeedback());
  // Caption editing
  const [caption, setCaption] = useState(submission.caption || '');
  // Due date
  const [dueDateDialog, setDueDateDialog] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState(null);
  const [dueDateLoading, setDueDateLoading] = useState(false);
  // Video Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef(null);
  
  // Video dimensions state for responsive sizing
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0, aspectRatio: 1 });
  
  // Video Modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Detect client role
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  // Determine if client can see the actual content vs just placeholder
  const clientVisible = !isClient || ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);

  const submissionProps = useMemo(() => {
    const video = submission.video?.[0];
    const editCaption = ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);
    const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
    const isPosted = submission.status === 'POSTED';
    const hasPostingLink = Boolean(submission.content);
    const hasPendingPostingLink = hasPostingLink && !isPosted;
    
    return {
      video,
      editCaption,
      isApproved,
      isPosted,
      hasPostingLink,
      hasPendingPostingLink
    };
  }, [submission.video, submission.status, submission.content]);
  
  const { video, editCaption, isApproved, isPosted, hasPostingLink, hasPendingPostingLink } = submissionProps;

  console.log(video)

  const handleApprove = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isClient) {
        // Client-specific endpoint
        await axiosInstance.post('/api/submissions/v4/approve/client', {
          submissionId: submission.id,
          action: 'approve',
          feedback: feedback.trim(),
          reasons: reasons || []
        });

        enqueueSnackbar('Video approved successfully', { variant: 'success' });
      } else {
        // Admin endpoint
        await approveV4Submission({
          submissionId: submission.id,
          action: 'approve',
          feedback: feedback.trim() || undefined,
          reasons: reasons || [],
          caption: caption.trim() || undefined,
        });

        enqueueSnackbar('Video approved successfully', { variant: 'success' });
      }
      setFeedback('');
      setReasons([]);
      setAction('approve');
      onUpdate?.();
    } catch (error) {
      console.error('Error approving video:', error);
      enqueueSnackbar(error.message || 'Failed to approve video', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [feedback, reasons, caption, submission.id, onUpdate, isClient]);

  const handleRequestChanges = useCallback(async () => {
    try {
      setLoading(true);
      
      // Ensure we have either feedback content or reasons
      const hasContent = feedback.trim();
      const hasReasons = reasons && reasons.length > 0;
      
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
          feedback: hasContent ? feedback.trim() : '',
          reasons: reasons || []
        });

        enqueueSnackbar('Changes requested successfully', { variant: 'success' });
      } else {
        // Admin endpoint
        await approveV4Submission({
          submissionId: submission.id,
          action: 'request_revision',
          feedback: hasContent ? feedback.trim() : '',
          reasons: reasons || [],
          caption: caption.trim() || undefined,
        });

        enqueueSnackbar('Changes requested successfully', { variant: 'success' });
      }
      setFeedback('');
      setReasons([]);
      setAction('approve');
      onUpdate?.();
    } catch (error) {
      console.error('Error requesting changes:', error);
      enqueueSnackbar(error.message || 'Failed to request changes', { variant: 'error' });
    } finally {
      setLoading(false);
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


  const handleSetDueDate = useCallback(() => {
    setSelectedDueDate(submission.dueDate ? dayjs(submission.dueDate) : null);
    setDueDateDialog(true);
  }, [submission.dueDate]);

  const handleSubmitDueDate = useCallback(async () => {
    if (!selectedDueDate) {
      enqueueSnackbar('Please select a due date', { variant: 'error' });
      return;
    }

    try {
      setDueDateLoading(true);
      
      await axiosInstance.put('/api/submissions/v4/due-date', {
        submissionId: submission.id,
        dueDate: selectedDueDate.toISOString(),
      });

      enqueueSnackbar('Due date updated successfully', { variant: 'success' });
      setDueDateDialog(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating due date:', error);
      enqueueSnackbar(error.message || 'Failed to update due date', { variant: 'error' });
    } finally {
      setDueDateLoading(false);
    }
  }, [selectedDueDate, submission.id, onUpdate]);

  const getStatusColor = useCallback((status) => {
    return STATUS_COLORS[status] || 'default';
  }, []);

  const formatStatus = useCallback((status) => {
    return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }, []);

  const getClientStatusLabel = useCallback((status) => {
    if (!isClient) {
      // Admin-specific status labels
      switch (status) {
        case 'CLIENT_FEEDBACK':
          return 'CLIENT FEEDBACK';
        default:
          return formatStatus(status);
      }
    }

    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PENDING_REVIEW':
        return 'In Progress'; // Creator has submitted, admin reviewing
      case 'SENT_TO_CLIENT':
        return 'Pending Review'; // Client should see this as pending their review
      case 'CLIENT_APPROVED':
      case 'APPROVED':
        return 'Approved';
      case 'POSTED':
        return 'Posted';
      case 'CLIENT_FEEDBACK':
        return 'In Progress'; // For clients - they've submitted feedback, now admin processing it
      case 'CHANGES_REQUIRED':
      case 'REJECTED':
        return 'Changes Required';
      default:
        return formatStatus(status);
    }
  }, [formatStatus, isClient]);

  const dueDateStatus = useMemo(() => getDueDateStatus(submission.dueDate), [submission.dueDate]);

  const videoControls = useMemo(() => ({
    togglePlay: () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    },
    
    handleTimeUpdate: () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    },
    
    handleLoadedMetadata: () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
        // Get video dimensions for responsive sizing
        const { videoWidth, videoHeight } = videoRef.current;
        const aspectRatio = videoWidth / videoHeight;
        setVideoDimensions({ width: videoWidth, height: videoHeight, aspectRatio });
      }
    },
    
    handleSeek: (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const pos = (event.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    
    handleVolumeChange: (_, newValue) => {
      const newVolume = newValue / 100;
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
    },
    
    toggleMute: () => {
      if (videoRef.current) {
        if (volume === 0) {
          setVolume(0.5);
          videoRef.current.volume = 0.5;
        } else {
          setVolume(0);
          videoRef.current.volume = 0;
        }
      }
    },
    
    formatTime: (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }), [isPlaying, duration, volume]);
  
  // Video modal handler
  const handleVideoClick = useCallback(() => {
    if (video?.url) {
      setCurrentVideoIndex(0);
      setVideoModalOpen(true);
    }
  }, [video?.url]);
  
  const { togglePlay, handleTimeUpdate, handleLoadedMetadata, handleSeek, handleVolumeChange, toggleMute, formatTime } = videoControls;


  return (
      <Box sx={{ 
        overflow: 'hidden',
        bgcolor: 'background.neutral',
      }}>
        {/* Video Content */}
        {submission.status !== 'CLIENT_APPROVED' && !hasPostingLink && submission.status !== 'REJECTED' && (
        <Box>
          {clientVisible ? (
            // Show actual content to admins or when sent to client
            video?.url ? (
              <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
                {/* Horizontal Layout: Caption on Left, Video on Right */}
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
                      {!editCaption ? (
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
                                    m: 0.3,
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

                  {/* Video Container - Right Side */}
                  <Box 
                    sx={{ 
                      width: 580, 
                      height: 405,
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      flexShrink: 0,
                    }}
                  >
                    {/* Video Display Area */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        bgcolor: 'black',
                        height: 350, // Fixed height instead of minHeight
                        flex: '1 1 auto',
                        overflow: 'hidden', // Prevent video from expanding beyond this area
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: videoDimensions.aspectRatio > 1 ? '100%' : 200, // Full width for landscape, fixed for portrait
                          maxWidth: videoDimensions.aspectRatio > 1 ? '100%' : 200,
                          height: 'auto',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onClick={handleVideoClick}
                      >
                        <video
                          ref={videoRef}
                          style={{ 
                            maxWidth: videoDimensions.aspectRatio > 1 ? '100%' : 200, // Wider for landscape
                            height: 'auto',
                            display: 'block',
                            pointerEvents: 'none'
                          }}
                          src={video.url}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        <Box
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
                            '&:hover': {
                              opacity: 1,
                            },
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

                    {/* Custom Controls Bar - Full Width */}
                    <Box 
                      sx={{ 
                        width: '100%',
                        height: 40,
                        bgcolor: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        pt: 1,
                        pb: 1,
                        px: 2,
                      }}
                    >
                      {/* Play/Pause Button */}
                      <IconButton 
                        size="small"
                        onClick={togglePlay}
                        sx={{ 
                          color: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          minWidth: videoDimensions.aspectRatio > 1 ? 28 : 25,
                          minHeight: videoDimensions.aspectRatio > 1 ? 28 : 25,
                          p: 0.5,
                          mr: 1,
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.2)'
                          }
                        }}
                      >
                        {isPlaying ? (
                          <Box sx={{ 
                            width: videoDimensions.aspectRatio > 1 ? 9 : 8, 
                            height: videoDimensions.aspectRatio > 1 ? 10 : 9, 
                            display: 'flex', 
                            gap: 0.4
                          }}>
                            <Box sx={{ 
                              width: videoDimensions.aspectRatio > 1 ? 3.5 : 3, 
                              height: '100%', 
                              bgcolor: 'white' 
                            }} />
                            <Box sx={{ 
                              width: videoDimensions.aspectRatio > 1 ? 3.5 : 3, 
                              height: '100%', 
                              bgcolor: 'white' 
                            }} />
                          </Box>
                        ) : (
                          <Box sx={{
                            width: 0,
                            height: 0,
                            borderLeft: videoDimensions.aspectRatio > 1 ? '9px solid white' : '8px solid white',
                            borderTop: videoDimensions.aspectRatio > 1 ? '6px solid transparent' : '5px solid transparent',
                            borderBottom: videoDimensions.aspectRatio > 1 ? '6px solid transparent' : '5px solid transparent',
                            ml: 0.3
                          }} />
                        )}
                      </IconButton>

                      {/* Current Time */}
                      <Typography variant={'caption'} sx={{ color: 'white', minWidth: videoDimensions.aspectRatio > 1 ? '45px' : '40px' }}>
                        {formatTime(currentTime)}
                      </Typography>

                      {/* Progress Bar - Takes up remaining space */}
                      <Box 
                        sx={{ 
                          flex: 1, 
                          height: 6, 
                          bgcolor: 'rgba(255,255,255,0.3)', 
                          borderRadius: 3,
                          cursor: 'pointer',
                          '&:hover': {
                            height: 8
                          },
                        }}
                        onClick={handleSeek}
                      >
                        <Box
                          sx={{
                            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            height: '100%',
                            bgcolor: 'primary.main',
                            borderRadius: 3,
                            transition: 'width 0.1s ease'
                          }}
                        />
                      </Box>

                      {/* Duration */}
                      <Typography variant={'caption'} sx={{ color: 'white', minWidth: videoDimensions.aspectRatio > 1 ? '45px' : '40px', ml: 2 }}>
                        {formatTime(duration)}
                      </Typography>

                      {/* Volume Control */}
                      <IconButton 
                        size="small"
                        onClick={toggleMute}
                        sx={{ 
                          color: 'white',
                          p: videoDimensions.aspectRatio > 1 ? 0.8 : 0.6,
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)'
                          },
                        }}
                      >
                        <Iconify 
                          icon={volume === 0 ? "eva:volume-mute-fill" : "eva:volume-up-fill"} 
                          width={videoDimensions.aspectRatio > 1 ? 18 : 16}
                          height={videoDimensions.aspectRatio > 1 ? 18 : 16}
                        />
                      </IconButton>

                      {/* Volume Slider */}
                      <Box sx={{ 
                        width: videoDimensions.aspectRatio > 1 ? 90 : 80, 
                        display: 'flex', 
                        alignItems: 'center',
                        height: '100%',
                        mr: 0.5
                      }}>
                        <Slider
                          size="small"
                          value={volume * 100}
                          onChange={handleVolumeChange}
                          sx={{
                            color: 'primary.main',
                            height: 4,
                            '& .MuiSlider-thumb': {
                              width: 12,
                              height: 12,
                              backgroundColor: 'white',
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(255,255,255,0.16)',
                              }
                            },
                            '& .MuiSlider-track': {
                              border: 'none',
                              backgroundColor: 'primary.main'
                            },
                            '& .MuiSlider-rail': {
                              opacity: 0.5,
                              backgroundColor: 'rgba(255,255,255,0.3)',
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box p={2}>
                <Typography color="text.secondary">No video uploaded yet.</Typography>              
              </Box>
            )
          ) : (
            // Show placeholder for clients when content is being processed
            <Card sx={{ p: 3, bgcolor: 'background.neutral', textAlign: 'center' }}>
              <Stack spacing={2} alignItems="center">
                <Iconify icon="eva:video-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                <Typography variant="body2" color="text.secondary">
                  Video content is being processed.
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

        {/* Due Date Dialog */}
        <Dialog open={dueDateDialog} onClose={() => setDueDateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {submission.dueDate ? 'Update Due Date' : 'Set Due Date'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set the due date for this video submission. The creator will be able to see this deadline.
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Due Date"
                value={selectedDueDate}
                onChange={(newValue) => setSelectedDueDate(newValue)}
                format="DD/MM/YYYY"
                minDate={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mt: 2 }
                  }
                }}
              />
            </LocalizationProvider>
            {selectedDueDate && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Due date: {selectedDueDate.format('dddd, MMMM DD, YYYY')}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDueDateDialog(false)} disabled={dueDateLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDueDate}
              variant="contained"
              disabled={dueDateLoading || !selectedDueDate}
              startIcon={<Iconify icon="eva:calendar-fill" />}
            >
              {dueDateLoading ? 'Saving...' : submission.dueDate ? 'Update Due Date' : 'Set Due Date'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Video Modal */}
        {video?.url && (
          <VideoModal
            open={videoModalOpen}
            onClose={() => setVideoModalOpen(false)}
            videos={[video]}
            currentIndex={currentVideoIndex}
            setCurrentIndex={setCurrentVideoIndex}
            creator={submission.user}
            submission={submission}
            showCaption={true}
            title="Video Submission"
          />
        )}
      </Box>
    );
};
