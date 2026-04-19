import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useCallback } from 'react';

import { Box } from '@mui/material';

import CustomV4Upload from 'src/components/upload/custom-v4-upload';
import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import VideoSubmissionModal from './VideoSubmissionModal';
import { CreatorFeedbackModal } from './feeedback-component';
import {
  getButtonStates,
  SubmissionSection,
  useSubmissionUpload,
  getRelevantFeedback,
  getIsCaptionEditable,
  prepareVideoFormData,
  SubmissionActionButton,
  getSubmissionStatusFlags,
} from './shared';

// Helper to parse timestamp string to seconds
const parseSecondsFromTimestamp = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
};

const readFeedbackViewedCutoffMs = (submissionId) => {
  try {
    const raw = localStorage.getItem(`feedback_viewed_${submissionId}`);
    if (raw == null || raw === '') return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
};

const V4VideoSubmission = ({ submission, onUpdate, campaign, onUploadStateChange, creator }) => {
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewCommentBorders, setShowNewCommentBorders] = useState(false);
  /** Snapshot of last "viewed" time (ms) before opening modal; null = never viewed */
  const [commentHighlightCutoffMs, setCommentHighlightCutoffMs] = useState(null);

  const submittedVideo = useMemo(() => {
    const hasSubmittedVideos = submission.video && submission.video.length > 0;
    return hasSubmittedVideos ? submission.video[0] : null;
  }, [submission.video]);

  const { comments } = useSubmissionComments(submission?.id, submittedVideo?.id);

  const hasNewFeedback = useMemo(() => {
    try {
      const storageKey = `feedback_viewed_${submission.id}`;
      const lastViewedTimestamp = localStorage.getItem(storageKey);
      
      const allFeedback = submission?.feedback || [];
      const legacyFeedbackTime = allFeedback.length > 0
        ? Math.max(...allFeedback.map(f => new Date(f.createdAt || 0).getTime()))
        : 0;

      const allComments = comments || [];
      const commentTimes = allComments.flatMap(comment => {
        const times = [new Date(comment.createdAt || 0).getTime()];
        if (comment.replies && comment.replies.length > 0) {
          times.push(...comment.replies.map(r => new Date(r.createdAt || 0).getTime()));
        }
        return times;
      });
      const latestCommentTime = commentTimes.length > 0 ? Math.max(...commentTimes) : 0;

      const latestFeedbackTime = Math.max(legacyFeedbackTime, latestCommentTime);
      
      if (!lastViewedTimestamp && latestFeedbackTime > 0) {
        return true;
      }
      
      if (lastViewedTimestamp && latestFeedbackTime > parseInt(lastViewedTimestamp, 10)) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking new feedback:', error);
      return false;
    }
  }, [submission.id, submission?.feedback, comments]);

  // Use shared hook with video-specific configuration
  const {
    uploading,
    uploadProgress,
    selectedFiles,
    isReuploadMode,
    hasSubmitted,
    caption,
    postingLink,
    postingLoading,
    setPostingLink,
    handleCaptionChange,
    handleFilesChange,
    handleReuploadMode,
    handleSubmit,
    handleSubmitPostingLink,
  } = useSubmissionUpload(submission, onUpdate, {
    hasCaption: true,
    hasPostingLink: true,
    allowsMultipleUploads: false,
    mediaType: 'video',
  });

  // Notify parent when upload state changes
  React.useEffect(() => {
    if (onUploadStateChange) {
      onUploadStateChange(uploading);
    }
  }, [uploading, onUploadStateChange]);

  // Get submission status flags
  const statusFlags = useMemo(
    () => getSubmissionStatusFlags(submission, campaign),
    [submission, campaign]
  );

  const {
    isApproved,
    hasChangesRequired,
    isPosted,
    requiresPostingLink,
    isPostingLinkEditable,
    isPostingLinkRejected,
  } = statusFlags;

  // Determine video to show (null if in reupload mode)
  const videoToShow = useMemo(
    () => (isReuploadMode ? null : submittedVideo),
    [isReuploadMode, submittedVideo]
  );

  // Determine if caption is editable
  const isCaptionEditable = useMemo(
    () =>
      getIsCaptionEditable({
        isReuploadMode,
        submittedMediaCount: submittedVideo ? 1 : 0,
        hasSubmitted,
        selectedFilesCount: selectedFiles.length,
        hasChangesRequired,
      }),
    [isReuploadMode, submittedVideo, hasSubmitted, selectedFiles.length, hasChangesRequired]
  );

  // Get relevant feedback
  const relevantFeedback = useMemo(() => getRelevantFeedback(submission), [submission]);

  // Get button states
  const { isDisabled, isReuploadButton, isSubmitButton } = useMemo(
    () =>
      getButtonStates({
        submission,
        isReuploadMode,
        selectedFiles,
        caption,
        uploading,
        postingLoading,
        isPostingLinkEditable,
        isPostingLinkRejected,
        hasCaption: true,
      }),
    [
      submission,
      isReuploadMode,
      selectedFiles,
      caption,
      uploading,
      postingLoading,
      isPostingLinkEditable,
      isPostingLinkRejected,
    ]
  );

  // Handle reupload click (prevent if posting link is rejected)
  const handleReupload = () => {
    if (isPostingLinkRejected) {
      return;
    }
    handleReuploadMode();
  };

  // Handle submit with video-specific logic
  const onSubmit = useCallback(
    (e) => {
      // Prevent default if this is an event
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      handleSubmit(prepareVideoFormData, () => {
        enqueueSnackbar('Videos uploaded successfully and are being processed!', {
          variant: 'success',
        });
      });
    },
    [handleSubmit]
  );

  const markFeedbackAsViewed = useCallback(() => {
    try {
      const storageKey = `feedback_viewed_${submission.id}`;
      const currentTimestamp = Date.now();
      localStorage.setItem(storageKey, currentTimestamp.toString());
    } catch (error) {
      console.error('Error marking feedback as viewed:', error);
    }
  }, [submission.id]);

  // Handle video click to open modal
  const handleVideoClick = useCallback(() => {
    // Only open modal if there's a submitted video (not in reupload mode or selecting new files)
    if (submittedVideo && !isReuploadMode && selectedFiles.length === 0) {
      setCommentHighlightCutoffMs(hasNewFeedback ? readFeedbackViewedCutoffMs(submission.id) : null);
      setShowNewCommentBorders(hasNewFeedback);
      setIsModalOpen(true);
    }
  }, [submittedVideo, isReuploadMode, selectedFiles.length, hasNewFeedback, submission.id]);

  // Handle view feedback button click
  const handleViewFeedback = useCallback(() => {
    setCommentHighlightCutoffMs(hasNewFeedback ? readFeedbackViewedCutoffMs(submission.id) : null);
    setShowNewCommentBorders(hasNewFeedback);
    setIsModalOpen(true);
  }, [hasNewFeedback, submission.id]);

  // Determine if "View Feedback" button should show
  // Show when there's feedback and a video - including after reupload (so user can view feedback & previous drafts)
  const showViewFeedbackButton = useMemo(
    () => relevantFeedback && relevantFeedback.length > 0 && submittedVideo,
    [relevantFeedback, submittedVideo]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 },
          mb: 2,
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          '@media (max-width: 1200px)': {
            flexDirection: 'column',
            gap: 2,
          },
        }}
      >
        {/* LEFT SIDE - Video Upload Area */}
        <Box
          sx={{
            width: { xs: '100%', md: '65%' },
            order: { xs: 1, md: 1 },
            '@media (max-width: 1200px)': {
              width: '100%',
            },
          }}
        >
          <CustomV4Upload
            files={selectedFiles}
            onFilesChange={handleFilesChange}
            disabled={uploading}
            submissionId={submission.id}
            submittedVideo={videoToShow}
            accept="video/*"
            maxSize={500 * 1024 * 1024}
            fileTypes="MP4, MOV, AVI, MKV, WEBM"
            height={450}
            uploading={uploading}
            hasSubmitted={hasSubmitted}
            onVideoClick={handleVideoClick}
            multiple={false}
          />
        </Box>

        {/* RIGHT SIDE - Caption, Posting Link & Feedback Sidebar; actions align to video bottom on md+ */}
        <Box
          sx={{
            width: { xs: '100%', md: '35%' },
            order: { xs: 2, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            '@media (min-width: 1201px)': {
              minHeight: 450,
            },
          }}
        >
          <SubmissionSection
            hasCaption
            caption={caption}
            onCaptionChange={handleCaptionChange}
            isCaptionEditable={isCaptionEditable}
            hasPostingLink={
              requiresPostingLink && (isApproved || isPosted || isPostingLinkRejected)
            }
            postingLink={postingLink}
            onPostingLinkChange={(e) => setPostingLink(e.target.value)}
            isPostingLinkEditable={isPostingLinkEditable}
            submissionContent={submission.content}
            feedback={relevantFeedback}
            hasChangesRequired={hasChangesRequired}
            uploading={uploading}
            postingLoading={postingLoading}
          />

          <Box sx={{ mt: 'auto', width: '100%' }}>
            <SubmissionActionButton
              isDisabled={isDisabled}
              isReuploadButton={isReuploadButton}
              isSubmitButton={isSubmitButton}
              uploading={uploading}
              postingLoading={postingLoading}
              uploadProgress={uploadProgress}
              onReupload={handleReupload}
              onSubmit={onSubmit}
              onPostingLinkSubmit={handleSubmitPostingLink}
              isPostingLinkEditable={isPostingLinkEditable}
              reuploadText="Reupload Draft"
              uploadingText="Uploading videos..."
              showViewFeedbackButton={showViewFeedbackButton}
              onViewFeedback={handleViewFeedback}
              hasNewFeedback={hasNewFeedback}
              sx={{
                mt: 2,
                '@media (min-width: 1201px)': { mt: 0 },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* VIDEO SUBMISSION MODAL */}
      <VideoSubmissionModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setShowNewCommentBorders(false);
          setCommentHighlightCutoffMs(null);
          markFeedbackAsViewed();
        }}
        submission={submission}
        creator={creator}
        showNewCommentBorders={showNewCommentBorders}
        commentHighlightCutoffMs={commentHighlightCutoffMs}
        rightSideContent={({
          videoPage,
          setVideoPage,
          videoCount,
          currentVideo,
          showNewCommentBorders: showBorders,
          commentHighlightCutoffMs: highlightCutoff,
          submission: freshSubmission,
          onSeekTo,
          currentVideoTime,
          isPastVideo,
        }) => (
          <CreatorFeedbackModal
            submission={freshSubmission || submission}
            videoPage={videoPage}
            setVideoPage={setVideoPage}
            videoCount={videoCount}
            currentVideo={currentVideo}
            showNewCommentBorders={showBorders}
            commentHighlightCutoffMs={highlightCutoff}
            isPastVideo={isPastVideo}
            onSeekTo={onSeekTo}
            currentTime={parseSecondsFromTimestamp(currentVideoTime)}
          />
        )}
      />
    </Box>
  );
};

V4VideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  campaign: PropTypes.object,
  onUploadStateChange: PropTypes.func,
  creator: PropTypes.object,
};

// Memoize component with custom comparison to prevent unnecessary re-renders
const MemoizedV4VideoSubmission = React.memo(
  V4VideoSubmission,
  (prevProps, nextProps) =>
    // Only re-render if submission status, video, caption, or content changes
    prevProps.submission.id === nextProps.submission.id &&
    prevProps.submission.status === nextProps.submission.status &&
    prevProps.submission.caption === nextProps.submission.caption &&
    prevProps.submission.content === nextProps.submission.content &&
    JSON.stringify(prevProps.submission.video) === JSON.stringify(nextProps.submission.video) &&
    JSON.stringify(prevProps.submission.feedback) ===
      JSON.stringify(nextProps.submission.feedback) &&
    prevProps.campaign?.campaignType === nextProps.campaign?.campaignType
);

MemoizedV4VideoSubmission.displayName = 'V4VideoSubmission';

export default MemoizedV4VideoSubmission;
