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
  const [caption, setCaption] = useState(submission.caption || '');

  // Update caption when submission changes
  useEffect(() => {
    setCaption(submission.caption || '');
  }, [submission.caption]);

  // Memoize feedback filtering to avoid recalculation
  const relevantFeedback = useMemo(() => {
    return submission.feedback?.filter(feedback => feedback.sentToCreator) || [];
  }, [submission.feedback]);

  const handleDrop = (acceptedFiles, rejectedFiles) => {
    console.log('🎬 Raw Footage Upload Debug:');
    console.log('Accepted files:', acceptedFiles.length, acceptedFiles.map(f => f.name));
    console.log('Rejected files:', rejectedFiles.length, rejectedFiles);

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
      enqueueSnackbar('Please select at least one raw footage file', { variant: 'error' });
      return;
    }

    console.log('🚀 Starting raw footage upload:');
    console.log('Selected files count:', selectedFiles.length);
    console.log('Submission status:', submission.status);
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

      // Add raw footage files
      selectedFiles.forEach((file, index) => {
        console.log(`Adding file ${index + 1} to FormData:`, file.name);
        formData.append('rawFootages', file);
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
        ? 'Raw footage updated successfully!' 
        : 'Raw footage uploaded successfully!';
        
      enqueueSnackbar(successMessage, { variant: 'success' });
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
  // CLIENT_FEEDBACK means client gave feedback but admin hasn't forwarded it yet - creator still sees as "in review"
  // CHANGES_REQUIRED means admin has forwarded client feedback - creator can now see feedback and re-upload
  const isInReview = ['PENDING_REVIEW', 'SENT_TO_CLIENT', 'CLIENT_FEEDBACK'].includes(submission.status);
  const hasChangesRequired = ['CHANGES_REQUIRED', 'REJECTED'].includes(submission.status);
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
  
  // Check if any individual raw footage need revision (only show to creator if admin has forwarded the feedback)
  const hasIndividualRawFootageNeedingRevision = submission.rawFootages?.some(r => 
    ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)
  );
  
  // Creator can upload if not in final states and either hasn't submitted or has raw footage needing revision
  const canUpload = !isApproved && (!isInReview || hasIndividualRawFootageNeedingRevision || hasChangesRequired);

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

      {isApproved && (
        <Alert severity="success">
          <Typography variant="body2">
            🎉 Your raw footage has been approved! Great work!
          </Typography>
        </Alert>
      )}

      {(hasChangesRequired) && (
        <Alert severity="warning">
          <Typography variant="body2">
            Changes requested. Please review the feedback below and resubmit.
          </Typography>
        </Alert>
      )}

      {submission.status === 'CLIENT_FEEDBACK' && (
        <Alert severity="info">
          <Typography variant="body2">
            ⏳ Your raw footage is under client review. We'll notify you once feedback is available.
          </Typography>
        </Alert>
      )}

      {isInReview && submission.status !== 'CLIENT_FEEDBACK' && (
        <Alert severity="info">
          <Typography variant="body2">
            ⏳ Your raw footage is being reviewed. We'll notify you once feedback is available.
          </Typography>
        </Alert>
      )}

      {/* Existing Content - Don't show individual feedback if CLIENT_FEEDBACK (not yet forwarded by admin) */}
      {!isInReview && submission.rawFootages?.length > 0 && (
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Submissions ({submission.rawFootages.length} files):
          </Typography>
          
          {/* Raw Footage Horizontal Scroll Container */}
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
            {submission.rawFootages.map((rawFootage, index) => (
              <Box
                key={rawFootage.id}
                sx={{
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {rawFootage.url && (
                  <video
                    controls
                    style={{ width: 250, height: 355, objectFit: 'cover', borderRadius: 8 }}
                    src={rawFootage.url}
                  >
                    <track kind="captions" srcLang="en" label="English" />
                  </video>
                )}
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
              {hasIndividualRawFootageNeedingRevision ? 
                'Re-upload Raw Footage' : 
                isSubmitted ? 'Update Raw Footage' : 'Upload Raw Footage'}
            </Typography>
            
            {hasIndividualRawFootageNeedingRevision && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  📝 Some raw footage needs changes. Upload new files to replace all existing raw footage.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Note: All new files will replace your current raw footage submission.
                </Typography>
              </Alert>
            )}

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


            {/* Caption */}
            <TextField
              label={submission.caption ? "Update Caption" : "Caption"}
              multiline
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your raw footage: what's included, technical specs, special shots, etc..."
              disabled={uploading}
            />

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
                {uploading ? 'Uploading...' : 
                 hasIndividualRawFootageNeedingRevision ? 'Re-submit Raw Footage' :
                 isSubmitted ? 'Update Raw Footage' : 'Submit Raw Footage'}
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

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default V4RawFootageSubmission;