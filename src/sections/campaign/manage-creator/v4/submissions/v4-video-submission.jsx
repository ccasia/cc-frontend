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
  Chip
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';

// File upload configuration for videos
const VIDEO_UPLOAD_CONFIG = {
  accept: {
    'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
  },
  maxSize: 500 * 1024 * 1024, // 500MB
  multiple: true
};

const V4VideoSubmission = ({ submission, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');

  const handleDrop = (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejection) => {
        rejection.errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            enqueueSnackbar('File is too large. Maximum size is 500MB', { variant: 'error' });
          } else if (error.code === 'file-invalid-type') {
            enqueueSnackbar('Invalid file type. Please upload video files only', { variant: 'error' });
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
      enqueueSnackbar('Please select at least one video file', { variant: 'error' });
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

      enqueueSnackbar('Videos uploaded successfully and are being processed!', { variant: 'success' });
      onUpdate();
      setSelectedFiles([]);
      setCaption('');
      
    } catch (error) {
      console.error('Submit error:', error);
      enqueueSnackbar(
        error.message || 'Failed to upload videos', 
        { variant: 'error' }
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const isSubmitted = submission.video?.some(v => v.url);
  const hasChangesRequired = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="eva:video-fill" width={24} />
          <Typography variant="h6">
            Video {submission.contentOrder || 1}
          </Typography>
          <Chip 
            label={getCreatorStatusLabel(submission.status)} 
            color={getStatusColor(submission.status)} 
            size="small" 
          />
        </Stack>
      </Stack>

      {/* Status Messages */}
      {isApproved && (
        <Alert severity="success">
          <Typography variant="body2">
            🎉 Your video has been approved! Great work!
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
            ⏳ Your video is being reviewed by admin. We'll notify you once feedback is available.
          </Typography>
        </Alert>
      )}

      {submission.status === 'SENT_TO_CLIENT' && (
        <Alert severity="info">
          <Typography variant="body2">
            👨‍💼 Your video has been approved by admin and sent to client for review.
          </Typography>
        </Alert>
      )}

      {submission.status === 'CLIENT_FEEDBACK' && (
        <Alert severity="warning">
          <Typography variant="body2">
            🗣️ Client has provided feedback. Admin will review and provide guidance shortly.
          </Typography>
        </Alert>
      )}

      {/* Existing Content */}
      {submission.video?.length > 0 && (
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Submissions:
          </Typography>
          <Stack spacing={1}>
            {submission.video.map((video) => (
              <Stack key={video.id} direction="row" alignItems="center" spacing={2}>
                <Iconify icon="eva:video-outline" />
                <Box flex={1}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {video.url || 'No URL provided'}
                  </Typography>
                </Box>
                <Chip 
                  label={getCreatorStatusLabel(video.status)} 
                  color={getStatusColor(video.status)} 
                  size="small" 
                />
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {/* Feedback */}
      {submission.video?.some(v => v.feedback) && (
        <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
          <Typography variant="subtitle2" gutterBottom>
            Feedback:
          </Typography>
          {submission.video.map((video, index) => 
            video.feedback && (
              <Stack key={video.id} spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Video {index + 1}: {video.feedback}
                </Typography>
                {video.reasons?.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {video.reasons.map((reason, i) => (
                      <Chip key={i} label={reason} size="small" variant="outlined" />
                    ))}
                  </Stack>
                )}
              </Stack>
            )
          )}
        </Card>
      )}

      {/* Upload Form */}
      {(!isApproved) && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography variant="subtitle1">
              {isSubmitted ? 'Update Video' : 'Upload Video'}
            </Typography>

            {/* File Upload Area */}
            <Upload
              multiple
              files={selectedFiles}
              onDrop={handleDrop}
              onRemove={handleRemoveFile}
              onRemoveAll={handleRemoveAllFiles}
              accept={VIDEO_UPLOAD_CONFIG.accept}
              maxSize={VIDEO_UPLOAD_CONFIG.maxSize}
              disabled={uploading}
            />

            {/* Upload Guidelines */}
            <Alert severity="info">
              <Typography variant="body2">
                📹 <strong>Video Guidelines:</strong>
                <br />• Maximum file size: 500MB per video
                <br />• Supported formats: MP4, MOV, AVI, MKV, WebM
                <br />• Upload multiple videos if required for this submission
                <br />• Videos will be compressed and optimized automatically
              </Typography>
            </Alert>

            {/* Caption */}
            <TextField
              label="Caption/Notes (Optional)"
              multiline
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add any notes or caption for your videos..."
              disabled={uploading}
            />

            {/* Submit Button */}
            <Box>
              {uploading && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Uploading videos... {Math.round(uploadProgress)}%
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
                {uploading ? 'Uploading...' : isSubmitted ? 'Update Videos' : 'Submit Videos'}
              </Button>
            </Box>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

// Helper functions with v4 client feedback support
const getStatusColor = (status) => {
  switch (status) {
    case 'IN_PROGRESS': return 'info';
    case 'PENDING_REVIEW': return 'warning';
    case 'APPROVED':
    case 'CLIENT_APPROVED': return 'success';
    case 'CHANGES_REQUIRED':
    case 'REJECTED': return 'error';
    case 'SENT_TO_CLIENT': return 'secondary';
    case 'CLIENT_FEEDBACK': return 'warning';
    default: return 'default';
  }
};

const getCreatorStatusLabel = (status) => {
  switch (status) {
    case 'IN_PROGRESS': return 'In Progress';
    case 'PENDING_REVIEW': return 'In Review';
    case 'APPROVED': return 'Approved';
    case 'CLIENT_APPROVED': return 'Approved';
    case 'CHANGES_REQUIRED': return 'Changes Required';
    case 'REJECTED': return 'Changes Required';
    case 'SENT_TO_CLIENT': return 'Client Review';
    case 'CLIENT_FEEDBACK': return 'Client Review';
    default: return status;
  }
};

V4VideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default V4VideoSubmission;