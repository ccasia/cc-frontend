import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Stack,
  Button,
  TextField,
  Typography,
  LinearProgress,
  Card,
  Chip,
  Alert,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import CustomV4Upload from 'src/components/upload/custom-v4-upload';

const V4VideoSubmission = ({ submission, onUpdate, campaign }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState(submission.caption || '');
  const [isReuploadMode, setIsReuploadMode] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [postingLink, setPostingLink] = useState(submission.content || '');
  const [postingLoading, setPostingLoading] = useState(false);

  const [postingLinkLoading, setPostingLinkLoading] = useState(false);

  // Check if there are existing submitted videos - memoized to prevent re-creation
  const submittedVideo = useMemo(() => {
    const hasSubmittedVideos = submission.video && submission.video.length > 0;
    return hasSubmittedVideos ? submission.video[0] : null;
  }, [submission.video]);

  // Check if changes are required
  const hasChangesRequired = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);

  // Check posting link status
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
  const isPosted = submission.status === 'POSTED';

  // Check if posting links are required for this campaign type
  const requiresPostingLink =
    (campaign?.campaignType || submission.campaign?.campaignType) !== 'ugc';

  const needsPostingLink = isApproved && !submission.content && requiresPostingLink;
  const hasPostingLink = Boolean(submission.content);
  // Check if posting link was rejected (status is REJECTED and content was cleared, but video exists)
  const isPostingLinkRejected =
    submission.status === 'REJECTED' && !submission.content && submission.video?.length > 0;
  const isPostingLinkEditable = (needsPostingLink || isPostingLinkRejected) && requiresPostingLink;

  // Show submitted video only if not in reupload mode - memoized to prevent blinking
  const videoToShow = useMemo(() => {
    return isReuploadMode ? null : submittedVideo;
  }, [isReuploadMode, submittedVideo]);

  // Determine if caption should be editable
  const isCaptionEditable = useMemo(() => {
    // Editable if: in reupload mode OR no video has been submitted yet OR just uploaded locally
    return isReuploadMode || !submittedVideo || (!hasSubmitted && selectedFiles.length > 0);
  }, [isReuploadMode, submittedVideo, hasSubmitted, selectedFiles.length]);

  // Memoize feedback filtering to avoid recalculation - only show the most recent feedback for this submission
  const relevantFeedback = useMemo(() => {
    if (!submission.feedback?.length) return [];

    // Filter feedback that is sent to creator
    const sentFeedback = submission.feedback.filter((feedback) => feedback.sentToCreator);

    // If we have feedback with matching submissionId, use those
    const matchingFeedback = sentFeedback.filter(
      (feedback) => feedback.submissionId === submission.id
    );

    if (matchingFeedback.length > 0) {
      // Sort by creation date and take only the most recent one
      const sortedFeedback = matchingFeedback.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      return [sortedFeedback[0]];
    }

    // Fallback: if no submissionId match, show only the most recent feedback overall
    if (sentFeedback.length > 0) {
      const sortedFeedback = sentFeedback.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      return [sortedFeedback[0]];
    }

    return [];
  }, [submission.feedback, submission.id]);

  const handleReupload = () => {
    if (isPostingLinkRejected) {
      // For posting link rejection, don't enter reupload mode - just allow posting link editing
      // The posting link field will become editable due to isPostingLinkRejected being true
      return;
    }

    // For content rejection, enter full reupload mode
    setIsReuploadMode(true);
    setSelectedFiles([]);
    setHasSubmitted(false); // Reset submitted state to allow editing
    // Keep the existing caption for editing
  };

  // Memoized caption change handler to prevent unnecessary re-renders
  const handleCaptionChange = useCallback((e) => {
    setCaption(e.target.value);
  }, []);

  // Memoized file change handler to prevent unnecessary re-renders
  const handleFilesChange = useCallback((files) => {
    setSelectedFiles(files);
  }, []);

  const handleReuploadMode = useCallback(() => {
    setIsReuploadMode(true);
    setSelectedFiles([]);
  }, []);

  const handleSubmitPostingLink = useCallback(async () => {
    if (!postingLink.trim()) {
      enqueueSnackbar('Please enter a posting link', { variant: 'error' });
      return;
    }

    try {
      setPostingLinkLoading(true);
      await axiosInstance.put(endpoints.submission.creator.v4.updatePostingLink, {
        submissionId: submission.id,
        postingLink: postingLink.trim(),
      });

      enqueueSnackbar('Posting link submitted successfully', { variant: 'success' });
      onUpdate();
    } catch (error) {
      console.error('Error submitting posting link:', error);
      enqueueSnackbar(error.message || 'Failed to submit posting link', { variant: 'error' });
    } finally {
      setPostingLinkLoading(false);
    }
  }, [postingLink, submission.id, onUpdate, enqueueSnackbar]);

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one video file', { variant: 'error' });
      return;
    }

    if (!caption.trim()) {
      enqueueSnackbar('Please enter a caption', { variant: 'error' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Add form data as JSON string (following v3 pattern)
      const requestData = {
        submissionId: submission.id,
        caption: caption.trim(),
      };
      formData.append('data', JSON.stringify(requestData));

      // Add video files
      selectedFiles.forEach((file) => {
        formData.append('videos', file);
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

      enqueueSnackbar('Videos uploaded successfully and are being processed!', {
        variant: 'success',
      });
      onUpdate();
      setIsReuploadMode(false); // Reset reupload mode after successful submission
      setHasSubmitted(true); // Mark as submitted to disable editing
      // Keep selectedFiles so video preview remains visible
      // setSelectedFiles([]);
      // setCaption(''); // Keep caption too
    } catch (error) {
      console.error('Submit error:', error);
      enqueueSnackbar(error.message || 'Failed to upload videos', { variant: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

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
          <CustomV4Upload
            files={selectedFiles}
            onFilesChange={handleFilesChange}
            disabled={uploading}
            submissionId={submission.id}
            submittedVideo={videoToShow}
            accept="video/*"
            maxSize={500 * 1024 * 1024}
            fileTypes="MP4, MOV, AVI, MKV, WEBM"
            height={420} // Will handle responsive height in component
          />
        </Box>

        {/* Caption and Feedback - Responsive positioning */}
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
              mt: 2,
            },
          }}
        >
          {/* Caption Field */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                fontWeight: 500,
                fontFamily:
                  'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#636366',
              }}
            >
              Post Caption <span style={{ color: 'red' }}>*</span>
            </Typography>

            {isCaptionEditable ? (
              // Show editable TextField when caption can be edited
              <TextField
                fullWidth
                multiline
                rows={{ xs: 4, md: 3 }} // More rows on mobile for better usability
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Type your caption here..."
                disabled={uploading}
                sx={{
                  maxWidth: '100%', // Prevent overflow
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    wordWrap: 'break-word', // Handle long words
                    overflowWrap: 'break-word',
                  },
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

          {/* Feedback Section - Responsive positioning with better overflow handling */}
          {hasChangesRequired && relevantFeedback.length > 0 && (
            <Card
              sx={{
                p: { xs: 1, md: 1 }, // Reduced padding to move content left
                pl: { xs: 0, md: 0 }, // Remove left padding completely
                bgcolor: 'transparent',
                boxShadow: 'none',
                border: 'none',
                mt: { xs: 1, md: 2 }, // Start higher on desktop to use empty space above
                maxHeight: { xs: 'auto', md: '220px' }, // Reduced height to prevent overlap with button
                overflowY: { xs: 'visible', md: 'auto' }, // Add scroll on desktop if needed
                mb: { xs: 0, md: 8 }, // Add bottom margin to create space above the button
                position: { xs: 'static', md: 'relative' },
                // Ensure it doesn't overflow the parent container
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                // Custom scrollbar styling for better appearance
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '3px',
                  '&:hover': {
                    background: '#a8a8a8',
                  },
                },
                // Removed the white shadow (::after pseudo-element)
              }}
            >
              <Stack spacing={2}>
                {relevantFeedback.map((feedback, index) => (
                  <Stack key={index} spacing={1}>
                    {/* Reasons on top */}
                    {feedback.reasons?.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        {feedback.reasons.map((reason, i) => (
                          <Typography
                            key={i}
                            variant="caption"
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              fontWeight: 600,
                              border: '1px solid',
                              borderBottom: '3px solid',
                              borderRadius: 0.8,
                              bgcolor: 'white',
                              whiteSpace: 'nowrap',
                              color: '#FF4842',
                              borderColor: '#FF4842',
                              fontSize: '0.75rem',
                              fontFamily:
                                'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              // Ensure reasons wrap properly on smaller screens
                              maxWidth: '100%',
                              wordBreak: 'break-word',
                            }}
                          >
                            {reason}
                          </Typography>
                        ))}
                      </Stack>
                    )}

                    {/* CS Feedback title and content */}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily:
                          'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        color: '#636366',
                        fontWeight: 600,
                        mt: feedback.reasons?.length > 0 ? 0.5 : 0,
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
                        // Ensure text wraps properly and doesn't overflow
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        maxWidth: '100%',
                      }}
                    >
                      {feedback.content}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          )}
        </Box>
      </Box>

      {/* Submit Button - Responsive Position */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: { xs: 'center', md: 'flex-end' },
          alignItems: 'center',
          mt: { xs: 2, md: -6 },
          position: 'relative',
          zIndex: 10,
        }}
      >
        {uploading && (
          <Box sx={{ flex: 1, mr: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Uploading videos... {Math.round(uploadProgress)}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}
        
        <Typography
          component="button"
          onClick={
            isReuploadButton
              ? handleReupload
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
            outline: 'none',
            '&:disabled': {
              bgcolor: '#BDBDBD',
              borderColor: '#BDBDBD',
              color: 'white',
              cursor: 'not-allowed',
            },
          }}
        >
          {uploading
            ? 'Uploading...'
            : postingLoading
              ? 'Submitting...'
              : isReuploadButton
                ? 'Reupload Draft'
                : isSubmitButton
                  ? 'Submit'
                  : !postingLoading ? 'Submit' : 'Submitted'}
        </Typography>
      </Box>
    </Box>
  );
};

V4VideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  campaign: PropTypes.object,
};

export default V4VideoSubmission;
