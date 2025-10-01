import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Stack,
  TextField,
  Typography,
  LinearProgress,
  Alert,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import CustomV4Upload from 'src/components/upload/custom-v4-upload';
import ImageGridDisplay from 'src/components/upload/image-grid-display';

// File upload configuration for photos
const PHOTO_UPLOAD_CONFIG = {
  accept: {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic']
  },
  maxSize: 50 * 1024 * 1024, // 50MB
  multiple: true
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
    return isReuploadMode || submittedPhotos.length === 0 || (!hasSubmitted && selectedFiles.length > 0) || hasChangesRequired;
  }, [isReuploadMode, submittedPhotos.length, hasSubmitted, selectedFiles.length, hasChangesRequired]);

  // Determine what photos to display in the upload area
  const photosToDisplay = useMemo(() => {
    if (isReuploadMode || selectedFiles.length > 0) {
      return selectedFiles; // Show local files when reuploading or uploading
    }
    if (submittedPhotos.length > 0) {
      return submittedPhotos; // Show submitted photos always when they exist
    }
    return []; // Show upload box when no photos
  }, [isReuploadMode, selectedFiles, submittedPhotos]);

  // Memoize feedback filtering to avoid recalculation
  const relevantFeedback = useMemo(() => {
    return submission.feedback?.filter(feedback => feedback.sentToCreator) || [];
  }, [submission.feedback]);

  // Memoized caption change handler to prevent image re-renders
  const handleCaptionChange = useCallback((e) => {
    setCaption(e.target.value);
  }, []);

  // Memoized file change handlers to prevent image re-renders
  const handleFilesChange = useCallback((files) => {
    setSelectedFiles(files);
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAdditionalFilesChange = useCallback((newFiles) => {
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Check if posting link was rejected (status is REJECTED and content was cleared, but photos exist)
  const isPostingLinkRejected = submission.status === 'REJECTED' && !submission.content && submission.photos?.length > 0;

  // Handle reupload mode
  const handleReuploadMode = useCallback(() => {
    if (isPostingLinkRejected) {
      // For posting link rejection, don't enter reupload mode - just allow posting link editing
      // The posting link field will become editable due to isPostingLinkRejected being true
      return;
    }
    
    // For content rejection, enter full reupload mode
    setIsReuploadMode(true);
    // Keep submitted photos as selected files so they remain visible with X buttons
    setSelectedFiles(submittedPhotos);
    setHasSubmitted(false); // Reset submitted state
  }, [submittedPhotos, isPostingLinkRejected]);

  // Memoize selectedFiles to prevent unnecessary re-renders
  const memoizedSelectedFiles = useMemo(() => selectedFiles, [selectedFiles]);

  const handleDrop = (acceptedFiles, rejectedFiles) => {

    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejection) => {
        rejection.errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            enqueueSnackbar('File is too large. Maximum size is 50MB', { variant: 'error' });
          } else if (error.code === 'file-invalid-type') {
            enqueueSnackbar('Invalid file type. Please upload image files only', { variant: 'error' });
          } else {
            enqueueSnackbar(error.message, { variant: 'error' });
          }
        });
      });
    }

    if (acceptedFiles.length > 0) {
      setSelectedFiles(prev => {
        const newFiles = [...prev, ...acceptedFiles];
        return newFiles;
      });
    }
  };



  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one photo file', { variant: 'error' });
      return;
    }

    // For reupload mode, check if there are meaningful changes
    if (isReuploadMode) {
      const newFiles = selectedFiles.filter(file => file instanceof File);
      const existingPhotos = selectedFiles.filter(file => file && typeof file === 'object' && file.url && file.id);
      const originalPhotoCount = submittedPhotos.length;
      
      // Check if there are any changes: new files added OR photos removed OR caption changed
      const hasNewFiles = newFiles.length > 0;
      const hasRemovedPhotos = existingPhotos.length < originalPhotoCount;
      const hasCaptionChange = caption.trim() !== (submission.caption || '').trim();
      
      if (!hasNewFiles && !hasRemovedPhotos && !hasCaptionChange) {
        enqueueSnackbar('No changes detected. Please add new photos, remove existing ones, or update the caption.', { variant: 'warning' });
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
      
      // Separate existing photos (API objects with URLs) from new files (File objects)
      const existingPhotos = selectedFiles.filter(file => file && typeof file === 'object' && file.url && file.id);
      const newFiles = selectedFiles.filter(file => file instanceof File);
      
      // Add form data as JSON string with selective update information
      const requestData = {
        submissionId: submission.id,
        caption: caption.trim(),
        isSelectiveUpdate: isReupload, // Flag for selective update vs full replacement
        keepExistingPhotos: existingPhotos.map(photo => ({
          id: photo.id,
          url: photo.url
        }))
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
      const uploadedFiles = selectedFiles.filter(file => file instanceof File);
      const keptPhotos = selectedFiles.filter(file => file && typeof file === 'object' && file.url && file.id);
      
      let successMessage;
      if (isUpdate) {
        if (uploadedFiles.length > 0 && keptPhotos.length > 0) {
          successMessage = `Photos updated successfully! Added ${uploadedFiles.length} new photo(s), kept ${keptPhotos.length} existing photo(s).`;
        } else if (uploadedFiles.length > 0) {
          successMessage = `${uploadedFiles.length} new photo(s) added successfully!`;
        } else {
          successMessage = 'Photos updated successfully!';
        }
      } else {
        successMessage = 'Photos uploaded successfully!';
      }
        
      enqueueSnackbar(successMessage, { variant: 'success' });
      
      onUpdate();
      // Keep selectedFiles so preview remains visible
      // setSelectedFiles([]);
      // setCaption(''); // Keep caption too
      
    } catch (error) {
      console.error('Submit error:', error);
      setHasSubmitted(false); // Reset submitted state on error
      enqueueSnackbar(
        error.message || 'Failed to upload photos', 
        { variant: 'error' }
      );
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


  const isSubmitted = submission.photos?.some(p => p.url);
  const isInReview = ['PENDING_REVIEW', 'SENT_TO_CLIENT', 'CLIENT_FEEDBACK'].includes(submission.status);
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
  const isPosted = submission.status === 'POSTED';
  const hasPostingLink = Boolean(submission.content);
  const hasPendingPostingLink = hasPostingLink && isApproved && !isPosted;
  const needsPostingLink = isApproved && !submission.content;
  const isPostingLinkEditable = needsPostingLink || isPostingLinkRejected;
  
  // Check if posting links are required for this campaign type
  const requiresPostingLink = (campaign?.campaignType || submission.campaign?.campaignType) !== 'ugc';
  
  // Creator can upload if not in final states (but not for posting link rejection) - always show upload form to display photos
  // Also show when approved to display submitted photos and posting link field
  const canUpload = !isPosted;
  
  // Always show content if there are submitted photos, regardless of status
  const shouldShowContent = canUpload || submittedPhotos.length > 0;

  return (
    <Stack spacing={3}>

      {/* Status Messages */}








      {/* Upload Form - Same design as Draft Videos */}
      {shouldShowContent && (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Main Content - Responsive Layout */}
          <Box sx={{ 
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
            }
          }}>
            {/* Upload Area - Responsive width */}
            <Box sx={{ 
              width: { xs: '100%', md: '65%' }, // Full width on mobile, 65% on desktop
              maxWidth: '100%', // Prevent overflow
              order: { xs: 1, md: 1 }, // First on both mobile and desktop
              // Adjust for smaller desktop screens
              '@media (max-width: 1200px)': {
                width: '100%',
              }
            }}>
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
                 <ImageGridDisplay
                   files={photosToDisplay}
                   onRemoveImage={(isReuploadMode || selectedFiles.length > 0) && isCaptionEditable ? handleRemoveImage : null}
                   height={{ xs: 320, md: 480 }}
                 />
               )}
            </Box>

            {/* Caption Area - Responsive positioning */}
            <Box sx={{ 
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
              }
            }}>
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

                {/* Posting Link Field - Simple implementation */}
                {requiresPostingLink && (isApproved || isPosted || isPostingLinkRejected) && (
                  <>
                    <Typography variant="body2" sx={{
                      mt: 2,
                      mb: 1, 
                      fontWeight: 500,
                      fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#636366'
                    }}>
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
                          }
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
                          fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                          }
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
                            fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                      fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                      fontFamily: 'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', md: 'flex-end' }, // Center on mobile, right-aligned on desktop
            alignItems: 'center', 
            mt: { xs: 2, md: -6 }, // Normal spacing on mobile, negative margin on desktop
            position: 'relative', 
            zIndex: 10 
          }}>
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
              onClick={hasChangesRequired && !isReuploadMode && !isPostingLinkRejected ? handleReuploadMode : 
                      (isPostingLinkEditable && !selectedFiles.length) ? handleSubmitPostingLink : 
                      handleSubmit}
              disabled={uploading || 
                       (!isPostingLinkEditable && selectedFiles.length === 0 && !hasChangesRequired && !isReuploadMode) || 
                       (!isCaptionEditable && !hasChangesRequired && !isReuploadMode && !isPostingLinkEditable) ||
                       (isPostingLinkEditable && !selectedFiles.length && !postingLink.trim()) ||
                       (!isPostingLinkEditable && hasPostingLink && !selectedFiles.length && !hasChangesRequired && !isReuploadMode)}
              sx={{
                px: 2,
                py: 1,
                fontWeight: 600,
                border: '1px solid',
                borderBottom: '3px solid',
                borderRadius: 0.8,
                bgcolor: hasChangesRequired ? '#1340FF' : (!isCaptionEditable && !hasChangesRequired ? '#BDBDBD' : '#3a3a3c'),
                color: 'white',
                borderColor: hasChangesRequired ? '#1340FF' : (!isCaptionEditable && !hasChangesRequired ? '#BDBDBD' : '#3a3a3c'),
                textTransform: 'none',
                fontSize: '0.75rem',
                minWidth: '80px',
                height: '32px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (uploading || (selectedFiles.length === 0 && !hasChangesRequired) || (!isCaptionEditable && !hasChangesRequired)) ? 'not-allowed' : 'pointer',
                '&:hover': (!uploading && ((selectedFiles.length > 0) || hasChangesRequired) && isCaptionEditable) ? {
                  bgcolor: '#1340FF',
                  borderColor: '#1340FF',
                } : {},
                '&:disabled': {
                  bgcolor: '#BDBDBD',
                  borderColor: '#BDBDBD',
                  color: '#9E9E9E',
                  cursor: 'not-allowed',
                }
              }}
            >
              {uploading ? 'Uploading...' : 
               postingLoading ? 'Submitting...' :
               (hasChangesRequired && !isReuploadMode && !isPostingLinkRejected) ? 'Reupload Photos' : 
               (isPostingLinkEditable && !selectedFiles.length) ? 'Submit' :
               (!isPostingLinkEditable && hasPostingLink && !selectedFiles.length && !hasChangesRequired) ? 'Submitted' :
               (!isCaptionEditable && submittedPhotos.length > 0 && !hasChangesRequired && !isPostingLinkEditable) ? 'Submitted' : 
               'Submit'}
                </Typography>
          </Box>
            </Box>
      )}


    </Stack>
  );
};

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'IN_PROGRESS': return 'info';
    case 'PENDING_REVIEW': return 'warning';
    case 'APPROVED':
    case 'CLIENT_APPROVED': return 'success';
    case 'POSTED': return 'success';
    case 'CHANGES_REQUIRED':
    case 'REJECTED':
    case 'REVISION_REQUESTED': return 'error';
    case 'SENT_TO_CLIENT':
    case 'CLIENT_FEEDBACK': return 'secondary';
    default: return 'default';
  }
};

const getCreatorStatusLabel = (status) => {
  switch (status) {
    case 'IN_PROGRESS': return 'In Progress';
    case 'PENDING_REVIEW': return 'In Review';
    case 'APPROVED':
    case 'CLIENT_APPROVED': return 'Approved';
    case 'POSTED': return 'Posted';
    case 'CHANGES_REQUIRED':
    case 'REJECTED':
    case 'REVISION_REQUESTED': return 'Changes Required';
    case 'SENT_TO_CLIENT': return 'In Review';
    case 'CLIENT_FEEDBACK': return 'Client Reviewing';
    default: return status;
  }
};

V4PhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  campaign: PropTypes.object,
};

export default V4PhotoSubmission;