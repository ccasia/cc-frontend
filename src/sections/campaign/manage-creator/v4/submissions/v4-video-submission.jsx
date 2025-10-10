import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import { Box } from '@mui/material';

import CustomV4Upload from 'src/components/upload/custom-v4-upload';
import {
  SubmissionSection,
  SubmissionActionButton,
  useSubmissionUpload,
  getSubmissionStatusFlags,
  getRelevantFeedback,
  getButtonStates,
  getIsCaptionEditable,
  prepareVideoFormData,
} from './shared';

const V4VideoSubmission = ({ submission, onUpdate, campaign }) => {
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

  // Get submitted video
  const submittedVideo = useMemo(() => {
    const hasSubmittedVideos = submission.video && submission.video.length > 0;
    return hasSubmittedVideos ? submission.video[0] : null;
  }, [submission.video]);

  // Determine video to show (null if in reupload mode)
  const videoToShow = useMemo(() => {
    return isReuploadMode ? null : submittedVideo;
  }, [isReuploadMode, submittedVideo]);

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
  const onSubmit = useCallback((e) => {
    // Prevent default if this is an event
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    handleSubmit(prepareVideoFormData, () => {
      enqueueSnackbar('Videos uploaded successfully and are being processed!', {
        variant: 'success',
      });
    });
  }, [handleSubmit]);

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
            maxWidth: '100%',
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
            height={420}
          />
        </Box>

        {/* RIGHT SIDE - Caption, Posting Link & Feedback Sidebar */}
        <Box
          sx={{
            width: { xs: '100%', md: 'min(325px, 35%)' },
            maxWidth: { xs: '100%', md: '325px' },
            order: { xs: 2, md: 2 },
            '@media (max-width: 1200px)': {
              width: '100%',
              maxWidth: '100%',
            },
          }}
        >
          <SubmissionSection
            hasCaption={true}
            caption={caption}
            onCaptionChange={handleCaptionChange}
            isCaptionEditable={isCaptionEditable}
            hasPostingLink={requiresPostingLink && (isApproved || isPosted || isPostingLinkRejected)}
            postingLink={postingLink}
            onPostingLinkChange={(e) => setPostingLink(e.target.value)}
            isPostingLinkEditable={isPostingLinkEditable}
            submissionContent={submission.content}
            feedback={relevantFeedback}
            hasChangesRequired={hasChangesRequired}
            uploading={uploading}
            postingLoading={postingLoading}
          />
        </Box>
      </Box>

      {/* ACTION BUTTON */}
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
      />
    </Box>
  );
};

V4VideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  campaign: PropTypes.object,
};

export default V4VideoSubmission;
