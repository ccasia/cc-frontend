import React, { useState, useEffect } from 'react';
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
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [selectedRawFootageFeedback, setSelectedRawFootageFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Update caption when submission changes
  useEffect(() => {
    setCaption(submission.caption || '');
  }, [submission.caption]);

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

    // Check if creator needs to re-upload specific number of files
    const rawFootageNeedingChanges = submission.rawFootages?.filter(r => 
      ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)
    ) || [];
    
    if (rawFootageNeedingChanges.length > 0 && selectedFiles.length !== rawFootageNeedingChanges.length) {
      enqueueSnackbar(
        `You need to upload exactly ${rawFootageNeedingChanges.length} raw footage file${rawFootageNeedingChanges.length > 1 ? 's' : ''} to replace the rejected ones. Currently selected: ${selectedFiles.length}`,
        { variant: 'error' }
      );
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

      enqueueSnackbar('Raw footage uploaded successfully!', { variant: 'success' });
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


  const handleShowRawFootageFeedback = async (rawFootageId) => {
    try {
      setFeedbackLoading(true);
      setFeedbackDialog(true);
      
      const response = await axiosInstance.get(`/api/submissions/v4/content/feedback/rawFootage/${rawFootageId}`);
      setSelectedRawFootageFeedback(response.data);
    } catch (error) {
      console.error('Error fetching raw footage feedback:', error);
      enqueueSnackbar('Failed to load feedback', { variant: 'error' });
      setFeedbackDialog(false);
    } finally {
      setFeedbackLoading(false);
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

      {/* Status Messages */}
      {isApproved && (
        <Alert severity="success">
          <Typography variant="body2">
            🎉 Your raw footage has been approved! Great work!
          </Typography>
        </Alert>
      )}

      {(hasChangesRequired || hasIndividualRawFootageNeedingRevision) && (
        <Alert severity="warning">
          <Typography variant="body2">
            📝 {hasIndividualRawFootageNeedingRevision 
              ? 'Some raw footage needs changes. Please review the feedback for each file and re-upload as needed.'
              : 'Changes requested. Please review the feedback below and resubmit.'}
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
          <Grid container spacing={2}>
            {submission.rawFootages.map((rawFootage, index) => (
              <Grid item xs={12} sm={6} md={4} key={rawFootage.id}>
                <Card sx={{ height: '100%', overflow: 'hidden' }}>
                  {/* Raw Footage Preview */}
                  {rawFootage.url && (
                    <Box sx={{ position: 'relative', height: 160, bgcolor: 'background.neutral' }}>
                      <video
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        src={rawFootage.url}
                      >
                        <track kind="captions" srcLang="en" label="English" />
                      </video>
                    </Box>
                  )}
                  
                  <Box sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Iconify icon="eva:film-outline" />
                          <Typography variant="caption" fontWeight="medium">
                            Footage {index + 1}
                          </Typography>
                        </Stack>
                        <IconButton
                          size="small"
                          onClick={() => handleShowRawFootageFeedback(rawFootage.id)}
                          title="View feedback history"
                        >
                          <Iconify icon="eva:message-circle-outline" />
                        </IconButton>
                      </Stack>
                      
                      <Chip 
                        label={getCreatorStatusLabel(rawFootage.status)} 
                        color={getStatusColor(rawFootage.status)} 
                        size="small" 
                        variant="filled"
                      />

                      {/* Individual raw footage feedback - Only show if admin has forwarded it (status is CHANGES_REQUIRED) */}
                      {rawFootage.feedback && submission.status !== 'CLIENT_FEEDBACK' && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.neutral', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="medium">
                            Feedback:
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {rawFootage.feedback}
                          </Typography>
                          {rawFootage.reasons?.length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                              {rawFootage.reasons.map((reason, i) => (
                                <Chip key={i} label={reason} size="small" variant="outlined" color="warning" />
                              ))}
                            </Stack>
                          )}
                        </Box>
                      )}

                      {/* Upload status for rejected footage */}
                      {['REVISION_REQUESTED', 'REJECTED'].includes(rawFootage.status) && (
                        <Typography variant="caption" color="error" sx={{ fontStyle: 'italic' }}>
                          ⚠️ This file needs to be re-uploaded
                        </Typography>
                      )}
                      
                      {/* Approved status */}
                      {['APPROVED', 'CLIENT_APPROVED'].includes(rawFootage.status) && (
                        <Typography variant="caption" color="success.main" sx={{ fontStyle: 'italic' }}>
                          ✅ Approved
                        </Typography>
                      )}
                      
                      {/* In review status */}
                      {['PENDING_REVIEW', 'SENT_TO_CLIENT', 'CLIENT_FEEDBACK'].includes(rawFootage.status) && (
                        <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
                          ⏳ In review
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
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


      {/* Upload Form */}
      {canUpload && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography variant="subtitle1">
              {hasIndividualRawFootageNeedingRevision ? 
                `Re-upload Raw Footage (${submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0} files required)` : 
                isSubmitted ? 'Update Raw Footage' : 'Upload Raw Footage'}
            </Typography>
            
            {hasIndividualRawFootageNeedingRevision && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  ⚠️ You need to upload exactly {submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length} raw footage file{(submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0) > 1 ? 's' : ''} to replace the ones that need changes.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  📝 Files needing replacement: {submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).map((rawFootage) => `Footage ${(submission.rawFootages?.indexOf(rawFootage) || 0) + 1}`).join(', ')}
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

            {/* File count indicator for re-uploads */}
            {hasIndividualRawFootageNeedingRevision && (
              <Box sx={{ p: 2, bgcolor: selectedFiles.length === (submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0) ? 'success.lighter' : 'warning.lighter', borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify 
                    icon={selectedFiles.length === (submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0) ? 'eva:checkmark-circle-2-fill' : 'eva:alert-circle-fill'} 
                    sx={{ color: selectedFiles.length === (submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0) ? 'success.main' : 'warning.main' }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Files selected: {selectedFiles.length} / {submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0} required
                  </Typography>
                  {selectedFiles.length === (submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0) && (
                    <Chip label="Ready to submit" color="success" size="small" />
                  )}
                </Stack>
              </Box>
            )}

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
                disabled={uploading || selectedFiles.length === 0 || (hasIndividualRawFootageNeedingRevision && selectedFiles.length !== (submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0))}
                startIcon={<Iconify icon="eva:upload-fill" />}
                size="large"
              >
                {uploading ? 'Uploading...' : 
                 hasIndividualRawFootageNeedingRevision ? `Re-submit ${submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0} Raw Footage File${(submission.rawFootages?.filter(r => ['REVISION_REQUESTED', 'REJECTED'].includes(r.status)).length || 0) > 1 ? 's' : ''}` :
                 isSubmitted ? 'Update Raw Footage' : 'Submit Raw Footage'}
              </Button>
            </Box>
          </Stack>
        </Card>
      )}



      {/* Raw Footage Feedback History Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Iconify icon="eva:message-circle-fill" />
            <Typography variant="h6">
              Feedback History - Raw Footage
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {feedbackLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Loading feedback...</Typography>
            </Box>
          ) : selectedRawFootageFeedback ? (
            <Stack spacing={3}>
              {/* Raw Footage Info */}
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  {selectedRawFootageFeedback.rawFootage.url && (
                    <Box sx={{ width: 80, height: 60, bgcolor: 'background.paper', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Iconify icon="eva:film-fill" sx={{ color: 'text.disabled', fontSize: 24 }} />
                    </Box>
                  )}
                  <Box>
                    <Typography variant="subtitle2">
                      Current Status
                    </Typography>
                    <Chip
                      label={getCreatorStatusLabel(selectedRawFootageFeedback.rawFootage.status)}
                      color={getStatusColor(selectedRawFootageFeedback.rawFootage.status)}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Card>

              {/* Feedback History - Only show feedback that's sent to creator */}
              {selectedRawFootageFeedback.feedbackHistory.filter(f => f.sentToCreator).length > 0 ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2">
                    Feedback from Review:
                  </Typography>
                  {selectedRawFootageFeedback.feedbackHistory
                    .filter(feedback => feedback.sentToCreator)
                    .map((feedback) => (
                    <Card key={feedback.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ 
                            minWidth: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            bgcolor: 'primary.main',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {feedback.admin?.name?.charAt(0) || 'A'}
                            </Typography>
                          </Box>
                          <Box flex={1}>
                            <Typography variant="subtitle2">
                              {feedback.admin?.name || 'Admin'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(feedback.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Stack>
                        
                        <Typography variant="body2">
                          {feedback.feedback}
                        </Typography>
                        
                        {feedback.reasons?.length > 0 && (
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {feedback.reasons.map((reason, i) => (
                              <Chip key={i} label={reason} size="small" variant="outlined" color="warning" />
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  No feedback available for this raw footage yet.
                </Typography>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)}>
            Close
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

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default V4RawFootageSubmission;