import React, { useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import { Box, Typography } from '@mui/material';

import CustomV4Upload from 'src/components/upload/custom-v4-upload';
import ImageGridDisplay from 'src/components/upload/image-grid-display';
import {
  SubmissionSection,
  SubmissionActionButton,
  useSubmissionUpload,
  getSubmissionStatusFlags,
  getRelevantFeedback,
  getIsCaptionEditable,
  preparePhotoFormData,
  getPhotoUploadSuccessMessage,
} from './shared';



const V4PhotoSubmission = ({ submission, onUpdate, campaign }) => {
  // Use shared hook with photo-specific configuration
  const {
    uploading,
    uploadProgress,
    selectedFiles,
    isReuploadMode,
    hasSubmitted,
    caption,
    postingLink,
    postingLoading,
    photosToRemove,
    setCaption,
    setPostingLink,
    setPhotosToRemove,
    handleCaptionChange,
    handleFilesChange,
    handleAdditionalFilesChange,
    handleRemoveFile,
    handleReuploadMode,
    handleSubmit,
    handleSubmitPostingLink,
  } = useSubmissionUpload(submission, onUpdate, {
    hasCaption: true,
    hasPostingLink: true,
    allowsMultipleUploads: true,
    mediaType: 'photo',
  });

  // Sync caption from submission
  useEffect(() => {
    setCaption(submission.caption || '');
  }, [submission.caption, setCaption]);

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

  // Get submitted photos
  const submittedPhotos = useMemo(() => {
    const hasSubmittedPhotos = submission.photos && submission.photos.length > 0;
    return hasSubmittedPhotos ? submission.photos : [];
  }, [submission.photos]);

  const shouldShowContent = !isPosted || submittedPhotos.length > 0;

  // Determine if caption is editable
  const isCaptionEditable = useMemo(
    () =>
      getIsCaptionEditable({
        isReuploadMode,
        submittedMediaCount: submittedPhotos.length,
        hasSubmitted,
        selectedFilesCount: selectedFiles.length,
        hasChangesRequired,
      }),
    [isReuploadMode, submittedPhotos.length, hasSubmitted, selectedFiles.length, hasChangesRequired]
  );

  // Determine photos to display
  const photosToDisplay = useMemo(() => {
    if (isReuploadMode) {
      const existingPhotosToShow = submittedPhotos.filter(
        (photo) => !photosToRemove.includes(photo.id)
      );
      return [...existingPhotosToShow, ...selectedFiles];
    }
    if (selectedFiles.length > 0) {
      return selectedFiles;
    }
    if (submittedPhotos.length > 0) {
      return submittedPhotos.filter((photo) => !photosToRemove.includes(photo.id));
    }
    return [];
  }, [isReuploadMode, selectedFiles, submittedPhotos, photosToRemove]);

  // Get relevant feedback
  const relevantFeedback = useMemo(() => getRelevantFeedback(submission), [submission]);

  // Handle photo removal with toggle for existing photos
  const handleRemoveImage = useCallback(
    (index) => {
      if (isReuploadMode) {
        const existingPhotosToShow = submittedPhotos.filter(
          (photo) => !photosToRemove.includes(photo.id)
        );
        const existingPhotosCount = existingPhotosToShow.length;

        if (index < existingPhotosCount) {
          // This is an existing photo - toggle removal status
          const photoToToggle = existingPhotosToShow[index];
          const isCurrentlyMarkedForRemoval = photosToRemove.includes(photoToToggle.id);

          if (isCurrentlyMarkedForRemoval) {
            // Unmark for removal
            setPhotosToRemove((prev) => prev.filter((id) => id !== photoToToggle.id));
            enqueueSnackbar('Photo unmarked for removal.', { variant: 'info' });
          } else {
            // Mark for removal
            setPhotosToRemove((prev) => [...prev, photoToToggle.id]);
            enqueueSnackbar('Photo marked for removal. Click again to unmark.', {
              variant: 'info',
            });
          }
          return;
        }
        // This is a new photo, adjust index for removal
        handleRemoveFile(index - existingPhotosCount);
      } else {
        handleRemoveFile(index);
      }
    },
    [isReuploadMode, submittedPhotos, photosToRemove, setPhotosToRemove, handleRemoveFile]
  );

  // Handle reupload mode (prevent if posting link is rejected)
  const onReuploadMode = useCallback(() => {
    if (isPostingLinkRejected) {
      return;
    }
    handleReuploadMode();
  }, [isPostingLinkRejected, handleReuploadMode]);

  // Handle submit with photo-specific validation and success message
  const onSubmit = useCallback(async () => {
    // Validation for photo submission
    if (!isReuploadMode && selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one photo file', { variant: 'error' });
      return;
    }

    if (!caption.trim()) {
      enqueueSnackbar('Please enter a caption', { variant: 'error' });
      return;
    }

    // Additional validation for reupload mode - ensure there are changes
    if (isReuploadMode) {
      const newFiles = selectedFiles.filter((file) => file instanceof File);
      const hasCaptionChange = caption.trim() !== (submission.caption || '').trim();
      const hasPhotosToRemove = photosToRemove.length > 0;

      // Check if there are any changes at all
      if (newFiles.length === 0 && !hasCaptionChange && !hasPhotosToRemove) {
        enqueueSnackbar(
          'No changes detected. Please add new photos, remove existing photos, or update the caption.',
          { variant: 'warning' }
        );
        return;
      }
    }

    // Call the shared submit handler (skip validation since we did it above)
    await handleSubmit(
      preparePhotoFormData,
      () => {
        const isUpdate = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
        const uploadedFilesCount = selectedFiles.filter((file) => file instanceof File).length;
        const existingPhotosCount = submission.photos?.length || 0;

        const successMessage = getPhotoUploadSuccessMessage({
          isUpdate,
          uploadedFilesCount,
          removedPhotosCount: photosToRemove.length,
          existingPhotosCount,
        });

        enqueueSnackbar(successMessage, { variant: 'success' });
      },
      true // Skip validation - we already validated above
    );
  }, [
    isReuploadMode,
    selectedFiles,
    caption,
    submission,
    photosToRemove,
    handleSubmit,
  ]);

  // Get button states - customized for photos to allow removal-only submissions
  const { isDisabled, isReuploadButton, isSubmitButton } = useMemo(() => {
    const hasChanges = isReuploadMode && (
      selectedFiles.some(file => file instanceof File) || // Has new files
      photosToRemove.length > 0 || // Has photos to remove
      caption.trim() !== (submission.caption || '').trim() // Caption changed
    );

    return {
      isDisabled:
        uploading ||
        !caption.trim() ||
        postingLoading ||
        submission.status === 'PENDING_REVIEW' ||
        submission.status === 'POSTED' ||
        (submission.status !== 'CHANGES_REQUIRED' &&
          submission.status !== 'NOT_STARTED' &&
          submission.status !== 'CLIENT_APPROVED' &&
          !isPostingLinkEditable) ||
        ((submission.status === 'NOT_STARTED' || submission.status === 'CLIENT_APPROVED') &&
          selectedFiles.length === 0 &&
          !isPostingLinkEditable),
      isReuploadButton:
        submission.status === 'CHANGES_REQUIRED' && !isReuploadMode && !isPostingLinkRejected,
      isSubmitButton:
        (isReuploadMode && submission.status === 'CHANGES_REQUIRED' && hasChanges) ||
        ((submission.status === 'NOT_STARTED' || submission.status === 'CLIENT_APPROVED') &&
          (selectedFiles.length > 0 || isPostingLinkEditable)),
    };
  }, [
    submission,
    isReuploadMode,
    selectedFiles,
    photosToRemove.length,
    caption,
    uploading,
    postingLoading,
    isPostingLinkEditable,
    isPostingLinkRejected,
  ]);

  return (
    <>
      {shouldShowContent && (
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
            {/* LEFT SIDE - Photo Upload Area */}
            <Box
              sx={{
                width: { xs: '100%', md: '65%' }, // Full width on mobile, 65% on desktop
                maxWidth: '100%', // Prevent overflow
                order: { xs: 1, md: 1 }, // First on both mobile and desktop
                // Adjust for smaller desktop screens
                '@media (max-width: 1200px)': {
                  width: '100%',
                },
              }}
            >
              {photosToDisplay.length === 0 ? (
                <CustomV4Upload
                  files={[]}
                  onFilesChange={handleFilesChange}
                  disabled={uploading}
                  submissionId={submission.id}
                  submittedVideo={null}
                  accept="image/*"
                  maxSize={50 * 1024 * 1024}
                  fileTypes="JPG, JPEG, PNG"
                  height={{ xs: 320, md: 480 }} // Made longer to match Draft Videos
                />
              ) : (
                <Box>
                  <ImageGridDisplay
                    files={photosToDisplay}
                    onRemoveImage={
                      (isReuploadMode || selectedFiles.length > 0) && isCaptionEditable
                        ? (index) => {
                            if (isReuploadMode) {
                              const existingPhotosToShow = submittedPhotos.filter(photo => !photosToRemove.includes(photo.id));
                              const existingPhotosCount = existingPhotosToShow.length;
                              
                              if (index < existingPhotosCount) {
                                // This is an existing photo - toggle removal status
                                const photoToToggle = existingPhotosToShow[index];
                                const isCurrentlyMarkedForRemoval = photosToRemove.includes(photoToToggle.id);
                                
                                if (isCurrentlyMarkedForRemoval) {
                                  // Unmark for removal
                                  setPhotosToRemove(prev => prev.filter(id => id !== photoToToggle.id));
                                  enqueueSnackbar(`Photo unmarked for removal.`, { variant: 'info' });
                                } else {
                                  // Mark for removal
                                  setPhotosToRemove(prev => [...prev, photoToToggle.id]);
                                  enqueueSnackbar(`Photo marked for removal. Click again to unmark.`, { variant: 'info' });
                                }
                                return;
                              }
                              // This is a new photo, adjust index for removal
                              handleRemoveImage(index - existingPhotosCount);
                            } else {
                              handleRemoveImage(index);
                            }
                          }
                        : null
                    }
                    height={{ xs: 320, md: 480 }}
                  />
                  
                  {/* Show photo status in reupload mode */}
                  {isReuploadMode && submittedPhotos.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#636366', fontSize: '0.75rem' }}>
                        📷 {submittedPhotos.length - photosToRemove.length} existing photo(s) remaining
                      </Typography>
                      {photosToRemove.length > 0 && (
                        <Typography variant="caption" sx={{ color: '#ff4444', fontSize: '0.75rem' }}>
                          🗑️ {photosToRemove.length} photo(s) marked for removal
                        </Typography>
                      )}
                      {selectedFiles.length > 0 && (
                        <Typography variant="caption" sx={{ color: '#1340FF', fontSize: '0.75rem' }}>
                          ➕ {selectedFiles.length} new photo(s) to add
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* RIGHT SIDE - Caption, Posting Link & Feedback Area */}
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
              {photosToDisplay.length > 0 && (isReuploadMode || selectedFiles.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <CustomV4Upload
                    files={[]}
                    onFilesChange={handleAdditionalFilesChange}
                    disabled={uploading}
                    submissionId={`${submission.id}-additional`}
                    accept="image/*"
                    maxSize={50 * 1024 * 1024}
                    fileTypes="JPG, JPEG, PNG"
                    height={120}
                  />
                </Box>
              )}
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
            onReupload={onReuploadMode}
            onSubmit={onSubmit}
            onPostingLinkSubmit={handleSubmitPostingLink}
            isPostingLinkEditable={isPostingLinkEditable}
            reuploadText="Reupload Photos"
            uploadingText="Uploading photos..."
          />
        </Box>
      )}
    </>
  );
};

V4PhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  campaign: PropTypes.object,
};

export default V4PhotoSubmission;
