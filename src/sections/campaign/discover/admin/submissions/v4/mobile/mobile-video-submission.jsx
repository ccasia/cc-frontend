import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

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
import { VideoModal } from '../../../creator-stuff/submissions/firstDraft/media-modals';

// ----------------------------------------------------------------------

export default function MobileVideoSubmission({ submission, campaign, onUpdate }) {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const submissionProps = useMemo(() => {
    const video = submission.video?.[0];
    const pendingReview = ['PENDING_REVIEW'].includes(submission.status);
    const hasPostingLink = Boolean(submission.content);
    const isClientFeedback = ['CLIENT_FEEDBACK'].includes(submission.status);
    const clientVisible =
      !isClient ||
      ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'APPROVED', 'POSTED'].includes(submission.status);

    return {
      video,
      pendingReview,
      hasPostingLink,
      isClientFeedback,
      clientVisible,
    };
  }, [submission.video, submission.status, submission.content, isClient]);

  const { video, pendingReview, hasPostingLink, isClientFeedback, clientVisible } = submissionProps;

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [localActionInProgress, setLocalActionInProgress] = useState(false);
  const [reasons, setReasons] = useState(() => getInitialReasons(isClientFeedback, submission));
  const [feedback, setFeedback] = useState(() =>
    getDefaultFeedback(isClientFeedback, submission, 'video')
  );
  const [caption, setCaption] = useState(submission.caption || '');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
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

  const handleVideoClick = useCallback(() => {
    if (video?.url) {
      setCurrentVideoIndex(0);
      setVideoModalOpen(true);
    }
  }, [video?.url]);

  useSubmissionSocket({
    socket,
    submission,
    campaign,
    onUpdate,
    localActionInProgress,
    userId: user?.id,
  });

  const renderCaptionContent = () => {
    if (pendingReview) {
      return (
        <TextField
          fullWidth
          multiline
          rows={4}
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
      );
    }

    if (submission.caption) {
      return (
        <Box
          sx={{
            maxHeight: 120,
            overflow: 'auto',
          }}
        >
          <Typography
            fontSize={13}
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
      );
    }

    return (
      <Typography fontSize={13} color="text.disabled">
        No caption provided
      </Typography>
    );
  };

  if (!clientVisible) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Iconify icon="eva:video-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
          <Typography variant="body2" color="text.secondary">
            Video content is being processed.
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!video?.url) {
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
      {/* Caption and Video Side by Side */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {/* Caption Section - Left Side */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" fontWeight="bold" color="#636366" sx={{ display: 'block', mb: 0.5 }}>
            Caption
          </Typography>
          {renderCaptionContent()}
        </Box>

        {/* Video Thumbnail - Right Side */}
        <Box
          sx={{
            width: 130,
            minWidth: 100,
            height: 200,
            cursor: 'pointer',
            position: 'relative',
            bgcolor: 'grey.900',
          }}
          onClick={handleVideoClick}
        >
          <video
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            src={`${video.url}#t=0.1`}
            muted
            playsInline
            preload="auto"
          />
          {/* Play button overlay */}
          <Iconify
            icon="streamline-block:control-buttons-play"
            width={24}
            height={24}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#B0B0B0',
              ml: 0.25,
            }}
          />
        </Box>
      </Stack>

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
          showCaption
          title="Video Submission"
        />
      )}
    </Box>
  );
}

MobileVideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
