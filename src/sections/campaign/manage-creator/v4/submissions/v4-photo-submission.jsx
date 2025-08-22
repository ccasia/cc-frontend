import React, { useState } from 'react';
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
  Grid,
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
  const [caption, setCaption] = useState('');
  const [postingDialog, setPostingDialog] = useState(false);
  const [postingLink, setPostingLink] = useState('');
  const [postingLoading, setPostingLoading] = useState(false);

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
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
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
      selectedFiles.forEach((file) => {
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

      enqueueSnackbar('Photos uploaded successfully!', { variant: 'success' });
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
  const hasChangesRequired = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
  const isPosted = submission.status === 'POSTED';
  const hasPostingLink = Boolean(submission.content);
  const hasPendingPostingLink = hasPostingLink && isApproved && !isPosted;

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

      {submission.status === 'PENDING_REVIEW' && (
        <Alert severity="info">
          <Typography variant="body2">
            ⏳ Your photos are being reviewed. We'll notify you once feedback is available.
          </Typography>
        </Alert>
      )}

      {/* Existing Content */}
      {submission.photos?.length > 0 && (
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Submissions ({submission.photos.length} photos):
          </Typography>
          <Grid container spacing={2}>
            {submission.photos.map((photo, index) => (
              <Grid item xs={12} sm={6} md={4} key={photo.id}>
                <Card sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={1} height="100%">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="eva:image-outline" />
                      <Typography variant="caption">Photo {index + 1}</Typography>
                    </Stack>
                    <Box flex={1}>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {photo.url || 'No URL provided'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getCreatorStatusLabel(photo.status)} 
                      color={getStatusColor(photo.status)} 
                      size="small" 
                    />
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {/* Feedback */}
      {submission.photos?.some(p => p.feedback) && (
        <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
          <Typography variant="subtitle2" gutterBottom>
            Feedback:
          </Typography>
          <Stack spacing={2}>
            {submission.photos.map((photo, index) => 
              photo.feedback && (
                <Box key={photo.id}>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                    Photo {index + 1}:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {photo.feedback}
                  </Typography>
                  {photo.reasons?.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1, ml: 1 }}>
                      {photo.reasons.map((reason, i) => (
                        <Chip key={i} label={reason} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  )}
                </Box>
              )
            )}
          </Stack>
        </Card>
      )}

      {/* Upload Form */}
      {(!isApproved) && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography variant="subtitle1">
              {isSubmitted ? 'Update Photos' : 'Upload Photos'}
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                📸 Upload multiple high-quality photos. Recommended: landscape shots, product close-ups, lifestyle images, and behind-the-scenes content.
              </Typography>
            </Alert>

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

            {/* Upload Guidelines */}
            <Alert severity="info">
              <Typography variant="body2">
                📸 <strong>Photo Guidelines:</strong>
                <br />• Maximum file size: 50MB per photo
                <br />• Supported formats: JPG, PNG, GIF, WebP, HEIC
                <br />• Upload multiple high-quality photos
                <br />• Recommended: landscape shots, product close-ups, lifestyle images
              </Typography>
            </Alert>

            {/* Caption */}
            <TextField
              label="Caption/Notes (Optional)"
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
                  ? "✅ Your posting link has been approved and is now live!"
                  : "🔗 Add the social media post URL where this photo was published (TikTok, Instagram, YouTube, etc.)"
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
                  No posting link added yet. Click "Add Link" to share where you published this video.
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
    case 'REJECTED': return 'error';
    case 'SENT_TO_CLIENT': return 'secondary';
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
    case 'REJECTED': return 'Changes Required';
    case 'SENT_TO_CLIENT': return 'In Review';
    default: return status;
  }
};

V4PhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default V4PhotoSubmission;