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
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';

// File upload configuration for photos
const PHOTO_UPLOAD_CONFIG = {
  accept: {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic']
  },
  maxSize: 50 * 1024 * 1024, // 50MB
  multiple: true
};

const V4PhotoSubmission = ({ submission, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState(submission.caption || '');
  const [postingDialog, setPostingDialog] = useState(false);
  const [postingLink, setPostingLink] = useState('');
  const [postingLoading, setPostingLoading] = useState(false);
  // Update caption when submission changes
  useEffect(() => {
    setCaption(submission.caption || '');
  }, [submission.caption]);

  // Memoize feedback filtering to avoid recalculation
  const relevantFeedback = useMemo(() => {
    return submission.feedback?.filter(feedback => feedback.sentToCreator) || [];
  }, [submission.feedback]);

  const handleDrop = (acceptedFiles, rejectedFiles) => {
    console.log('📸 Photo Upload Debug:');
    console.log('Accepted files:', acceptedFiles.length, acceptedFiles.map(f => f.name));
    console.log('Rejected files:', rejectedFiles.length, rejectedFiles);

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
        console.log('Total selected files after drop:', newFiles.length, newFiles.map(f => f.name));
        return newFiles;
      });
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one photo file', { variant: 'error' });
      return;
    }

    const isReupload = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
    const existingPhotoCount = submission.photos?.length || 0;
    
    console.log('🚀 Starting photo upload:');
    console.log('Selected files count:', selectedFiles.length);
    console.log('Submission status:', submission.status);
    console.log('Is reupload:', isReupload ? 'YES - Will replace existing photos' : 'NO - Will add to existing photos');
    console.log('Existing photos:', existingPhotoCount);
    console.log('Selected files:', selectedFiles.map((f, i) => `${i + 1}. ${f.name} (${f.size} bytes)}`));

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      
      // Add form data as JSON string (following v3 pattern)
      const requestData = {
        submissionId: submission.id,
        caption: caption.trim()
      };
      formData.append('data', JSON.stringify(requestData));

      // Add photo files
      selectedFiles.forEach((file, index) => {
        console.log(`Adding file ${index + 1} to FormData:`, file.name);
        formData.append('photos', file);
      });

      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], ':', pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      }

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

      const successMessage = hasChangesRequired 
        ? 'Photos updated successfully!' 
        : 'Photos uploaded successfully!';
        
      enqueueSnackbar(successMessage, { variant: 'success' });
      onUpdate();
      setSelectedFiles([]);
      setCaption('');
      
    } catch (error) {
      console.error('Submit error:', error);
      enqueueSnackbar(
        error.message || 'Failed to upload photos', 
        { variant: 'error' }
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };


  const handleAddPostingLink = () => {
    setPostingLink(submission.content || '');
    setPostingDialog(true);
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
      setPostingDialog(false);
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
  const hasChangesRequired = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
  const isPosted = submission.status === 'POSTED';
  const hasPostingLink = Boolean(submission.content);
  const hasPendingPostingLink = hasPostingLink && isApproved && !isPosted;
  
  // Creator can upload if not in final states and has changes required or hasn't submitted
  const canUpload = !isApproved && !isPosted && (!isInReview || hasChangesRequired);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="eva:image-fill" width={24} />
          <Typography variant="h6">Photo Collection</Typography>
          <Chip 
            label={getCreatorStatusLabel(submission.status)} 
            color={getStatusColor(submission.status)} 
            size="small" 
          />
        </Stack>
      </Stack>

      {/* Status Messages */}
      {isPosted && (
        <Alert severity="success">
          <Typography variant="body2">
            🎉 Your photos have been posted! The posting link has been approved.
          </Typography>
        </Alert>
      )}

      {hasPendingPostingLink && (
        <Alert severity="info">
          <Typography variant="body2">
            ⏳ Your posting link is pending admin approval.
          </Typography>
        </Alert>
      )}

      {isApproved && !isPosted && (
        <Alert severity="success">
          <Typography variant="body2">
            🎉 Your photos have been approved! Great work!
          </Typography>
        </Alert>
      )}

      {hasChangesRequired && (
        <Alert severity="warning">
          <Typography variant="body2">
            📝 Changes requested. Please review the feedback below and resubmit.
          </Typography>
        </Alert>
      )}

      {isInReview && (
        <Alert severity="info">
          <Typography variant="body2">
            ⏳ Your photos are being reviewed. We'll notify you once feedback is available.
          </Typography>
        </Alert>
      )}

      {/* Existing Content */}
      {!isInReview && submission.photos?.length > 0 && (
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Submissions ({submission.photos.length} photos):
          </Typography>
          
          {/* Photo Horizontal Scroll Container */}
          <Box 
            sx={{ 
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              overflowY: 'hidden',
              bgcolor: 'background.neutral',
              p: 2,
              height: 385,
              alignItems: 'center',
              borderRadius: 1,
              '&::-webkit-scrollbar': {
                height: 8,
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
            {submission.photos.map((photo, photoIndex) => (
              <Box
                key={photo.id}
                sx={{
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={photo.url}
                  alt={`Photo ${photoIndex + 1}`}
                  sx={{
                    width: 250,
                    height: 355,
                    objectFit: 'cover',
                    borderRadius: 1,
                  }}
                />
              </Box>
            ))}
          </Box>
          {submission.caption && (
            <Card sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Caption:
              </Typography>
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Typography variant="body2">{submission.caption}</Typography>
              </Card>
            </Card>
          )}
        </Card>
      )}

      {/* Feedback */}
      {relevantFeedback.length > 0 && (
        <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
          <Typography variant="subtitle2" gutterBottom>
            Feedback:
          </Typography>
          <Stack spacing={2}>
            {relevantFeedback.map((feedback, index) => (
                <Stack key={index} spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ 
                      minWidth: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Typography variant="caption" sx={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>
                        {feedback.admin?.name?.charAt(0) || 'A'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" fontWeight="medium">
                      {feedback.admin?.name || 'Admin'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {feedback.content}
                  </Typography>
                  {feedback.reasons?.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {feedback.reasons.map((reason, i) => (
                        <Chip key={i} label={reason} size="small" variant="outlined" color="warning" />
                      ))}
                    </Stack>
                  )}
                </Stack>
              ))
            }
          </Stack>
        </Card>
      )}

      {/* Upload Form */}
      {canUpload && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography variant="subtitle1">
              {isSubmitted ? 'Update Photos' : 'Upload Photos'}
            </Typography>

            {/* File Upload Area */}
            <Upload
              multiple
              files={selectedFiles}
              onDrop={handleDrop}
              onRemove={handleRemoveFile}
              onRemoveAll={handleRemoveAllFiles}
              accept={PHOTO_UPLOAD_CONFIG.accept}
              maxSize={PHOTO_UPLOAD_CONFIG.maxSize}
              disabled={uploading}
            />

            {/* Caption */}
            <TextField
              label={submission.caption ? "Update Caption" : "Caption"}
              multiline
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add any notes about your photos, locations, concepts, etc..."
              disabled={uploading}
            />

            {/* Submit Button */}
            <Box>
              {uploading && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Uploading photos... {Math.round(uploadProgress)}%
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={uploading || selectedFiles.length === 0}
                startIcon={<Iconify icon="eva:upload-fill" />}
                size="large"
              >
                {uploading ? 'Uploading...' : isSubmitted ? 'Update Photos' : 'Submit Photos'}
              </Button>
            </Box>
          </Stack>
        </Card>
      )}

      {/* Posting Link Section */}
      {(isApproved || isPosted) && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1">
                Posting Link
                {hasPendingPostingLink && (
                  <Chip 
                    label="Pending Approval" 
                    size="small" 
                    color="warning" 
                    sx={{ ml: 1 }} 
                  />
                )}
                {isPosted && (
                  <Chip 
                    label="Posted" 
                    size="small" 
                    color="success" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
              {!isPosted && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAddPostingLink}
                  startIcon={<Iconify icon="eva:link-2-fill" />}
                >
                  {hasPostingLink ? 'Update Link' : 'Add Link'}
                </Button>
              )}
            </Stack>
            
            <Alert severity={hasPendingPostingLink ? "warning" : "info"}>
              <Typography variant="body2">
                {hasPendingPostingLink 
                  ? "⏳ Your posting link is waiting for admin approval before going live."
                  : isPosted
                  ? "✅ Your posting link has been approved."
                  : "🔗 Add the social media post URL where this video was published (TikTok, Instagram, YouTube, etc.)"
                }
              </Typography>
            </Alert>

            <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
              {hasPostingLink ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all' }}>
                    {submission.content}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => window.open(submission.content, '_blank')}
                  >
                    <Iconify icon="eva:external-link-fill" />
                  </IconButton>
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No posting link added yet. Click "Add Link" to share where you published these photos.
                </Typography>
              )}
            </Card>
          </Stack>
        </Card>
      )}

      {/* Posting Link Dialog */}
      <Dialog open={postingDialog} onClose={() => setPostingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {hasPostingLink ? 'Update Posting Link' : 'Add Posting Link'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Posting URL"
            value={postingLink}
            onChange={(e) => setPostingLink(e.target.value)}
            placeholder="https://www.tiktok.com/@username/video/123456789"
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Enter the social media post URL where this photo was published
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostingDialog(false)} disabled={postingLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitPostingLink}
            variant="contained"
            disabled={postingLoading}
          >
            {postingLoading ? 'Saving...' : 'Save Link'}
          </Button>
        </DialogActions>
      </Dialog>

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
};

export default V4PhotoSubmission;