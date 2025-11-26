import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useRef, useMemo, useState, useCallback } from 'react';

import { Box, Stack, TextField, Typography } from '@mui/material';

import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

import FeedbackLogs from '../shared/feedback-logs';
import FeedbackSection from '../shared/feedback-section';
import FeedbackActions from '../shared/feedback-actions';
import PostingLinkSection from '../shared/posting-link-section';
import useSubmissionSocket from '../shared/use-submission-socket';
import { getInitialReasons, getDefaultFeedback } from '../shared/feedback-utils';
import { PhotoModal } from '../../../creator-stuff/submissions/firstDraft/media-modals';

// ----------------------------------------------------------------------

export default function MobilePhotoSubmission({ submission, campaign, onUpdate }) {
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
  const [showFeedbackLogs, setShowFeedbackLogs] = useState(false);

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

  if (!clientVisible) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Iconify icon="eva:image-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
          <Typography variant="body2" color="text.secondary">
            Photo content is being processed.
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (photos.length === 0) {
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
      {/* Photo Gallery - Horizontal Scroll */}
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
        {photos.map((photo, photoIndex) => (
          <Box
            key={photo.id}
            sx={{
              position: 'relative',
              flexShrink: 0,
              width: 140,
              height: 180,
              borderRadius: 1.5,
              overflow: 'hidden',
              cursor: 'pointer',
              '&:active': {
                opacity: 0.8,
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
              }}
            />
            {/* Photo Index Badge */}
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
              }}
            >
              {photoIndex + 1}
            </Box>
            {/* Expand Overlay */}
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
                opacity: 0.6,
              }}
            >
              <Iconify
                icon="eva:expand-fill"
                sx={{
                  color: 'white',
                  width: 32,
                  height: 32,
                  opacity: 0.9,
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Caption Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" fontWeight="bold" color="#636366" mb={0.5}>
          Caption
        </Typography>
        {pendingReview ? (
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
        ) : submission.caption ? (
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
        ) : (
          <Typography fontSize={13} color="text.disabled" sx={{ mt: 0.5 }}>
            No caption provided
          </Typography>
        )}
      </Box>

      {/* Feedback Section */}
      {showFeedbackLogs ? (
        <FeedbackLogs submission={submission} onClose={() => setShowFeedbackLogs(false)} />
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            {!isClient &&
            (submission.status === 'CLIENT_APPROVED' ||
              submission.status === 'POSTED' ||
              submission.status === 'REJECTED') &&
            campaign?.campaignType === 'normal' ? (
              <PostingLinkSection
                submission={submission}
                onUpdate={onUpdate}
                onViewLogs={() => setShowFeedbackLogs(true)}
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
          />
        </>
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
}

MobilePhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
