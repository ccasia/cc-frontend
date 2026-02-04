import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useRef, useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Slider,
  TextField,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material';

import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

import FeedbackLogs from './shared/feedback-logs';
import FeedbackSection from './shared/feedback-section';
import FeedbackActions from './shared/feedback-actions';
import PostingLinkSection from './shared/posting-link-section';
import useCaptionOverflow from './shared/use-caption-overflow';
import useSubmissionSocket from './shared/use-submission-socket';
import { getInitialReasons, getDefaultFeedback } from './shared/feedback-utils';
import { VideoModal } from '../../creator-stuff/submissions/firstDraft/media-modals';

export default function V4VideoSubmission({ submission, campaign, onUpdate, isDisabled = false }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const submissionProps = useMemo(() => {
    const video = submission.video?.[0];
    const pendingReview = ['PENDING_REVIEW'].includes(submission.status);
    const hasPostingLink = Boolean(submission.content);
    const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);
    const clientVisible = !isClient || ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);

    return {
      video,
      pendingReview,
      hasPostingLink,
      isClientFeedback,
      clientVisible
    };
  }, [submission.video, submission.status, submission.content, isClient]);

  const { video, pendingReview, hasPostingLink, isClientFeedback, clientVisible } = submissionProps;

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [localActionInProgress, setLocalActionInProgress] = useState(false);
  const [reasons, setReasons] = useState(() => getInitialReasons(isClientFeedback, submission));
  const [feedback, setFeedback] = useState(() => getDefaultFeedback(isClientFeedback, submission, 'video'));
  const [caption, setCaption] = useState(submission.caption || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0, aspectRatio: 1 });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const captionMeasureRef = useRef(null);
  const [showFeedbackLogs, setShowFeedbackLogs] = useState(false);

  const captionOverflows = useCaptionOverflow(captionMeasureRef, submission.caption);

  const handleApprove = useCallback(async () => {
    try {
      setLoading(true);
      setLocalActionInProgress(true);

      if (isClient) {
        await axiosInstance.post('/api/submissions/v4/approve/client', {
          submissionId: submission.id,
          action: 'approve',
          feedback: feedback.trim(),
          reasons: reasons || []
        });

        enqueueSnackbar('Video approved successfully', { variant: 'success' });
      } else {
        await approveV4Submission({
          submissionId: submission.id,
          action: 'approve',
          feedback: feedback.trim() || '',
          reasons: reasons || [],
          caption: caption.trim() || undefined,
        });

        enqueueSnackbar('Video approved successfully', { variant: 'success' });
      }
      setFeedback('');
      setReasons([]);
      setAction('approve');

      setTimeout(() => {
        onUpdate?.(true);

        setTimeout(() => {
          setLocalActionInProgress(false);
        }, 500);
      }, 200);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to approve video', { variant: 'error' });
    } finally {
      setLoading(false);
      if (localActionInProgress) {
        setTimeout(() => setLocalActionInProgress(false), 300);
      }
    }
  }, [feedback, reasons, caption, submission.id, onUpdate, isClient, localActionInProgress]);

  const handleRequestChanges = useCallback(async () => {
    const currentFeedback = feedback;
    const currentReasons = reasons;

    try {
      setLoading(true);
      setLocalActionInProgress(true);

      const hasContent = currentFeedback.trim();
      const hasReasons = currentReasons && currentReasons.length > 0;

      if (!hasContent && !hasReasons) {
        enqueueSnackbar('Please provide feedback or select reasons for changes', { variant: 'warning' });
        setLoading(false);
        return;
      }

      if (isClient) {
        await axiosInstance.post('/api/submissions/v4/approve/client', {
          submissionId: submission.id,
          action: 'request_changes',
          feedback: hasContent ? currentFeedback.trim() : '',
          reasons: currentReasons || []
        });

        enqueueSnackbar('Changes requested successfully', { variant: 'success' });
      } else {
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

      setTimeout(() => {
        onUpdate?.(true);

        setTimeout(() => {
          setLocalActionInProgress(false);
        }, 500);
      }, 200);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to request changes', { variant: 'error' });
    } finally {
      setLoading(false);
      if (localActionInProgress) {
        setTimeout(() => setLocalActionInProgress(false), 300);
      }
    }
  }, [feedback, reasons, caption, submission.id, onUpdate, isClient, localActionInProgress]);

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

  const handleVideoClick = useCallback(() => {
    if (video?.url) {
      setCurrentVideoIndex(0);
      setVideoModalOpen(true);
    }
  }, [video?.url]);

  const { togglePlay, handleTimeUpdate, handleLoadedMetadata, handleSeek, handleVolumeChange, toggleMute, formatTime } = videoControls;

  useSubmissionSocket({
    socket,
    submission,
    campaign,
    onUpdate,
    localActionInProgress,
    userId: user?.id
  });

  return (
    <Box sx={{
      overflow: 'hidden',
      bgcolor: 'background.neutral',
    }}>
      <Box>
        {(() => {
          // Not visible to client - show processing message
          if (!clientVisible) {
            return (
              <Card sx={{ p: 3, bgcolor: 'background.neutral', textAlign: 'center' }}>
                <Stack spacing={2} alignItems="center">
                  <Iconify icon="eva:video-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                  <Typography variant="body2" color="text.secondary">
                    Video content is being processed.
                  </Typography>
                  <Chip
                    label="Processing"
                    color="info"
                    size="small"
                  />
                </Stack>
              </Card>
            );
          }

          // Processing state — creator has uploaded, worker is compressing
          if (submission.status === 'IN_PROGRESS') {
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                <CircularProgress size={40} thickness={5} sx={{ color: '#8A5AFE' }} />
                <Typography variant="body2" color="text.secondary">
                  Creator&apos;s new video is being processed
                </Typography>
              </Box>
            );
          }

          // No video - show empty state
          if (!video?.url) {
            return (
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" sx={{p: 8, justifyContent: 'center' }}>
                <Box component="img" src="/assets/icons/empty/ic_content.svg" alt="No content" sx={{ width: 150, height: 150, mb: 3, opacity: 0.6 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No deliverables found
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={4}>
                  This submission doesn&apos;t have any deliverables to review yet.
                </Typography>
              </Box>
            );
          }

          // Has video - show content
          return (
            <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Box sx={{
                display: 'flex',
                gap: { xs: 1, sm: 1.5, md: 2 },
                justifyContent: 'space-between',
                alignItems: 'stretch',
                minHeight: { xs: 600, sm: 550, md: 500 },
                flexDirection: { xs: 'column', lg: 'row' }
              }}>
                {/* Caption & Feedback - Left side */}
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  maxWidth: { xs: '100%', lg: 450, xl: 600 },
                  minWidth: { xs: '100%', lg: 350 },
                  height: { xs: 'auto', lg: 500 },
                  minHeight: { xs: 300, lg: 500 },
                  overflow: 'hidden'
                }}>
                  {showFeedbackLogs ? (
                    <FeedbackLogs
                      submission={submission}
                      onClose={() => setShowFeedbackLogs(false)}
                    />
                  ) : (
                    <>
                      <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant='caption' fontWeight="bold" color="#636366" mb={0.5}>Caption</Typography>
                        {(() => {
                          if (pendingReview) {
                            return (
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
                            );
                          }
                          if (submission.caption) {
                            return (
                              <>
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

                                {captionOverflows ? (
                                  <Box sx={{
                                    maxHeight: { xs: 80, sm: 100, md: 120 },
                                    overflow: 'auto',
                                    border: '1px solid #E7E7E7',
                                    borderRadius: 0.5,
                                    p: 1,
                                    bgcolor: 'background.paper',
                                  }}>
                                    <Typography fontSize={14} color="#636366" sx={{
                                      wordWrap: 'break-word',
                                      overflowWrap: 'break-word',
                                      lineHeight: 1.5
                                    }}>
                                      {submission.caption}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography fontSize={14} color="#636366" sx={{
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    lineHeight: 1.5
                                  }}>
                                    {submission.caption}
                                  </Typography>
                                )}
                              </>
                            );
                          }
                          return null;
                        })()}
                      </Box>

                      <Box sx={{ flex: 'auto 0 1', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        {!isClient && (submission.status === 'CLIENT_APPROVED' || submission.status === 'POSTED' || submission.status === 'REJECTED') && campaign?.campaignType === 'normal' ? (
                          <PostingLinkSection
                            submission={submission}
                            onUpdate={onUpdate}
                            onViewLogs={() => setShowFeedbackLogs(true)}
                            isDisabled={isDisabled}
                          />
                        ) : (
                          <FeedbackSection
                            onViewLogs={() => setShowFeedbackLogs(true)}
                            submission={submission}
                            isVisible={submission.status !== 'PENDING_REVIEW'}
                            isClient={isClient}
                          />
                        )}
                      </Box>

                      <FeedbackActions
                        submission={submission}
                        campaign={campaign}
                        isClient={isClient}
                        clientVisible={clientVisible}
                        isClientFeedback={isClientFeedback}
                        action={action}
                        setAction={setAction}
                        reasons={reasons}
                        setReasons={setReasons}
                        feedback={feedback}
                        setFeedback={setFeedback}
                        loading={loading}
                        handleApprove={handleApprove}
                        handleRequestChanges={handleRequestChanges}
                        hasPostingLink={hasPostingLink}
                        onViewLogs={() => setShowFeedbackLogs(true)}
                        isDisabled={isDisabled}
                      />
                    </>
                  )}
                </Box>
                
                {/* Content - Right side */}
                <Box
                  sx={{
                    width: { xs: '100%', sm: '100%', lg: 550 },
                    height: { xs: 400, sm: 450, lg: 500 },
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: 'black',
                      height: { xs: 300, sm: 320, lg: 350 },
                      flex: '1 1 auto',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        maxWidth: '100%',
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
                          maxWidth: (() => {
                            if (videoDimensions.aspectRatio > 1) return '100%';
                            return window.innerWidth < 600 ? 200 : 240;
                          })(),
                          height: 'auto',
                          display: 'block',
                          pointerEvents: 'none'
                        }}
                        src={video.url}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      >
                        <track kind="captions" />
                      </video>
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
                          opacity: { xs: 0.7, md: 0 },
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
                            width: { xs: 48, sm: 44, md: 40 },
                            height: { xs: 48, sm: 44, md: 40 },
                            opacity: 0.9,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      width: '100%',
                      height: { xs: 35, sm: 38, md: 40 },
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      pt: { xs: 0.8, sm: 1 },
                      pb: { xs: 0.8, sm: 1 },
                      px: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={togglePlay}
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        minWidth: videoDimensions.aspectRatio > 1 
                          ? { xs: 32, sm: 30, md: 28 } 
                          : { xs: 30, sm: 27, md: 25 },
                        minHeight: videoDimensions.aspectRatio > 1 
                          ? { xs: 32, sm: 30, md: 28 } 
                          : { xs: 30, sm: 27, md: 25 },
                        p: { xs: 0.7, sm: 0.6, md: 0.5 },
                        mr: { xs: 0.8, sm: 1 },
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)'
                        },
                        '&:active': {
                          bgcolor: 'rgba(255,255,255,0.3)'
                        }
                      }}
                    >
                      {isPlaying ? (
                        <Box sx={{
                          width: videoDimensions.aspectRatio > 1 
                            ? { xs: 10, sm: 9.5, md: 9 } 
                            : { xs: 9, sm: 8.5, md: 8 },
                          height: videoDimensions.aspectRatio > 1 
                            ? { xs: 11, sm: 10.5, md: 10 } 
                            : { xs: 10, sm: 9.5, md: 9 },
                          display: 'flex',
                          gap: { xs: 0.5, sm: 0.4 }
                        }}>
                          <Box sx={{
                            width: videoDimensions.aspectRatio > 1 
                              ? { xs: 4, sm: 3.7, md: 3.5 } 
                              : { xs: 3.5, sm: 3.2, md: 3 },
                            height: '100%',
                            bgcolor: 'white'
                          }} />
                          <Box sx={{
                            width: videoDimensions.aspectRatio > 1 
                              ? { xs: 4, sm: 3.7, md: 3.5 } 
                              : { xs: 3.5, sm: 3.2, md: 3 },
                            height: '100%',
                            bgcolor: 'white'
                          }} />
                        </Box>
                      ) : (
                        <Box sx={{
                          width: 0,
                          height: 0,
                          borderLeft: videoDimensions.aspectRatio > 1 
                            ? { xs: '10px solid white', sm: '9.5px solid white', md: '9px solid white' }
                            : { xs: '9px solid white', sm: '8.5px solid white', md: '8px solid white' },
                          borderTop: videoDimensions.aspectRatio > 1 
                            ? { xs: '7px solid transparent', sm: '6.5px solid transparent', md: '6px solid transparent' }
                            : { xs: '6px solid transparent', sm: '5.5px solid transparent', md: '5px solid transparent' },
                          borderBottom: videoDimensions.aspectRatio > 1 
                            ? { xs: '7px solid transparent', sm: '6.5px solid transparent', md: '6px solid transparent' }
                            : { xs: '6px solid transparent', sm: '5.5px solid transparent', md: '5px solid transparent' },
                          ml: { xs: 0.4, sm: 0.3 }
                        }} />
                      )}
                    </IconButton>

                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'white', 
                        minWidth: videoDimensions.aspectRatio > 1 
                          ? { xs: '38px', sm: '42px', md: '45px' }
                          : { xs: '35px', sm: '38px', md: '40px' },
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                      }}
                    >
                      {formatTime(currentTime)}
                    </Typography>

                    <Box
                      sx={{
                        flex: 1,
                        height: { xs: 8, sm: 7, md: 6 },
                        bgcolor: 'rgba(255,255,255,0.3)',
                        borderRadius: 3,
                        cursor: 'pointer',
                        mx: { xs: 0.5, sm: 0 },
                        '&:hover': {
                          height: { xs: 10, sm: 9, md: 8 }
                        },
                        '&:active': {
                          height: { xs: 10, sm: 9, md: 8 }
                        },
                        // Increase touch target for mobile
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: { xs: -8, sm: -6, md: -4 },
                          bottom: { xs: -8, sm: -6, md: -4 },
                          left: 0,
                          right: 0,
                          display: { xs: 'block', md: 'none' }
                        }
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

                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'white', 
                        minWidth: videoDimensions.aspectRatio > 1 
                          ? { xs: '38px', sm: '42px', md: '45px' }
                          : { xs: '35px', sm: '38px', md: '40px' }, 
                        ml: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                      }}
                    >
                      {formatTime(duration)}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={toggleMute}
                      sx={{
                        color: 'white',
                        p: videoDimensions.aspectRatio > 1 
                          ? { xs: 1, sm: 0.9, md: 0.8 }
                          : { xs: 0.8, sm: 0.7, md: 0.6 },
                        minWidth: { xs: 36, sm: 32, md: 28 },
                        minHeight: { xs: 36, sm: 32, md: 28 },
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)'
                        },
                        '&:active': {
                          bgcolor: 'rgba(255,255,255,0.2)'
                        },
                      }}
                    >
                      <Iconify
                        icon={volume === 0 ? "eva:volume-mute-fill" : "eva:volume-up-fill"}
                        width={videoDimensions.aspectRatio > 1 
                          ? { xs: 20, sm: 19, md: 18 }
                          : { xs: 18, sm: 17, md: 16 }
                        }
                        height={videoDimensions.aspectRatio > 1 
                          ? { xs: 20, sm: 19, md: 18 }
                          : { xs: 18, sm: 17, md: 16 }
                        }
                      />
                    </IconButton>

                    <Box sx={{
                      width: videoDimensions.aspectRatio > 1 
                        ? { xs: 70, sm: 80, md: 90 }
                        : { xs: 60, sm: 70, md: 80 },
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                      mr: { xs: 0.3, sm: 0.5 }
                    }}>
                      <Slider
                        size="small"
                        value={volume * 100}
                        onChange={handleVolumeChange}
                        sx={{
                          color: 'primary.main',
                          height: { xs: 6, sm: 5, md: 4 },
                          '& .MuiSlider-thumb': {
                            width: { xs: 16, sm: 14, md: 12 },
                            height: { xs: 16, sm: 14, md: 12 },
                            backgroundColor: 'white',
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: '0 0 0 8px rgba(255,255,255,0.16)',
                            },
                            '&:active': {
                              boxShadow: '0 0 0 12px rgba(255,255,255,0.2)',
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
          );
        })()}
      </Box>

      {video?.url && (
        <VideoModal
          open={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          videos={[video]}
          currentIndex={currentVideoIndex}
          setCurrentIndex={setCurrentVideoIndex}
          creator={submission.user}
          submission={submission}
          showCaption
          title="Video Submission"
        />
      )}
    </Box>
  );
}

V4VideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
  isDisabled: PropTypes.bool,
};
