import React, { useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import { Box, Typography, LinearProgress } from '@mui/material';

import axiosInstance from 'src/utils/axios';

import CustomV4Upload from 'src/components/upload/custom-v4-upload';
import RawFootageGridDisplay from 'src/components/upload/raw-footage-grid-display';
import {
  SubmissionFeedback,
  SubmissionActionButton,
  useSubmissionUpload,
  getSubmissionStatusFlags,
  getRelevantFeedback,
  getButtonStates,
  getIsCaptionEditable,
  prepareRawFootageFormData,
  getRawFootageUploadSuccessMessage,
} from './shared';

const V4RawFootageSubmission = ({ submission, onUpdate }) => {
  // Use shared hook with raw footage-specific configuration (no caption, no posting link)
  const {
    uploading,
    uploadProgress,
    selectedFiles,
    isReuploadMode,
    hasSubmitted,
    caption,
    setCaption,
    setSelectedFiles,
    setIsReuploadMode,
    setHasSubmitted,
    handleFilesChange,
    handleAdditionalFilesChange,
    handleRemoveFile,
    handleSubmit: submitUpload,
  } = useSubmissionUpload(submission, onUpdate, {
    hasCaption: false,
    hasPostingLink: false,
    allowsMultipleUploads: true,
    mediaType: 'rawFootage',
  });

  // Sync caption from submission
  useEffect(() => {
    setCaption(submission.caption || '');
  }, [submission.caption, setCaption]);

  // Get submission status flags
  const statusFlags = useMemo(() => getSubmissionStatusFlags(submission), [submission]);

  const { isApproved, hasChangesRequired, isPosted } = statusFlags;

  // Get submitted raw footages
  const submittedRawFootages = useMemo(() => {
    return submission.rawFootages || [];
  }, [submission.rawFootages]);

  // Get relevant feedback
  const relevantFeedback = useMemo(() => getRelevantFeedback(submission), [submission]);

  // Custom reupload mode handler for raw footage (includes existing footages)
  const onReuploadMode = useCallback(() => {
    setIsReuploadMode(true);
    setSelectedFiles(submittedRawFootages);
    setHasSubmitted(false);
  }, [submittedRawFootages, setIsReuploadMode, setSelectedFiles, setHasSubmitted]);

  // Handle submit with raw footage-specific validation and success message
  const handleSubmit = async () => {
    // Additional validation for reupload mode
    if (isReuploadMode) {
      const newFiles = selectedFiles.filter((file) => file instanceof File);
      const existingRawFootages = selectedFiles.filter(
        (file) => file && typeof file === 'object' && file.url && file.id
      );
      const originalRawFootageCount = submittedRawFootages.length;

      const hasNewFiles = newFiles.length > 0;
      const hasRemovedRawFootages = existingRawFootages.length < originalRawFootageCount;
      const hasCaptionChange = caption.trim() !== (submission.caption || '').trim();

      if (!hasNewFiles && !hasRemovedRawFootages && !hasCaptionChange) {
        enqueueSnackbar(
          'No changes detected. Please add new raw footages, remove existing ones, or update the caption.',
          { variant: 'warning' }
        );
        return;
      }
    }

    submitUpload((params) => prepareRawFootageFormData({ ...params, submission }), async () => {
      const isUpdate = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
      const uploadedFilesCount = selectedFiles.filter((file) => file instanceof File).length;
      const keptRawFootagesCount = selectedFiles.filter(
        (file) => file && typeof file === 'object' && file.url && file.id
      ).length;

      const successMessage = getRawFootageUploadSuccessMessage({
        isUpdate,
        uploadedFilesCount,
        keptRawFootagesCount,
      });

      enqueueSnackbar(successMessage, { variant: 'success' });

      // Update submission status to IN REVIEW immediately after successful upload
      try {
        await axiosInstance.patch(`/api/creator/submissions/v4/${submission.id}/status`, {
          status: 'PENDING_REVIEW',
        });
      } catch (statusError) {
        console.error(
          'Failed to update status to IN REVIEW:',
          statusError.response?.data?.message || 'Something went wrong'
        );
      }
    });
  };

  const rawFootagesToDisplay = useMemo(() => {
    if (isReuploadMode || selectedFiles.length > 0) {
      return selectedFiles;
    }
    return submittedRawFootages;
  }, [isReuploadMode, selectedFiles, submittedRawFootages]);

  // Determine if caption should be editable
  const isCaptionEditable = useMemo(
    () =>
      getIsCaptionEditable({
        isReuploadMode,
        submittedMediaCount: submittedRawFootages.length,
        hasSubmitted,
        selectedFilesCount: selectedFiles.length,
        hasChangesRequired,
      }),
    [isReuploadMode, submittedRawFootages.length, hasSubmitted, selectedFiles.length, hasChangesRequired]
  );

  const canUpload = !isApproved && !isPosted;

  // Get button states (for non-approved/posted submissions)
  const { isDisabled, isReuploadButton, isSubmitButton } = useMemo(
    () =>
      getButtonStates({
        submission,
        isReuploadMode,
        selectedFiles,
        caption,
        uploading,
      }),
    [
      submission,
      isReuploadMode,
      selectedFiles,
      caption,
      uploading,
    ]
  );

  if (!canUpload) {
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Raw Footages {submission.status === 'POSTED' ? 'Posted' : 'Approved'}
        </Typography>

        {/* Display submitted raw footages */}
        {submittedRawFootages.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <RawFootageGridDisplay
              files={submittedRawFootages}
              onRemoveVideo={null}
              height={{ xs: 320, md: 480 }}
            />
          </Box>
        )}

        {/* Display caption if exists */}
        {submission.caption && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Caption:
            </Typography>
            <Typography variant="body1">{submission.caption}</Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 },
          position: 'relative',
          minHeight: { xs: 'auto', md: 405 },
          maxWidth: '100%',
          overflow: 'hidden',
          '@media (max-width: 1200px)': {
            flexDirection: 'column',
            gap: 2,
          },
        }}
      >
        {/* LEFT SIDE - Raw Footage Upload Area */}
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
          {rawFootagesToDisplay.length === 0 ? (
            <CustomV4Upload
              files={[]}
              onFilesChange={handleFilesChange}
              disabled={uploading}
              submissionId={submission.id}
              submittedVideo={null}
              accept="video/*"
              maxSize={500 * 1024 * 1024}
              fileTypes="MP4, MOV, AVI, MKV, WEBM, M4V"
              height={450}
              uploading={uploading}
              hasSubmitted={hasSubmitted}
            />
          ) : (
            <RawFootageGridDisplay
              files={rawFootagesToDisplay}
              onRemoveVideo={
                (isReuploadMode || selectedFiles.length > 0) && isCaptionEditable
                  ? handleRemoveFile
                  : null
              }
              height={{ xs: 320, md: 480 }}
            />
          )}
        </Box>

        {/* RIGHT SIDE - Additional Upload & Feedback Area */}
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
          {rawFootagesToDisplay.length > 0 && (isReuploadMode || selectedFiles.length > 0) && (
            <Box sx={{ mb: 2 }}>
              <CustomV4Upload
                files={[]}
                onFilesChange={handleAdditionalFilesChange}
                disabled={uploading}
                submissionId={`${submission.id}-additional`}
                accept="video/*"
                maxSize={500 * 1024 * 1024}
                fileTypes="MP4, MOV, AVI, MKV, WEBM, M4V"
                height={120}
                uploading={uploading}
                hasSubmitted={hasSubmitted}
              />
            </Box>
          )}

          <SubmissionFeedback
            feedback={relevantFeedback}
            hasChangesRequired={hasChangesRequired}
          />
        </Box>
      </Box>

      <SubmissionActionButton
        isDisabled={isDisabled}
        isReuploadButton={isReuploadButton}
        isSubmitButton={isSubmitButton}
        uploading={uploading}
        uploadProgress={uploadProgress}
        onReupload={onReuploadMode}
        onSubmit={handleSubmit}
        reuploadText="Reupload Raw Footages"
        submitText="Submit"
        uploadingText="Uploading..."
      />
    </Box>
  );
};

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
};

export default V4RawFootageSubmission;
