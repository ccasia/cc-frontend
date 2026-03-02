import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useRef, useMemo, useState, useCallback } from 'react';

import { Box, Card, Chip, Stack, TextField, Typography, CircularProgress } from '@mui/material';

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
import { PhotoModal } from '../../creator-stuff/submissions/firstDraft/media-modals';

export default function V4PhotoSubmission({ submission, campaign, onUpdate, isDisabled = false }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const submissionProps = useMemo(() => {
    const photos = submission.photos || [];
    const pendingReview = ['PENDING_REVIEW'].includes(submission.status);
    const hasPostingLink = Boolean(submission.content);
    const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);
    const clientVisible =
      !isClient ||
      ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);

    return {
      photos,
      pendingReview,
      hasPostingLink,
      isClientFeedback,
      clientVisible,
    };
  }, [submission.photos, submission.status, submission.content, isClient]);

  const { photos, pendingReview, hasPostingLink, isClientFeedback, clientVisible } =
    submissionProps;

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [localActionInProgress, setLocalActionInProgress] = useState(false);
  const [reasons, setReasons] = useState(() => getInitialReasons(isClientFeedback, submission));
  const [feedback, setFeedback] = useState(() =>
    getDefaultFeedback(isClientFeedback, submission, 'photos')
  );
  const [caption, setCaption] = useState(submission.caption || '');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
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
          reasons: reasons || [],
        });

        enqueueSnackbar('Photos approved successfully', { variant: 'success' });
      } else {
        await approveV4Submission({
          submissionId: submission.id,
          action: 'approve',
          feedback: feedback.trim() || undefined,
          reasons: reasons || [],
          caption: caption.trim() || undefined,
        });

        enqueueSnackbar('Photos approved successfully', { variant: 'success' });
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
      enqueueSnackbar(error.message || 'Failed to approve photos', { variant: 'error' });
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

  const handlePhotoClick = useCallback((index) => {
    setCurrentPhotoIndex(index);
    setPhotoModalOpen(true);
  }, []);

  useSubmissionSocket({
    socket,
    submission,
    campaign,
    onUpdate,
    localActionInProgress,
    userId: user?.id,
    hasPhotos: true,
  });

  return (
    <Box
      sx={{
        overflow: 'hidden',
        bgcolor: 'background.neutral',
      }}
    >
      <Box>
        {(() => {
          if (!clientVisible) {
            return (
              <Card sx={{ p: 3, bgcolor: 'background.neutral', textAlign: 'center' }}>
                <Stack spacing={2} alignItems="center">
                  <Iconify icon="eva:image-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                  <Typography variant="body2" color="text.secondary">
                    Photo content is being processed.
                  </Typography>
                  <Chip label="Processing" color="info" size="small" />
                </Stack>
              </Card>
            );
          }
          // Processing state — creator has uploaded, worker is processing
          if (submission.status === 'IN_PROGRESS') {
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                <CircularProgress size={40} thickness={5} sx={{ color: '#8A5AFE' }} />
                <Typography variant="body2" color="text.secondary">
                  Creator&apos;s new photos are being processed
                </Typography>
              </Box>
            );
          }

          if (photos.length === 0) {
            return (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                textAlign="center"
                sx={{ p: 8, justifyContent: 'center' }}
              >
                <Box
                  component="img"
                  src="/assets/icons/empty/ic_content.svg"
                  alt="No content"
                  sx={{ width: 150, height: 150, mb: 3, opacity: 0.6 }}
                />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No deliverables found
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={4}>
                  This submission doesn&apos;t have any deliverables to review yet.
                </Typography>
              </Box>
            );
          }
          return (
            <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1, sm: 1.5, md: 2 },
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  minHeight: { xs: 600, sm: 550, md: 500 },
                  flexDirection: { xs: 'column', lg: 'row' },
                }}
              >
                {/* Caption & Feedback - Left side */}
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    maxWidth: { xs: '100%', md: 420, lg: 500 },
                    minWidth: { xs: '100%', lg: 350 },
                    height: { xs: 'auto', lg: 500 },
                    minHeight: { xs: 300, lg: 500 },
                    overflow: 'hidden',
                  }}
                >
                  {showFeedbackLogs ? (
                    <FeedbackLogs
                      submission={submission}
                      onClose={() => setShowFeedbackLogs(false)}
                    />
                  ) : (
                    <>
                      <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" fontWeight="bold" color="#636366" mb={0.5}>
                          Caption
                        </Typography>
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
                                    pointerEvents: 'none',
                                  }}
                                >
                                  <Typography
                                    fontSize={14}
                                    sx={{
                                      wordWrap: 'break-word',
                                      overflowWrap: 'break-word',
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {submission.caption}
                                  </Typography>
                                </Box>

                                {captionOverflows ? (
                                  <Box
                                    sx={{
                                      maxHeight: { xs: 80, sm: 100, md: 120 },
                                      overflow: 'auto',
                                      border: '1px solid #E7E7E7',
                                      borderRadius: 0.5,
                                      p: 1,
                                      bgcolor: 'background.paper',
                                    }}
                                  >
                                    <Typography
                                      fontSize={14}
                                      color="#636366"
                                      sx={{
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {submission.caption}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography
                                    fontSize={14}
                                    color="#636366"
                                    sx={{
                                      wordWrap: 'break-word',
                                      overflowWrap: 'break-word',
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {submission.caption}
                                  </Typography>
                                )}
                              </>
                            );
                          }
                          return null;
                        })()}
                      </Box>

                      <Box
                        sx={{
                          flex: 'auto 0 1',
                          minHeight: 0,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {!isClient &&
                        (submission.status === 'CLIENT_APPROVED' ||
                          submission.status === 'POSTED' ||
                          submission.status === 'REJECTED') &&
                        campaign?.campaignType === 'normal' ? (
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
                    {photos.map((photo, photoIndex) => {
                      const getPhotoWidth = () => ({ xs: 140, sm: 160, md: 200, lg: 240 });

                      const getPhotoHeight = () => ({
                        xs: 'calc(100% - 4px)',
                        sm: 'calc(100% - 6px)',
                        md: 'calc(100% - 8px)',
                      });

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
                              minHeight: { xs: 320, sm: 380, md: 420, lg: 450, xl: 480 },
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
                                p: { xs: 0.3, sm: 0.5, md: 0.75, lg: 1 },
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
                                opacity: { xs: 0.7, md: 0 },
                                transition: 'opacity 0.2s ease',
                                borderRadius: { xs: 1, sm: 0 },
                              }}
                            >
                              <Iconify
                                icon="eva:expand-fill"
                                sx={{
                                  color: 'white',
                                  width: { xs: 36, sm: 38, md: 40, lg: 44 },
                                  height: { xs: 36, sm: 38, md: 40, lg: 44 },
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
          );
        })()}
      </Box>

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
}

V4PhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
  isDisabled: PropTypes.bool,
};
