import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useRef, useMemo, useState, useCallback } from 'react';

import { Box, Stack, TextField, Typography, IconButton } from '@mui/material';

import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

import FeedbackLogs from '../shared/feedback-logs';
import FeedbackSection from '../shared/feedback-section';
import FeedbackActions from '../shared/feedback-actions';
import useSubmissionSocket from '../shared/use-submission-socket';
import { getInitialReasons, getDefaultFeedback } from '../shared/feedback-utils';
import { VideoModal } from '../../../creator-stuff/submissions/firstDraft/media-modals';

// ----------------------------------------------------------------------

export default function MobileRawFootageSubmission({ submission, campaign, onUpdate }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const submissionProps = useMemo(() => {
    const rawFootages = submission.rawFootages || [];
    const pendingReview = ['PENDING_REVIEW'].includes(submission.status);
    const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);
    const clientVisible =
      !isClient ||
      ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);

    return {
      rawFootages,
      pendingReview,
      isClientFeedback,
      clientVisible,
    };
  }, [submission.rawFootages, submission.status, isClient]);

  const { rawFootages, pendingReview, isClientFeedback, clientVisible } = submissionProps;

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [localActionInProgress, setLocalActionInProgress] = useState(false);
  const [reasons, setReasons] = useState(() => getInitialReasons(isClientFeedback, submission));
  const [feedback, setFeedback] = useState(() =>
    getDefaultFeedback(isClientFeedback, submission, 'rawFootages')
  );
  const [caption, setCaption] = useState(submission.caption || '');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoStates, setVideoStates] = useState({});
  const videoRefs = useRef({});
  const [showFeedbackLogs, setShowFeedbackLogs] = useState(false);

  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const togglePlay = useCallback(
    (footageId) => {
      const videoRef = videoRefs.current[footageId];
      if (videoRef) {
        const currentState = videoStates[footageId];
        if (currentState?.isPlaying) {
          videoRef.pause();
        } else {
          videoRef.play();
        }
        setVideoStates((prev) => ({
          ...prev,
          [footageId]: {
            ...prev[footageId],
            isPlaying: !currentState?.isPlaying,
          },
        }));
      }
    },
    [videoStates]
  );

  const handleSeek = useCallback(
    (event, footageId) => {
      const videoRef = videoRefs.current[footageId];
      if (videoRef) {
        const rect = event.currentTarget.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        const newTime = pos * (videoStates[footageId]?.duration || 0);
        videoRef.currentTime = newTime;
        setVideoStates((prev) => ({
          ...prev,
          [footageId]: {
            ...prev[footageId],
            currentTime: newTime,
          },
        }));
      }
    },
    [videoStates]
  );

  const handleTimeUpdate = useCallback((footageId) => {
    const videoRef = videoRefs.current[footageId];
    if (videoRef) {
      setVideoStates((prev) => ({
        ...prev,
        [footageId]: {
          ...prev[footageId],
          currentTime: videoRef.currentTime,
        },
      }));
    }
  }, []);

  const handleVideoMetadataLoaded = useCallback((footageId, videoElement) => {
    if (videoElement) {
      const { duration } = videoElement;

      setVideoStates((prev) => ({
        ...prev,
        [footageId]: {
          ...prev[footageId],
          duration,
          currentTime: 0,
          isPlaying: false,
        },
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
          reasons: reasons || [],
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
        enqueueSnackbar('Please provide feedback or select reasons for changes', {
          variant: 'warning',
        });
        setLoading(false);
        return;
      }

      if (isClient) {
        await axiosInstance.post('/api/submissions/v4/approve/client', {
          submissionId: submission.id,
          action: 'request_changes',
          feedback: hasContent ? currentFeedback.trim() : '',
          reasons: currentReasons || [],
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
    hasRawFootage: true,
  });

  const renderCaptionContent = () => {
    if (pendingReview) {
      return (
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Enter caption here..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          size="small"
          sx={{
            mt: 0.5,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
        />
      );
    }

    if (submission.caption) {
      return (
        <Box
          sx={{
            maxHeight: 80,
            overflow: 'auto',
            mt: 0.5,
          }}
        >
          <Typography
            fontSize={13}
            color="#636366"
            sx={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.4,
            }}
          >
            {submission.caption}
          </Typography>
        </Box>
      );
    }

    return (
      <Typography fontSize={13} color="text.disabled" sx={{ mt: 0.5 }}>
        No caption provided
      </Typography>
    );
  };

  if (!clientVisible) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Iconify icon="eva:film-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
          <Typography variant="body2" color="text.secondary">
            Raw footage content is being processed.
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (rawFootages.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box
          component="img"
          src="/assets/icons/empty/ic_content.svg"
          alt="No content"
          sx={{ width: 80, height: 80, mb: 2, opacity: 0.6 }}
        />
        <Typography variant="body2" color="text.secondary">
          No deliverables to review yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
      {/* Raw Footage Gallery - Horizontal Scroll */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          pb: 1,
          mb: 2,
          '&::-webkit-scrollbar': {
            height: 4,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
          },
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {rawFootages.map((rawFootage, footageIndex) => {
          const videoState = videoStates[rawFootage.id] || {};
          const {
            isPlaying = false,
            currentTime = 0,
            duration = 0,
          } = videoState;
          const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

          return (
          <Box
            key={rawFootage.id}
            sx={{
              position: 'relative',
              flexShrink: 0,
              width: 160,
              borderRadius: 1.5,
              overflow: 'hidden',
              bgcolor: 'black',
            }}
          >
            {rawFootage.url ? (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {/* Video Thumbnail Area */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 180,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleVideoClick(footageIndex)}
                >
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current[rawFootage.id] = el;
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    src={rawFootage.url}
                    onLoadedMetadata={(e) => handleVideoMetadataLoaded(rawFootage.id, e.target)}
                    onTimeUpdate={() => handleTimeUpdate(rawFootage.id)}
                    onPlay={() =>
                      setVideoStates((prev) => ({
                        ...prev,
                        [rawFootage.id]: { ...prev[rawFootage.id], isPlaying: true },
                      }))
                    }
                    onPause={() =>
                      setVideoStates((prev) => ({
                        ...prev,
                        [rawFootage.id]: { ...prev[rawFootage.id], isPlaying: false },
                      }))
                    }
                  >
                    <track kind="captions" srcLang="en" label="English" />
                  </video>

                  {/* Index Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 22,
                      height: 28,
                      backgroundColor: 'white',
                      color: 'black',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 'bold',
                      border: '1px solid #EBEBEB',
                      boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                      zIndex: 2,
                    }}
                  >
                    {footageIndex + 1}
                  </Box>
                </Box>

                {/* Mini Video Controls */}
                <Box
                  sx={{
                    width: '100%',
                    height: 32,
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    px: 0.8,
                    py: 0.3,
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
                      width: 24,
                      height: 24,
                      p: 0.3,
                      mr: 0.5,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    }}
                  >
                    {isPlaying ? (
                      <Box sx={{ width: 7, height: 8, display: 'flex', gap: 0.3 }}>
                        <Box sx={{ width: 3, height: '100%', bgcolor: 'white' }} />
                        <Box sx={{ width: 3, height: '100%', bgcolor: 'white' }} />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid white',
                          borderTop: '4.5px solid transparent',
                          borderBottom: '4.5px solid transparent',
                          ml: 0.3,
                        }}
                      />
                    )}
                  </IconButton>

                  <Box
                    sx={{
                      flex: 1,
                      height: 4,
                      bgcolor: 'rgba(255,255,255,0.3)',
                      borderRadius: 2,
                      cursor: 'pointer',
                      mx: 0.3,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -8,
                        bottom: -8,
                        left: 0,
                        right: 0,
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeek(e, rawFootage.id);
                    }}
                  >
                    <Box
                      sx={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        bgcolor: 'primary.main',
                        borderRadius: 2,
                        transition: 'width 0.1s ease',
                      }}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontSize: 9,
                      minWidth: 28,
                      textAlign: 'right',
                    }}
                  >
                    {formatTime(duration)}
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoClick(footageIndex);
                    }}
                    sx={{
                      color: 'white',
                      p: 0.3,
                      ml: 0.3,
                      width: 24,
                      height: 24,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                  >
                    <Iconify icon="eva:expand-fill" width={14} height={14} />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.neutral',
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <Iconify icon="eva:film-fill" sx={{ color: 'text.disabled', fontSize: 32 }} />
                  <Typography variant="caption" color="text.secondary">
                    No footage
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>
          );
        })}
      </Box>

      {/* Caption Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" fontWeight="bold" color="#636366" mb={0.5}>
          Caption
        </Typography>
        {renderCaptionContent()}
      </Box>

      {/* Feedback Section */}
      {showFeedbackLogs ? (
        <FeedbackLogs submission={submission} onClose={() => setShowFeedbackLogs(false)} />
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
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
}

MobileRawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
};
