import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Stack, TextField, Typography, LinearProgress } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import CustomV4Upload from 'src/components/upload/custom-v4-upload';
import ImageGridDisplay from 'src/components/upload/image-grid-display';

// File upload configuration for photos
const PHOTO_UPLOAD_CONFIG = {
  accept: {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'],
  },
  maxSize: 50 * 1024 * 1024, // 50MB
  multiple: true,
};

const V4PhotoSubmission = ({ submission, onUpdate, campaign }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState(submission.caption || '');
  const [postingLink, setPostingLink] = useState('');
  const [postingLoading, setPostingLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isReuploadMode, setIsReuploadMode] = useState(false);
  const [photosToRemove, setPhotosToRemove] = useState([]); // Track photos to be removed
  // Update caption when submission changes
  useEffect(() => {
    setCaption(submission.caption || '');
  }, [submission.caption]);

  // Check if there are existing submitted photos - memoized to prevent re-creation
  const submittedPhotos = useMemo(() => {
    const hasSubmittedPhotos = submission.photos && submission.photos.length > 0;
    return hasSubmittedPhotos ? submission.photos : [];
  }, [submission.photos]);

  // Check if changes are required
  const hasChangesRequired = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);

  // Determine if caption should be editable
  const isCaptionEditable = useMemo(() => {
    // Not editable if already submitted (unless in reupload mode or changes required)
    if (hasSubmitted && !isReuploadMode && !hasChangesRequired) {
      return false;
    }
    // Editable if: in reupload mode OR no photos have been submitted yet OR just uploaded locally OR changes are required
    return (
      isReuploadMode ||
      submittedPhotos.length === 0 ||
      (!hasSubmitted && selectedFiles.length > 0) ||
      hasChangesRequired
    );
  }, [
    isReuploadMode,
    submittedPhotos.length,
    hasSubmitted,
    selectedFiles.length,
    hasChangesRequired,
  ]);

  // Determine what photos to display in the upload area
  const photosToDisplay = useMemo(() => {
    if (isReuploadMode) {
      // In reupload mode, show existing photos (excluding those marked for removal) + any new selected files
      const existingPhotosToShow = submittedPhotos.filter(photo => !photosToRemove.includes(photo.id));
      return [...existingPhotosToShow, ...selectedFiles];
    }
    if (selectedFiles.length > 0) {
      return selectedFiles; // Show local files when uploading
    }
    if (submittedPhotos.length > 0) {
      // Show submitted photos excluding those marked for removal
      return submittedPhotos.filter(photo => !photosToRemove.includes(photo.id));
    }
    return []; // Show upload box when no photos
  }, [isReuploadMode, selectedFiles, submittedPhotos, photosToRemove]);

  // Memoize feedback filtering to avoid recalculation
  const relevantFeedback = useMemo(() => submission.feedback?.filter((feedback) => feedback.sentToCreator) || [], [submission.feedback]);

  // Memoized caption change handler to prevent image re-renders
  const handleCaptionChange = useCallback((e) => {
    setCaption(e.target.value);
  }, []);

  // Memoized file change handlers to prevent image re-renders
  const handleFilesChange = useCallback((files) => {
    setSelectedFiles(files);
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAdditionalFilesChange = useCallback((newFiles) => {
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Check if posting link was rejected (status is REJECTED and content was cleared, but photos exist)
  const isPostingLinkRejected =
    submission.status === 'REJECTED' && !submission.content && submission.photos?.length > 0;

  // Handle reupload mode - show existing photos for reference
  const handleReuploadMode = useCallback(() => {
    if (isPostingLinkRejected) {
      // For posting link rejection, don't enter reupload mode - just allow posting link editing
      // The posting link field will become editable due to isPostingLinkRejected being true
      return;
    }

    // For content rejection, enter additive mode and show existing photos
    setIsReuploadMode(true);
    setSelectedFiles([]); // Start with empty selection for new uploads (existing photos shown via photosToDisplay)
    setHasSubmitted(false); // Reset submitted state
  }, [isPostingLinkRejected]);

  const handleSubmit = async () => {
    // For initial upload, require at least one photo
    if (!isReuploadMode && selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one photo file', { variant: 'error' });
      return;
    }

    if (!caption.trim()) {
      enqueueSnackbar('Please enter a caption', { variant: 'error' });
      return;
    }

    // For reupload mode (additive), check if there are meaningful changes
    if (isReuploadMode) {
      const newFiles = selectedFiles.filter((file) => file instanceof File);
      const hasCaptionChange = caption.trim() !== (submission.caption || '').trim();
      const hasPhotosToRemove = photosToRemove.length > 0;

      // Allow submission if: new files added OR caption changed OR photos to be removed
      if (newFiles.length === 0 && !hasCaptionChange && !hasPhotosToRemove) {
        enqueueSnackbar(
          'No changes detected. Please add new photos, remove existing photos, or update the caption.',
          { variant: 'warning' }
        );
        return;
      }
    }

    // Immediately mark as submitted to disable button and make caption non-editable
    setHasSubmitted(true);

    const isReupload = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
    const existingPhotoCount = submission.photos?.length || 0;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // V4 Additive System: Only send new files, never replace existing photos
      const newFiles = selectedFiles.filter((file) => file instanceof File);


      // Add form data as JSON string - simplified for additive system
      const requestData = {
        submissionId: submission.id,
        caption: caption.trim(),
        isAdditiveUpdate: true, // Always additive in V4
        photosToRemove, // Include photos to be removed
      };
      formData.append('data', JSON.stringify(requestData));

      // Add only new photo files (not existing ones)
      newFiles.forEach((file) => {
        formData.append('photos', file);
      });

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
      });

      xhr.open('POST', endpoints.submission.creator.v4.submitContent, true);
      xhr.withCredentials = true;
      xhr.send(formData);

      await uploadPromise;

      const isUpdate = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
      const uploadedFiles = selectedFiles.filter((file) => file instanceof File);
      const existingPhotosCount = submission.photos?.length || 0;

      let successMessage;
      if (isUpdate) {
        const newPhotosCount = uploadedFiles.length;
        const removedPhotosCount = photosToRemove.length;
        const finalPhotoCount = existingPhotosCount - removedPhotosCount + newPhotosCount;
        
        if (newPhotosCount > 0 && removedPhotosCount > 0) {
          successMessage = `Updated photos: Added ${newPhotosCount} new, removed ${removedPhotosCount} existing. Total photos: ${finalPhotoCount}.`;
        } else if (newPhotosCount > 0) {
          successMessage = `Added ${newPhotosCount} new photo(s)! Total photos: ${finalPhotoCount}.`;
        } else if (removedPhotosCount > 0) {
          successMessage = `Removed ${removedPhotosCount} photo(s)! Total photos: ${finalPhotoCount}.`;
        } else {
          successMessage = 'Caption updated successfully!';
        }
      } else {
        successMessage = 'Photos uploaded successfully!';
      }

      enqueueSnackbar(successMessage, { variant: 'success' });

      onUpdate();
      // Clear removal state after successful submission
      setPhotosToRemove([]);
      // Reset submitted state to allow further changes
      setHasSubmitted(false);
      // Keep selectedFiles so preview remains visible
      // setSelectedFiles([]);
      // setCaption(''); // Keep caption too
    } catch (error) {
      console.error('Submit error:', error);
      setHasSubmitted(false); // Reset submitted state on error
      enqueueSnackbar(error.message || 'Failed to upload photos', { variant: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmitPostingLink = async () => {
    if (!postingLink.trim()) {
      enqueueSnackbar('Please enter a posting link', { variant: 'error' });
      return;
    }

    try {
      setPostingLoading(true);
      await axiosInstance.put(endpoints.submission.creator.v4.updatePostingLink, {
        submissionId: submission.id,
        postingLink: postingLink.trim(),
      });

      enqueueSnackbar('Posting link updated successfully', { variant: 'success' });
      onUpdate();
    } catch (error) {
      console.error('Error updating posting link:', error);
      enqueueSnackbar(error.message || 'Failed to update posting link', { variant: 'error' });
    } finally {
      setPostingLoading(false);
    }
  };

  const isSubmitted = submission.photos?.some((p) => p.url);
  const isInReview = ['PENDING_REVIEW', 'SENT_TO_CLIENT', 'CLIENT_FEEDBACK'].includes(
    submission.status
  );
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
  const isPosted = submission.status === 'POSTED';
  const hasPostingLink = Boolean(submission.content);
  const hasPendingPostingLink = hasPostingLink && isApproved && !isPosted;
  const needsPostingLink = isApproved && !submission.content;
  const isPostingLinkEditable = needsPostingLink || isPostingLinkRejected;

  // Check if posting links are required for this campaign type
  const requiresPostingLink =
    (campaign?.campaignType || submission.campaign?.campaignType) !== 'ugc';

  // Creator can upload if not in final states (but not for posting link rejection) - always show upload form to display photos
  // Also show when approved to display submitted photos and posting link field
  const canUpload = !isPosted;

  // Always show content if there are submitted photos, regardless of status
  const shouldShowContent = canUpload || submittedPhotos.length > 0;

  const isDisabled =
    uploading || !caption.trim() ||
    postingLoading ||
    submission.status === 'PENDING_REVIEW' ||
    submission.status === 'POSTED' ||
    (submission.status !== 'CHANGES_REQUIRED' &&
      submission.status !== 'NOT_STARTED' &&
      submission.status !== 'CLIENT_APPROVED' &&
      !isPostingLinkEditable) ||
    ((submission.status === 'NOT_STARTED' || submission.status === 'CLIENT_APPROVED') &&
      selectedFiles.length === 0 &&
      !isPostingLinkEditable);

  const isReuploadButton =
    submission.status === 'CHANGES_REQUIRED' && !isReuploadMode && !isPostingLinkRejected;

  const isSubmitButton =
    (isReuploadMode && submission.status === 'CHANGES_REQUIRED') ||
    ((submission.status === 'NOT_STARTED' || submission.status === 'CLIENT_APPROVED') &&
      (selectedFiles.length > 0 || isPostingLinkEditable));

  const buttonColor = isDisabled ? '#BDBDBD' : isReuploadButton ? '#1340FF' : '#3A3A3C';

  const buttonBorderColor = isDisabled ? '#BDBDBD' : isReuploadButton ? '#00000073' : '#000';

  return (
    <Stack spacing={3}>
      {/* Status Messages */}

      {/* Upload Form - Same design as Draft Videos */}
      {shouldShowContent && (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Main Content - Responsive Layout */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' }, // Stack vertically on mobile, horizontally on desktop
              gap: { xs: 2, md: 3 },
              mb: 2,
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden', // Prevent overflow
              // Ensure proper spacing on smaller screens
              '@media (max-width: 1200px)': {
                flexDirection: 'column',
                gap: 2,
              },
            }}
          >
            {/* Upload Area - Responsive width */}
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

            {/* Caption Area - Responsive positioning */}
            <Box
              sx={{
                width: { xs: '100%', md: 'min(325px, 35%)' }, // Responsive width on desktop, full width on mobile
                maxWidth: { xs: '100%', md: '325px' }, // Ensure it doesn't exceed container
                position: { xs: 'static', md: 'absolute' }, // Static on mobile, absolute on desktop
                top: { xs: 'auto', md: 0 },
                right: { xs: 'auto', md: 0 },
                zIndex: 2,
                order: { xs: 2, md: 2 }, // Second on both mobile and desktop
                // Ensure it doesn't overflow on smaller desktop screens
                '@media (max-width: 1200px)': {
                  position: 'static',
                  width: '100%',
                  maxWidth: '100%',
                },
              }}
            >
              {/* Additional Upload Box - Shows when 1+ images are displayed and in upload mode */}
              {photosToDisplay.length > 0 && (isReuploadMode || selectedFiles.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <CustomV4Upload
                    files={[]} // Empty to show upload box
                    onFilesChange={handleAdditionalFilesChange}
                    disabled={uploading}
                    submissionId={`${submission.id}-additional`}
                    accept="image/*"
                    maxSize={50 * 1024 * 1024}
                    fileTypes="JPG, JPEG, PNG"
                    height={120} // Smaller height for additional upload
                  />
                </Box>
              )}

              {/* Caption Field */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    fontFamily:
                      'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#636366',
                    fontWeight: 500,
                  }}
                >
                  Post Caption <span style={{ color: 'red' }}>*</span>
                </Typography>
                {isCaptionEditable ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={caption}
                    onChange={handleCaptionChange}
                    placeholder="Type your caption here..."
                    disabled={uploading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: '#9E9E9E',
                        opacity: 1,
                      },
                      maxWidth: '100%', // Prevent overflow
                      wordWrap: 'break-word',
                    }}
                  />
                ) : (
                  // Show read-only caption text when submitted
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily:
                        'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#636366',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap', // Preserve line breaks
                      minHeight: 'auto', // Allow natural height expansion
                      p: 1.5, // Add padding to match TextField appearance
                      border: 'none', // No border for read-only state
                      backgroundColor: 'transparent',
                      wordWrap: 'break-word', // Handle long words
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word', // Force long words to break
                      maxWidth: '100%', // Prevent overflow
                      width: '100%', // Take full width
                      display: 'block', // Ensure block display
                      overflow: 'visible', // Allow content to expand
                      textOverflow: 'clip', // Don't add ellipsis
                      WebkitLineClamp: 'unset', // Remove line clamping
                      WebkitBoxOrient: 'unset', // Remove webkit truncation
                      ml: -1.5, // Move caption text to the left on both mobile and desktop
                    }}
                  >
                    {caption || 'No caption provided'}
                  </Typography>
                )}

                {/* Posting Link Field - Simple implementation */}
                {requiresPostingLink && (isApproved || isPosted || isPostingLinkRejected) && (
                  <>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 2,
                        mb: 1,
                        fontWeight: 500,
                        fontFamily:
                          'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        color: '#636366',
                      }}
                    >
                      Posting Link
                    </Typography>

                    {isPostingLinkEditable ? (
                      <TextField
                        fullWidth
                        value={postingLink}
                        onChange={(e) => setPostingLink(e.target.value)}
                        placeholder="Posting Link"
                        disabled={postingLoading}
                        sx={{
                          maxWidth: '100%',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: 'white',
                          },
                        }}
                      />
                    ) : (
                      // Show read-only posting link when submitted - clickable and styled
                      <Typography
                        component="a"
                        href={submission.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2"
                        sx={{
                          fontFamily:
                            'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          color: '#1340FF',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          minHeight: 'auto',
                          p: 1.5,
                          border: 'none',
                          backgroundColor: 'transparent',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                          width: '100%',
                          display: 'block',
                          overflow: 'visible',
                          textOverflow: 'clip',
                          WebkitLineClamp: 'unset',
                          WebkitBoxOrient: 'unset',
                          ml: -1.5,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        {submission.content || 'No posting link provided'}
                      </Typography>
                    )}
                  </>
                )}
              </Box>

              {/* Feedback Section - Show when changes are required */}
              {hasChangesRequired && relevantFeedback.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {/* Change Request Reasons */}
                  {relevantFeedback[0]?.reasons && relevantFeedback[0].reasons.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {relevantFeedback[0].reasons.map((reason, index) => (
                        <Typography
                          key={index}
                          variant="caption"
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            mr: 1,
                            mb: 0.5,
                            fontWeight: 600,
                            border: '1px solid',
                            borderBottom: '3px solid',
                            borderRadius: 0.8,
                            bgcolor: 'white',
                            color: '#FF4842',
                            borderColor: '#FF4842',
                            fontSize: '0.75rem',
                            fontFamily:
                              'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          }}
                        >
                          {reason}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {/* CS Feedback */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily:
                        'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#636366',
                      mb: 1,
                      fontWeight: 600,
                    }}
                  >
                    CS Feedback
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily:
                        'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#636366',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {relevantFeedback[0]?.content || 'No specific feedback provided.'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Submit Button - Responsive Position */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' }, // Center on mobile, right-aligned on desktop
              alignItems: 'center',
              mt: { xs: 2, md: -6 }, // Normal spacing on mobile, negative margin on desktop
              position: 'relative',
              zIndex: 10,
            }}
          >
            {uploading && (
              <Box sx={{ flex: 1, mr: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Uploading photos... {Math.round(uploadProgress)}%
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            <Typography
              component="button"
              onClick={
                isReuploadButton
                  ? handleReuploadMode
                  : isPostingLinkEditable
                    ? handleSubmitPostingLink
                    : handleSubmit
              }
              disabled={isDisabled}
              sx={{
                px: 2,
                py: 1,
                fontWeight: 600,
                border: '1px solid',
                borderBottom: '3px solid',
                borderRadius: 0.8,
                bgcolor: buttonColor,
                color: 'white',
                borderColor: buttonBorderColor,
                textTransform: 'none',
                fontSize: '0.75rem',
                minWidth: '80px',
                height: '32px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                '&:disabled': {
                  bgcolor: '#BDBDBD',
                  borderColor: '#BDBDBD',
                  color: 'white',
                  cursor: 'not-allowed',
                },
                // Remove hover effect
              }}
            >
              {uploading
                ? 'Uploading...'
                : postingLoading
                  ? 'Submitting...'
                  : isReuploadButton
                    ? 'Reupload Photos' // or 'Reupload Draft'/'Reupload Raw Footages' based on component
                    : isSubmitButton
                      ? 'Submit' 
                      : !postingLoading ? 'Submit' : 'Submitted'}
            </Typography>
          </Box>
        </Box>
      )}
    </Stack>
  );
};

V4PhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  campaign: PropTypes.object,
};

export default V4PhotoSubmission;
