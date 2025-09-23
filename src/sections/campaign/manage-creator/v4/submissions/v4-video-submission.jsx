import React, { useState, useCallback, useMemo } from 'react';
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
import { getDueDateInfo } from 'src/utils/dueDateHelpers';

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

const V4VideoSubmission = ({ submission, onUpdate, campaign }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState(submission.caption || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [postingDialog, setPostingDialog] = useState(false);
  const [postingLink, setPostingLink] = useState('');
  const [postingLoading, setPostingLoading] = useState(false);


  const handleDrop = useCallback((acceptedFiles, rejectedFiles) => {
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
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveAllFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

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
        caption: (isEditingCaption || !submission.caption) ? caption.trim() : (submission.caption || '')
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
      setIsEditingCaption(false);
      
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

  const handleAddPostingLink = useCallback(() => {
    setPostingLink(submission.content || '');
    setPostingDialog(true);
  }, [submission.content]);

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

  // Memoize status calculations to avoid recalculating on each render
  const statusInfo = useMemo(() => {
    const isSubmitted = submission.video?.some(v => v.url);
    const isInReview = ['PENDING_REVIEW', 'SENT_TO_CLIENT', 'CLIENT_FEEDBACK'].includes(submission.status);
    const hasChangesRequired = ['CHANGES_REQUIRED'].includes(submission.status);
    const isPostingLinkRejected = submission.status === 'REJECTED' && isSubmitted;
    const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
    const isPosted = submission.status === 'POSTED';
    const hasPostingLink = Boolean(submission.content);
    const hasPendingPostingLink = hasPostingLink && isApproved && !isPosted;
    
    // Check if posting links are required for this campaign type
    const requiresPostingLink = (campaign?.campaignType || submission.campaign?.campaignType) !== 'ugc';
    
    return {
      isSubmitted,
      isInReview,
      hasChangesRequired,
      isPostingLinkRejected,
      isApproved,
      isPosted,
      hasPostingLink,
      hasPendingPostingLink,
      requiresPostingLink
    };
  }, [submission.video, submission.status, submission.content, campaign?.campaignType, submission.campaign?.campaignType]);

  const { 
    isSubmitted, 
    isInReview, 
    hasChangesRequired, 
    isPostingLinkRejected,
    isApproved, 
    isPosted, 
    hasPostingLink, 
    hasPendingPostingLink,
    requiresPostingLink
  } = statusInfo;

  // Memoize feedback filtering to avoid recalculation
  const relevantFeedback = useMemo(() => {
    return submission.feedback?.filter(feedback => feedback.sentToCreator) || [];
  }, [submission.feedback]);

  // Get due date info using helper function
  const dueDateInfo = useMemo(() => getDueDateInfo(submission.dueDate), [submission.dueDate]);

  return (
    <>
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
          {/* Due Date Display */}
          {dueDateInfo && (
            <Chip
              icon={<Iconify icon="eva:calendar-fill" />}
              label={dueDateInfo.message}
              color={dueDateInfo.color}
              variant="outlined"
              size="small"
            />
          )}
        </Stack>
      </Stack>

      {/* Due Date Alert */}
      {dueDateInfo && ['overdue', 'due-today', 'due-tomorrow'].includes(dueDateInfo.status) && (
        <Alert severity={dueDateInfo.severity} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="eva:calendar-fill" />
            <Typography variant="body2">
              {dueDateInfo.status === 'overdue' && '⚠️ This submission is overdue! Please submit as soon as possible.'}
              {dueDateInfo.status === 'due-today' && '🔔 This submission is due today! Please submit before the deadline.'}
              {dueDateInfo.status === 'due-tomorrow' && '⏰ This submission is due tomorrow. Don\'t forget to submit!'}
            </Typography>
          </Stack>
        </Alert>
      )}

      {/* Status Messages */}
      {isPosted && (
        <Alert severity="success">
          <Typography variant="body2">
            🎉 Your video has been posted! The posting link has been approved.
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
            {requiresPostingLink 
              ? "🎉 Your video has been approved! Great work!"
              : "🎉 Your video has been approved and completed! Great work! No posting required for this campaign."
            }
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

      {isPostingLinkRejected && (
        <Alert severity="warning">
          <Typography variant="body2">
            🔗 Your posting link was rejected. Please update your posting link below.
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
        <Alert severity="info">
          <Typography variant="body2">
            🗣️ Client has provided feedback. Admin is reviewing the feedback before forwarding to you.
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
      {(!isInReview && !isApproved && !isPosted && !isPostingLinkRejected) && (
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

            {/* Caption */}
            <TextField
              label="Caption/Notes (Optional)"
              multiline
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                submission.caption && !isEditingCaption 
                  ? "Click 'Update Caption' below to modify your existing caption"
                  : "Add any notes or caption for your videos..."
              }
              disabled={uploading || (submission.caption && !isEditingCaption)}
            />

            {submission.caption && (
              <Card sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" gutterBottom>
                    Caption:
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setCaption(submission.caption);
                      setIsEditingCaption(true);
                    }}
                    startIcon={<Iconify icon="eva:edit-2-fill" />}
                    disabled={uploading}
                  >
                    Update Caption
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {submission.caption}
                </Typography>
              </Card>
            )}

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
                disabled={uploading || selectedFiles.length === 0 || selectedFiles.length > 1}
                startIcon={<Iconify icon="eva:upload-fill" />}
                size="large"
              >
                {uploading ? 'Uploading...' : isSubmitted ? 'Update Videos' : 'Submit Videos'}
              </Button>
            </Box>
          </Stack>
        </Card>
      )}

      {/* Posting Link Section - Only show for campaigns that require posting */}
      {requiresPostingLink && (isApproved || isPosted || isPostingLinkRejected) && (
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
                  No posting link added yet. Click "Add Link" to share where you published this video.
                </Typography>
              )}
            </Card>
          </Stack>
        </Card>
      )}
      </Stack>

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
            Enter the social media post URL where this video was published
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
    </>
  );
};

// Helper functions with v4 client feedback support
const getStatusColor = (status) => {
  switch (status) {
    case 'IN_PROGRESS': return 'info';
    case 'PENDING_REVIEW': return 'warning';
    case 'PENDING': return 'warning';
    case 'APPROVED':
    case 'CLIENT_APPROVED': return 'success';
    case 'POSTED': return 'success';
    case 'CHANGES_REQUIRED':
    case 'REJECTED':
    case 'REVISION_REQUESTED': return 'error';
    case 'SENT_TO_CLIENT': return 'secondary';
    case 'CLIENT_FEEDBACK': return 'warning';
    default: return 'default';
  }
};

const getCreatorStatusLabel = (status) => {
  switch (status) {
    case 'IN_PROGRESS': return 'In Progress';
    case 'PENDING_REVIEW': return 'In Review';
    case 'PENDING': return 'In Review';
    case 'APPROVED': return 'Approved';
    case 'CLIENT_APPROVED': return 'Approved';
    case 'POSTED': return 'Posted';
    case 'CHANGES_REQUIRED': return 'Changes Required';
    case 'REJECTED': return 'Changes Required';
    case 'REVISION_REQUESTED': return 'Needs Re-upload';
    case 'SENT_TO_CLIENT': return 'Client Review';
    case 'CLIENT_FEEDBACK': return 'Client Review';
    default: return status;
  }
};

V4VideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  campaign: PropTypes.object,
};

export default V4VideoSubmission;