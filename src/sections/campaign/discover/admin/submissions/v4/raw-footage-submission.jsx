import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useRef, useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  TextField,
  Typography,
  IconButton
} from '@mui/material';

import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

import FeedbackLogs from './shared/feedback-logs';
import FeedbackSection from './shared/feedback-section';
import FeedbackActions from './shared/feedback-actions';
import useCaptionOverflow from './shared/use-caption-overflow';
import useSubmissionSocket from './shared/use-submission-socket';
import { getInitialReasons, getDefaultFeedback } from './shared/feedback-utils';
import { VideoModal } from '../../creator-stuff/submissions/firstDraft/media-modals';

export default function V4RawFootageSubmission({ submission, campaign, onUpdate }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const submissionProps = useMemo(() => {
    const rawFootages = submission.rawFootages || [];
    const pendingReview = ['PENDING_REVIEW'].includes(submission.status);
    const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);
    const clientVisible = !isClient || ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);

    return {      
      rawFootages,
      pendingReview,
      isClientFeedback,
      clientVisible,
    };
  }, [submission.rawFootages, submission.status]);

  const { rawFootages, pendingReview, isClientFeedback, clientVisible } = submissionProps;

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [localActionInProgress, setLocalActionInProgress] = useState(false);
  const [reasons, setReasons] = useState(() => getInitialReasons(isClientFeedback, submission));
  const [feedback, setFeedback] = useState(() => getDefaultFeedback(isClientFeedback, submission, 'rawFootages'));
  const [caption, setCaption] = useState(submission.caption || '');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const captionMeasureRef = useRef(null);
  const [videoDimensions, setVideoDimensions] = useState({});
  const [videoStates, setVideoStates] = useState({});
  const videoRefs = useRef({});
  const [showFeedbackLogs, setShowFeedbackLogs] = useState(false);

  const captionOverflows = useCaptionOverflow(captionMeasureRef, submission.caption);

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

        enqueueSnackbar('Raw footage approved successfully', { variant: 'success' });
      } else {
        await approveV4Submission({
          submissionId: submission.id,
          action: 'approve',
          feedback: feedback.trim() || undefined,
          reasons: reasons || [],
          caption: caption.trim() || undefined,
        });

        enqueueSnackbar('Raw footage approved successfully', { variant: 'success' });
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
      enqueueSnackbar(error.message || 'Failed to approve raw footage', { variant: 'error' });
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

  const handleVideoClick = useCallback((index) => {
    setCurrentVideoIndex(index);
    setVideoModalOpen(true);
  }, []);

  useSubmissionSocket({
    socket,
    submission,
    campaign,
    onUpdate,
    localActionInProgress,
    userId: user?.id,
    hasRawFootage: true
  });

  return (
    <Box sx={{
      overflow: 'hidden',
      bgcolor: 'background.neutral'
    }}>
      <Box>
        {clientVisible ? (
          rawFootages.length > 0 ? (
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
                  maxWidth: { xs: '100%', md: 420, lg: 500 },
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
                        ) : null}
                      </Box>

                      <Box sx={{ flex: 'auto 0 1', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <FeedbackSection
                          onViewLogs={() => setShowFeedbackLogs(true)}
                          submission={submission}
                          isVisible={submission.status !== 'PENDING_REVIEW'}
                          isClient={isClient}
                        />
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
                        onViewLogs={() => setShowFeedbackLogs(true)}
                      />
                    </>
                  )}
                </Box>
                
                {/* Content - Right side */}
                <Box
                  sx={{
                    width: { xs: '100%', sm: '100%', lg: 550 },
                    height: { xs: 350, sm: 400, md: 450, lg: 500 },
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: { xs: 0.8, sm: 1.2, md: 1.5, lg: 2 },
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      bgcolor: 'background.neutral',
                      height: '100%',
                      alignItems: 'stretch',
                      p: { xs: 0.5, sm: 0 },
                      '&::-webkit-scrollbar': {
                        height: { xs: 3, sm: 2, md: 1 },
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
                      scrollbarWidth: 'thin',
                      // Improve scroll momentum on touch devices
                      WebkitOverflowScrolling: 'touch',
                      scrollBehavior: 'smooth',
                    }}
                  >
                    {rawFootages.map((rawFootage, footageIndex) => {
                      const getFootageWidth = () => ({ xs: 140, sm: 160, md: 200, lg: 240 });

                      const getFootageHeight = () => ({ xs: 'calc(100% - 4px)', sm: 'calc(100% - 6px)', md: 'calc(100% - 8px)' });

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
                                borderRadius: { xs: 1, sm: 0 },
                                overflow: 'hidden',
                                '&:hover .overlay': {
                                  opacity: 1,
                                },
                                // Add touch-friendly active state
                                '&:active .overlay': {
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

                                <Box
                                  sx={{
                                    width: '100%',
                                    height: { xs: 28, sm: 30, md: 32 },
                                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: { xs: 0.8, sm: 1 },
                                    py: { xs: 0.3, sm: 0.5 },
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                                      minWidth: { xs: 24, sm: 22, md: 20 },
                                      minHeight: { xs: 24, sm: 22, md: 20 },
                                      p: { xs: 0.4, sm: 0.35, md: 0.3 },
                                      mr: { xs: 0.3, sm: 0.4, md: 0.5 },
                                      '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.2)'
                                      },
                                      '&:active': {
                                        bgcolor: 'rgba(255,255,255,0.3)'
                                      }
                                    }}
                                  >
                                    {videoStates[rawFootage.id]?.isPlaying ? (
                                      <Box sx={{
                                        width: { xs: 7, sm: 6.5, md: 6 },
                                        height: { xs: 8, sm: 7.5, md: 7 },
                                        display: 'flex',
                                        gap: { xs: 0.4, sm: 0.35, md: 0.3 }
                                      }}>
                                        <Box sx={{
                                          width: { xs: 3, sm: 2.7, md: 2.5 },
                                          height: '100%',
                                          bgcolor: 'white'
                                        }} />
                                        <Box sx={{
                                          width: { xs: 3, sm: 2.7, md: 2.5 },
                                          height: '100%',
                                          bgcolor: 'white'
                                        }} />
                                      </Box>
                                    ) : (
                                      <Box sx={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: { xs: '7px solid white', sm: '6.5px solid white', md: '6px solid white' },
                                        borderTop: { xs: '4.5px solid transparent', sm: '4.2px solid transparent', md: '4px solid transparent' },
                                        borderBottom: { xs: '4.5px solid transparent', sm: '4.2px solid transparent', md: '4px solid transparent' },
                                        ml: { xs: 0.3, sm: 0.25, md: 0.2 }
                                      }} />
                                    )}
                                  </IconButton>

                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'white', 
                                      minWidth: { xs: '25px', sm: '28px', md: '30px' }, 
                                      fontSize: { xs: 9, sm: 9.5, md: 10 }
                                    }}
                                  >
                                    {formatTime(videoStates[rawFootage.id]?.currentTime || 0)}
                                  </Typography>

                                  <Box
                                    sx={{
                                      flex: 1,
                                      height: { xs: 6, sm: 5, md: 4 },
                                      bgcolor: 'rgba(255,255,255,0.3)',
                                      borderRadius: 2,
                                      cursor: 'pointer',
                                      mx: { xs: 0.3, sm: 0.4, md: 0.5 },
                                      '&:hover': {
                                        height: { xs: 7, sm: 6, md: 5 }
                                      },
                                      '&:active': {
                                        height: { xs: 7, sm: 6, md: 5 }
                                      },
                                      // Increase touch target for mobile
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: { xs: -6, sm: -4, md: -2 },
                                        bottom: { xs: -6, sm: -4, md: -2 },
                                        left: 0,
                                        right: 0,
                                        display: { xs: 'block', md: 'none' }
                                      }
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

                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'white', 
                                      minWidth: { xs: '25px', sm: '28px', md: '30px' }, 
                                      fontSize: { xs: 9, sm: 9.5, md: 10 }
                                    }}
                                  >
                                    {formatTime(videoStates[rawFootage.id]?.duration || 0)}
                                  </Typography>

                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVideoClick(footageIndex);
                                    }}
                                    sx={{
                                      color: 'white',
                                      p: { xs: 0.4, sm: 0.35, md: 0.3 },
                                      ml: { xs: 0.3, sm: 0.4, md: 0.5 },
                                      minWidth: { xs: 28, sm: 26, md: 24 },
                                      minHeight: { xs: 28, sm: 26, md: 24 },
                                      '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.1)'
                                      },
                                      '&:active': {
                                        bgcolor: 'rgba(255,255,255,0.2)'
                                      },
                                    }}
                                  >
                                    <Iconify
                                      icon="eva:expand-fill"
                                      sx={{
                                        fontSize: { xs: 16, sm: 15, md: 14 }
                                      }}
                                    />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: { xs: 8, sm: 10, md: 12 },
                                  right: { xs: 4, sm: 6, md: 7, lg: 8 },
                                  width: { xs: 20, sm: 22, md: 24, lg: 26 },
                                  height: { xs: 28, sm: 30, md: 32, lg: 34 },
                                  backgroundColor: 'white',
                                  color: 'black',
                                  borderRadius: { xs: '4px', sm: '5px', md: '6px' },
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: { xs: 11, sm: 12, md: 13, lg: 14 },
                                  fontWeight: 'bold',
                                  zIndex: 10,
                                  border: '1px solid #EBEBEB',
                                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                  p: { xs: 0.3, sm: 0.5, md: 0.75, lg: 1 }
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
                                minHeight: { xs: 280, sm: 320, md: 360, lg: 390 },
                                bgcolor: 'background.neutral',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: { xs: 1, sm: 0 },
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
}

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  onUpdate: PropTypes.func
};
