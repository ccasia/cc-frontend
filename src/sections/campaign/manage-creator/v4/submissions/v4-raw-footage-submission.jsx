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
  Grid
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';

// File upload configuration for raw footage
const RAW_FOOTAGE_UPLOAD_CONFIG = {
  accept: {
    'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
  },
  maxSize: 500 * 1024 * 1024, // 500MB
  multiple: true
};

const V4RawFootageSubmission = ({ submission, onUpdate }) => {
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
      enqueueSnackbar('Please select at least one raw footage file', { variant: 'error' });
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

      // Add raw footage files
      selectedFiles.forEach((file) => {
        formData.append('rawFootages', file);
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

      enqueueSnackbar('Raw footage uploaded successfully and is being processed!', { variant: 'success' });
      onUpdate();
      setSelectedFiles([]);
      setCaption('');
      
    } catch (error) {
      console.error('Submit error:', error);
      enqueueSnackbar(
        error.message || 'Failed to upload raw footage', 
        { variant: 'error' }
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const isSubmitted = submission.rawFootages?.some(r => r.url);
  const hasChangesRequired = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="eva:film-fill" width={24} />
          <Typography variant="h6">Raw Footage Collection</Typography>
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
            🎉 Your raw footage has been approved! Great work!
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
            ⏳ Your raw footage is being reviewed. We'll notify you once feedback is available.
          </Typography>
        </Alert>
      )}

      {/* Existing Content */}
      {submission.rawFootages?.length > 0 && (
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Submissions ({submission.rawFootages.length} files):
          </Typography>
          <Grid container spacing={2}>
            {submission.rawFootages.map((rawFootage, index) => (
              <Grid item xs={12} sm={6} md={4} key={rawFootage.id}>
                <Card sx={{ p: 2, height: '100%' }}>
                  <Stack spacing={1} height="100%">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="eva:film-outline" />
                      <Typography variant="caption">Footage {index + 1}</Typography>
                    </Stack>
                    <Box flex={1}>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {rawFootage.url || 'No URL provided'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getCreatorStatusLabel(rawFootage.status)} 
                      color={getStatusColor(rawFootage.status)} 
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
      {submission.rawFootages?.some(r => r.feedback) && (
        <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
          <Typography variant="subtitle2" gutterBottom>
            Feedback:
          </Typography>
          <Stack spacing={2}>
            {submission.rawFootages.map((rawFootage, index) => 
              rawFootage.feedback && (
                <Box key={rawFootage.id}>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                    Footage {index + 1}:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {rawFootage.feedback}
                  </Typography>
                  {rawFootage.reasons?.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1, ml: 1 }}>
                      {rawFootage.reasons.map((reason, i) => (
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
              {isSubmitted ? 'Update Raw Footage' : 'Upload Raw Footage'}
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                🎬 Upload unedited, high-resolution video files. Include B-roll, alternative takes, and behind-the-scenes content that can be used for editing.
              </Typography>
            </Alert>

            {/* File Upload Area */}
            <Upload
              multiple
              files={selectedFiles}
              onDrop={handleDrop}
              onRemove={handleRemoveFile}
              onRemoveAll={handleRemoveAllFiles}
              accept={RAW_FOOTAGE_UPLOAD_CONFIG.accept}
              maxSize={RAW_FOOTAGE_UPLOAD_CONFIG.maxSize}
              disabled={uploading}
            />

            {/* Upload Guidelines */}
            <Alert severity="info">
              <Typography variant="body2">
                🎬 <strong>Raw Footage Guidelines:</strong>
                <br />• Maximum file size: 500MB per file
                <br />• Supported formats: MP4, MOV, AVI, MKV, WebM
                <br />• Upload unedited, high-resolution video files
                <br />• Include B-roll, alternative takes, behind-the-scenes content
              </Typography>
            </Alert>

            {/* Caption */}
            <TextField
              label="Notes/Description (Optional)"
              multiline
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your raw footage: what's included, technical specs, special shots, etc..."
              disabled={uploading}
            />

            {/* Technical Notes */}
            <Alert severity="info">
              <Typography variant="body2">
                💡 <strong>Tips for raw footage:</strong>
                <br />• Include multiple angles and takes
                <br />• Upload in highest quality available
                <br />• Organize files with clear naming
                <br />• Include any color grading or editing notes
              </Typography>
            </Alert>

            {/* Submit Button */}
            <Box>
              {uploading && (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Uploading raw footage... {Math.round(uploadProgress)}%
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
                {uploading ? 'Uploading...' : isSubmitted ? 'Update Raw Footage' : 'Submit Raw Footage'}
              </Button>
            </Box>
          </Stack>
        </Card>
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
    case 'CHANGES_REQUIRED':
    case 'REJECTED': return 'Changes Required';
    case 'SENT_TO_CLIENT': return 'In Review';
    default: return status;
  }
};

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default V4RawFootageSubmission;