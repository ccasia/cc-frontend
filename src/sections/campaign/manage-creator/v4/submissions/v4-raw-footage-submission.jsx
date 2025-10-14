import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Stack,
  Button,
  TextField,
  Typography,
  LinearProgress,
  IconButton,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import CustomV4Upload from 'src/components/upload/custom-v4-upload';
import RawFootageGridDisplay from 'src/components/upload/raw-footage-grid-display';

// File upload configuration for raw footage
const RAW_FOOTAGE_UPLOAD_CONFIG = {
  accept: {
    'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'],
  },
  maxSize: 500 * 1024 * 1024, // 500MB
  multiple: true,
};

const V4RawFootageSubmission = ({ submission, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState(submission.caption || '');
  const [isReuploadMode, setIsReuploadMode] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Update caption when submission changes
  useEffect(() => {
    setCaption(submission.caption || '');
  }, [submission.caption]);

  // Get submitted raw footages
  const submittedRawFootages = useMemo(() => {
    return submission.rawFootages || [];
  }, [submission.rawFootages]);

  // Determine display status
  const isApproved = useMemo(() => {
    return ['APPROVED', 'POSTED'].includes(submission.status);
  }, [submission.status]);

  const isPosted = useMemo(() => {
    return submission.status === 'POSTED';
  }, [submission.status]);

  const hasChangesRequired = useMemo(() => {
    return submission.status === 'CHANGES_REQUIRED';
  }, [submission.status]);

  // Memoize feedback filtering to avoid recalculation
  const relevantFeedback = useMemo(() => {
    if (!submission.feedback || submission.feedback.length === 0) {
      return [];
    }

    // Filter feedback for this specific submission and sent to creator
    const filteredFeedback = submission.feedback.filter(
      (feedback) => feedback.sentToCreator && feedback.submissionId === submission.id
    );

    // Sort by creation date and get the most recent one
    const sortedFeedback = filteredFeedback.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const mostRecentFeedback = sortedFeedback.slice(0, 1);
    return mostRecentFeedback;
  }, [submission.feedback, submission.id]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleCaptionChange = useCallback((e) => {
    setCaption(e.target.value);
  }, []);

  const handleFilesChange = useCallback((newFiles) => {
    setSelectedFiles(newFiles);
  }, []);

  const handleRemoveVideo = useCallback((index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAdditionalFilesChange = useCallback((newFiles) => {
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Handle reupload mode
  const handleReuploadMode = useCallback(() => {
    setIsReuploadMode(true);
    // Keep submitted raw footages as selected files so they remain visible with remove buttons
    setSelectedFiles(submittedRawFootages);
    setHasSubmitted(false); // Reset submitted state
  }, [submittedRawFootages]);

  // Memoize selectedFiles to prevent unnecessary re-renders
  const memoizedSelectedFiles = useMemo(() => selectedFiles, [selectedFiles]);

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one raw footage file', { variant: 'error' });
      return;
    }

    // For reupload mode, check if there are meaningful changes
    if (isReuploadMode) {
      const newFiles = selectedFiles.filter((file) => file instanceof File);
      const existingRawFootages = selectedFiles.filter(
        (file) => file && typeof file === 'object' && file.url && file.id
      );
      const originalRawFootageCount = submittedRawFootages.length;

      // Check if there are any changes: new files added OR raw footages removed OR caption changed
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

    // Immediately mark as submitted to disable button and make caption non-editable
    setHasSubmitted(true);

    const isReupload = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
    const existingRawFootageCount = submission.rawFootages?.length || 0;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Separate existing raw footages (API objects with URLs) from new files (File objects)
      const existingRawFootages = selectedFiles.filter(
        (file) => file && typeof file === 'object' && file.url && file.id
      );
      const newFiles = selectedFiles.filter((file) => file instanceof File);

      // Add form data as JSON string with selective update information
      const requestData = {
        submissionId: submission.id,
        caption: caption.trim(),
        isSelectiveUpdate: isReupload, // Flag for selective update vs full replacement
        keepExistingRawFootages: existingRawFootages.map((rawFootage) => ({
          id: rawFootage.id,
          url: rawFootage.url,
        })),
      };
      formData.append('data', JSON.stringify(requestData));

      // Add only new raw footage files (not existing ones)
      newFiles.forEach((file) => {
        formData.append('rawFootages', file);
      });

      // Create XMLHttpRequest for progress tracking
      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));

        xhr.open('POST', '/api/creator/submissions/v4/submit-content');
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      await uploadPromise;

      const isUpdate = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
      const uploadedFiles = selectedFiles.filter((file) => file instanceof File);
      const keptRawFootages = selectedFiles.filter(
        (file) => file && typeof file === 'object' && file.url && file.id
      );

      let successMessage;
      if (isUpdate) {
        if (uploadedFiles.length > 0 && keptRawFootages.length > 0) {
          successMessage = `Raw footages updated successfully! Added ${uploadedFiles.length} new video(s), kept ${keptRawFootages.length} existing video(s).`;
        } else if (uploadedFiles.length > 0) {
          successMessage = `${uploadedFiles.length} new raw footage(s) added successfully!`;
        } else {
          successMessage = 'Raw footages updated successfully!';
        }
      } else {
        successMessage = 'Raw footages uploaded successfully!';
      }

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

      // Update parent component
      if (onUpdate) {
        onUpdate();
      }

      // Reset states for successful submission
      setIsReuploadMode(false);
      // Commented out to maintain persistence like Photos
      // setSelectedFiles([]);
      // setCaption('');
    } catch (error) {
      console.error('Submit error:', error);
      setHasSubmitted(false);
      enqueueSnackbar(error.message || 'Failed to upload raw footages', { variant: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Determine what raw footages to display
  const rawFootagesToDisplay = useMemo(() => {
    // If actively uploading/reuploading, show selected files
    if (isReuploadMode || selectedFiles.length > 0) {
      return selectedFiles;
    }
    // Otherwise show submitted raw footages
    return submittedRawFootages;
  }, [isReuploadMode, selectedFiles, submittedRawFootages]);

  // Determine if caption should be editable
  const isCaptionEditable = useMemo(() => {
    // Not editable if already submitted (unless in reupload mode or changes required)
    if (hasSubmitted && !isReuploadMode && !hasChangesRequired) {
      return false;
    }
    // Editable if: in reupload mode OR no raw footages have been submitted yet OR just uploaded locally OR changes are required
    return (
      isReuploadMode ||
      submittedRawFootages.length === 0 ||
      (!hasSubmitted && selectedFiles.length > 0) ||
      hasChangesRequired
    );
  }, [
    isReuploadMode,
    submittedRawFootages.length,
    hasSubmitted,
    selectedFiles.length,
    hasChangesRequired,
  ]);

  // Determine if we can upload
  const canUpload = !isApproved && !isPosted;

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
              onRemoveVideo={null} // No remove button for approved/posted content
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

  const isDisabled =
    uploading ||
    submission.status === 'PENDING_REVIEW' ||
    submission.status === 'POSTED' ||
    (submission.status !== 'CHANGES_REQUIRED' && submission.status !== 'NOT_STARTED') ||
    ((submission.status === 'NOT_STARTED' || submission.status === 'CLIENT_APPROVED') &&
      selectedFiles.length === 0);

  const isReuploadButton = submission.status === 'CHANGES_REQUIRED' && !isReuploadMode;

  const isSubmitButton =
    (isReuploadMode && submission.status === 'CHANGES_REQUIRED') ||
    ((submission.status === 'NOT_STARTED' || submission.status === 'CLIENT_APPROVED') &&
      selectedFiles.length > 0);

  const buttonColor = isDisabled ? '#BDBDBD' : isReuploadButton ? '#1340FF' : '#3A3A3C';

  const buttonBorderColor = isDisabled ? '#BDBDBD' : isReuploadButton ? '#00000073' : '#000';

  return (
    <Box>
      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 },
          position: 'relative',
          minHeight: { xs: 'auto', md: 405 },
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
              height={{ xs: 320, md: 480 }} // Made longer to match Draft Videos
            />
          ) : (
            <RawFootageGridDisplay
              files={rawFootagesToDisplay}
              onRemoveVideo={
                (isReuploadMode || selectedFiles.length > 0) && isCaptionEditable
                  ? handleRemoveVideo
                  : null
              }
              height={{ xs: 320, md: 480 }}
            />
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
          {/* Additional Upload Box - Shows when 1+ videos are displayed and in upload mode */}
          {rawFootagesToDisplay.length > 0 && (isReuploadMode || selectedFiles.length > 0) && (
            <Box sx={{ mb: 2 }}>
              <CustomV4Upload
                files={[]} // Empty to show upload box
                onFilesChange={handleAdditionalFilesChange}
                disabled={uploading}
                submissionId={`${submission.id}-additional`}
                accept="video/*"
                maxSize={500 * 1024 * 1024}
                fileTypes="MP4, MOV, AVI, MKV, WEBM, M4V"
                height={120} // Smaller height for additional upload
              />
            </Box>
          )}

          {/* Caption Field */}
          {/* <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1, 
                fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#636366',
                fontWeight: 500
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
                  fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          </Box> */}

          {/* Feedback Section - Show when changes are required */}
          {hasChangesRequired && relevantFeedback.length > 0 && (
            <Card
              sx={{
                p: { xs: 1, md: 1 }, // Reduced padding to move content left
                pl: { xs: 0, md: 0 }, // Remove left padding completely
                bgcolor: 'transparent',
                boxShadow: 'none',
                border: 'none',
                mt: { xs: 1, md: 2 },
                maxHeight: { xs: 'auto', md: '220px' },
                overflowY: { xs: 'visible', md: 'auto' },
                mb: { xs: 0, md: 8 },
                position: { xs: 'static', md: 'relative' },
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                '&::-webkit-scrollbar': {
                  width: 6,
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
              }}
            >
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
                        mr: 0.5,
                        mb: 0.5,
                        fontWeight: 600,
                        border: '1px solid',
                        borderBottom: '3px solid',
                        borderRadius: 0.8,
                        bgcolor: 'white',
                        whiteSpace: 'nowrap',
                        color: '#FF4842',
                        borderColor: '#FF4842',
                        fontSize: '0.75rem',
                      }}
                    >
                      {reason}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* CS Feedback Title and Content */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily:
                      'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#636366',
                    fontWeight: 600,
                    mb: 0.5,
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
                    lineHeight: 1.4,
                    fontSize: '0.875rem',
                  }}
                >
                  {relevantFeedback[0]?.content || 'No specific feedback provided.'}
                </Typography>
              </Box>
            </Card>
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
        <Typography
          component="button"
          onClick={isReuploadButton ? handleReuploadMode : handleSubmit}
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
            : isReuploadButton
              ? 'Reupload Raw Footages' // or 'Reupload Draft'/'Reupload Raw Footages' based on component
              : 'Submit'}
        </Typography>
      </Box>
    </Box>
  );
};

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
};

export default V4RawFootageSubmission;
