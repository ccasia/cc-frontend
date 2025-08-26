import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { approveV4Submission, updateV4PostingLink } from 'src/hooks/use-get-v4-submissions';

import { options_changes } from './constants';
// ----------------------------------------------------------------------

export default function V4PhotoSubmission({ submission, campaign, index = 1, onUpdate }) {
  const { user } = useAuthContext();
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [postingDialog, setPostingDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [postingLink, setPostingLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [postingApprovalLoading, setPostingApprovalLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [reasons, setReasons] = useState([]);
  const [individualPhotoDialog, setIndividualPhotoDialog] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [individualPhotoAction, setIndividualPhotoAction] = useState('approve');
  const [individualPhotoFeedback, setIndividualPhotoFeedback] = useState('');
  const [individualPhotoReasons, setIndividualPhotoReasons] = useState([]);
  const [individualPhotoLoading, setIndividualPhotoLoading] = useState(false);
  const [selectedPhotoFeedback, setSelectedPhotoFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [forwardingFeedback, setForwardingFeedback] = useState({});

  // Detect client role
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const clientCanSeeContent = !isClient || ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'CLIENT_FEEDBACK', 'POSTED'].includes(submission.status);

  const photos = submission.photos || [];
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(submission.status);
  const isPosted = submission.status === 'POSTED';
  const hasPostingLink = Boolean(submission.content);
  const hasPendingPostingLink = hasPostingLink && isApproved && !isPosted;

  const handleApprove = useCallback(() => {
    setAction('approve');
    setFeedback('');
    setFeedbackDialog(true);
  }, []);

  const handleReject = useCallback(() => {
    setAction('reject');
    setFeedback('');
    setFeedbackDialog(true);
  }, []);

  const handleRequestRevision = useCallback(() => {
    setAction('request_revision');
    setFeedback('');
    setFeedbackDialog(true);
  }, []);

  const handleSubmitFeedback = useCallback(async () => {
    if (action === 'reject' && !feedback.trim()) {
      enqueueSnackbar('Please provide feedback for rejection', { variant: 'error' });
      return;
    }

    if (!feedback.trim() && (action === 'approve' || action === 'request_revision')) {
      enqueueSnackbar('Please provide feedback', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      if (isClient) {
        // Client-specific endpoint
        const clientAction = action === 'approve' ? 'approve' : 'request_changes';
        await axiosInstance.post('/api/submissions/v4/approve/client', {
          submissionId: submission.id,
          action: clientAction,
          feedback: feedback.trim(),
          reasons: reasons || []
        });

        enqueueSnackbar(
          `Photos ${clientAction === 'approve' ? 'approved' : 'changes requested'} successfully`,
          { variant: 'success' }
        );
      } else {
        // Admin endpoint
        await approveV4Submission({
          submissionId: submission.id,
          action,
          feedback: feedback.trim() || undefined,
          reasons: reasons || [],
        });

        enqueueSnackbar(
          `Photos ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision requested'} successfully`,
          { variant: 'success' }
        );
      }
      
      setFeedbackDialog(false);
      setFeedback('');
      setReasons([]);
      onUpdate?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      enqueueSnackbar(error.message || 'Failed to submit feedback', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [action, feedback, reasons, submission.id, onUpdate, isClient]);

  const handleAddPostingLink = useCallback(() => {
    setPostingLink(submission.content || '');
    setPostingDialog(true);
  }, [submission.content]);

  const handleSubmitPostingLink = useCallback(async () => {
    if (!postingLink.trim()) {
      enqueueSnackbar('Please enter a posting link', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await updateV4PostingLink({
        submissionId: submission.id,
        postingLink: postingLink.trim(),
      });

      enqueueSnackbar('Posting link updated successfully', { variant: 'success' });
      setPostingDialog(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating posting link:', error);
      enqueueSnackbar(error.message || 'Failed to update posting link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [postingLink, submission.id, onUpdate]);

  const handlePostingLinkApproval = useCallback(async (approvalAction) => {
    try {
      setPostingApprovalLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/approve', {
        submissionId: submission.id,
        action: approvalAction,
      });

      enqueueSnackbar(
        `Posting link ${approvalAction}d successfully`, 
        { variant: 'success' }
      );
      
      onUpdate?.();
    } catch (error) {
      console.error('Error approving posting link:', error);
      enqueueSnackbar(error.message || 'Failed to process posting link approval', { variant: 'error' });
    } finally {
      setPostingApprovalLoading(false);
    }
  }, [submission.id, onUpdate]);

  const handleIndividualPhotoAction = useCallback((photoId, actionType) => {
    setSelectedPhotoId(photoId);
    setIndividualPhotoAction(actionType);
    setIndividualPhotoFeedback('');
    setIndividualPhotoReasons([]);
    setIndividualPhotoDialog(true);
  }, []);

  const handleSubmitIndividualPhotoFeedback = useCallback(async () => {
    if (individualPhotoAction === 'reject' && !individualPhotoFeedback.trim()) {
      enqueueSnackbar('Please provide feedback for rejection', { variant: 'error' });
      return;
    }

    if (individualPhotoAction === 'request_changes' && !individualPhotoFeedback.trim()) {
      enqueueSnackbar('Please provide feedback for changes', { variant: 'error' });
      return;
    }

    try {
      setIndividualPhotoLoading(true);
      
      if (isClient) {
        // Client-specific endpoint
        const clientAction = individualPhotoAction === 'approve' ? 'approve' : 'request_changes';
        const endpoint = clientAction === 'approve' 
          ? '/api/submissions/v4/content/approve/client'
          : '/api/submissions/v4/content/request-changes/client';
          
        await axiosInstance.patch(endpoint, {
          contentType: 'photo',
          contentId: selectedPhotoId,
          feedback: individualPhotoFeedback.trim() || undefined,
          reasons: individualPhotoReasons || []
        });

        enqueueSnackbar(
          `Photo ${clientAction === 'approve' ? 'approved' : 'changes requested'} successfully`,
          { variant: 'success' }
        );
      } else {
        // Admin endpoint
        const endpoint = individualPhotoAction === 'approve'
          ? '/api/submissions/v4/content/approve'
          : '/api/submissions/v4/content/request-changes';
          
        await axiosInstance.patch(endpoint, {
          contentType: 'photo',
          contentId: selectedPhotoId,
          feedback: individualPhotoFeedback.trim() || undefined,
          reasons: individualPhotoReasons || []
        });

        enqueueSnackbar(
          `Photo ${individualPhotoAction === 'approve' ? 'approved' : 'rejected'} successfully`,
          { variant: 'success' }
        );
      }
      
      setIndividualPhotoDialog(false);
      setIndividualPhotoFeedback('');
      setIndividualPhotoReasons([]);
      setSelectedPhotoId(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error submitting individual photo feedback:', error);
      enqueueSnackbar(error.message || 'Failed to submit feedback', { variant: 'error' });
    } finally {
      setIndividualPhotoLoading(false);
    }
  }, [individualPhotoAction, individualPhotoFeedback, individualPhotoReasons, selectedPhotoId, onUpdate, isClient]);

  const handleShowPhotoFeedback = useCallback(async (photoId) => {
    try {
      setFeedbackLoading(true);
      setFeedbackDialog(true);
      
      const response = await axiosInstance.get(`/api/submissions/v4/photo/${photoId}/feedback`);
      setSelectedPhotoFeedback(response.data);
    } catch (error) {
      console.error('Error fetching photo feedback:', error);
      enqueueSnackbar('Failed to load feedback', { variant: 'error' });
      setFeedbackDialog(false);
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const handleForwardFeedback = useCallback(async (feedbackId) => {
    try {
      setForwardingFeedback(prev => ({ ...prev, [feedbackId]: true }));
      
      await axiosInstance.post('/api/submissions/v4/forward-photo-feedback', {
        feedbackId
      });

      enqueueSnackbar('Feedback forwarded to creator successfully', { variant: 'success' });
      
      // Refresh the feedback history
      if (selectedPhotoFeedback?.photo?.id) {
        const response = await axiosInstance.get(`/api/submissions/v4/photo/${selectedPhotoFeedback.photo.id}/feedback`);
        setSelectedPhotoFeedback(response.data);
      }
      
      // Refresh the main submission data
      onUpdate?.();
    } catch (error) {
      console.error('Error forwarding feedback:', error);
      enqueueSnackbar(error.message || 'Failed to forward feedback', { variant: 'error' });
    } finally {
      setForwardingFeedback(prev => ({ ...prev, [feedbackId]: false }));
    }
  }, [selectedPhotoFeedback, onUpdate]);

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING_REVIEW: 'warning',
      IN_PROGRESS: 'info', 
      APPROVED: 'success',
      POSTED: 'success',
      REJECTED: 'error',
      CHANGES_REQUIRED: 'warning',
      SENT_TO_CLIENT: 'primary',
      CLIENT_APPROVED: 'success',
      CLIENT_FEEDBACK: 'warning',
      SENT_TO_ADMIN: 'info',
    };
    return statusColors[status] || 'default';
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  // Map admin statuses to client-friendly labels based on the business process
  const getClientStatusLabel = (status) => {
    if (!isClient) return formatStatus(status); // Admins see the raw status

    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PENDING_REVIEW':
        return 'In Progress'; // Creator has submitted, admin reviewing
      case 'SENT_TO_CLIENT':
        return 'Pending Review'; // Client should see this as pending their review
      case 'CLIENT_APPROVED':
      case 'APPROVED':
        return 'Approved';
      case 'POSTED':
        return 'Posted';
      case 'CLIENT_FEEDBACK':
        return 'Changes Required'; // Client requested changes
      case 'CHANGES_REQUIRED':
      case 'REJECTED':
        return 'Changes Required';
      default:
        return formatStatus(status);
    }
  };

  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Iconify icon="eva:image-fill" sx={{ color: 'secondary.main' }} />
                <Typography variant="h6">
                  Photo Submission {index}
                </Typography>
                <Chip
                  label={getClientStatusLabel(submission.status)}
                  color={getStatusColor(submission.status)}
                  size="small"
                />
                {hasPostingLink && (
                  <Chip
                    icon={<Iconify icon="eva:link-2-fill" />}
                    label="Has Posting Link"
                    color="info"
                    variant="outlined"
                    size="small"
                  />
                )}
                {photos.length > 0 && (
                  <Chip
                    label={`${photos.length} photo${photos.length > 1 ? 's' : ''}`}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={3}>
            {/* Photo Content */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Photo Content {clientCanSeeContent && photos.length > 0 && `(${photos.length} photo${photos.length !== 1 ? 's' : ''})`}
              </Typography>
              
              {clientCanSeeContent ? (
                // Show actual content to admins or when sent to client
                photos.length > 0 ? (
                  <Grid container spacing={2}>
                    {photos.map((photo, photoIndex) => (
                      <Grid item xs={12} sm={6} md={4} key={photo.id}>
                        <Card sx={{ overflow: 'hidden' }}>
                          <Box
                            component="img"
                            src={photo.url}
                            alt={`Photo ${photoIndex + 1}`}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                            }}
                          />
                          <Box sx={{ p: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Chip
                                label={formatStatus(photo.status)}
                                color={getStatusColor(photo.status)}
                                size="small"
                              />
                              <Stack direction="row" spacing={1} alignItems="center">
                                {photo.feedback && (
                                  <Typography variant="caption" color="text.secondary">
                                    Has feedback
                                  </Typography>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={() => handleShowPhotoFeedback(photo.id)}
                                  title="View feedback history"
                                >
                                  <Iconify icon="eva:message-circle-outline" />
                                </IconButton>
                              </Stack>
                            </Stack>
                            
                            {/* Individual photo actions for admin */}
                            {!isClient && ['PENDING'].includes(photo.status) && (
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleIndividualPhotoAction(photo.id, 'approve')}
                                  startIcon={<Iconify icon="eva:checkmark-fill" />}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleIndividualPhotoAction(photo.id, 'request_changes')}
                                  startIcon={<Iconify icon="eva:close-fill" />}
                                >
                                  Request a Change
                                </Button>
                              </Stack>
                            )}
                            
                            {/* Individual photo actions for client */}
                            {isClient && photo.status === 'SENT_TO_CLIENT' && (
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleIndividualPhotoAction(photo.id, 'approve')}
                                  startIcon={<Iconify icon="eva:checkmark-fill" />}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => handleIndividualPhotoAction(photo.id, 'request_changes')}
                                  startIcon={<Iconify icon="eva:edit-fill" />}
                                >
                                  Request Changes
                                </Button>
                              </Stack>
                            )}
                            
                            {photo.feedback && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" fontWeight="medium">
                                  Feedback:
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  {photo.feedback}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                    <Typography color="text.secondary">No photos uploaded yet</Typography>
                  </Card>
                )
              ) : (
                // Show placeholder for clients when content is being processed
                <Card sx={{ p: 3, bgcolor: 'background.neutral', textAlign: 'center' }}>
                  <Stack spacing={2} alignItems="center">
                    <Iconify icon="eva:image-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                    <Typography variant="body2" color="text.secondary">
                      Photo content is being processed by the admin
                    </Typography>
                    <Chip
                      label="In Progress"
                      color="info"
                      size="small"
                    />
                  </Stack>
                </Card>
              )}
            </Box>

            {/* Caption */}
            {submission.caption && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Caption
                </Typography>
                <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="body2">{submission.caption}</Typography>
                </Card>
              </Box>
            )}

            {/* Posting Link */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2">
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
                {isApproved && !isClient && (
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
              
              <Card sx={{ p: 2, bgcolor: 'background.neutral', mt: 1 }}>
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
                    {isApproved ? 'Creator can add posting link after approval' : 'Available after approval'}
                  </Typography>
                )}
              </Card>

              {/* Admin Posting Link Approval */}
              {!isClient && hasPendingPostingLink && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => handlePostingLinkApproval('approve')}
                    disabled={postingApprovalLoading}
                    startIcon={<Iconify icon="eva:checkmark-fill" />}
                  >
                    Approve Link
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handlePostingLinkApproval('reject')}
                    disabled={postingApprovalLoading}
                    startIcon={<Iconify icon="eva:close-fill" />}
                  >
                    Reject Link
                  </Button>
                </Stack>
              )}
            </Box>

            {/* Submission Metadata */}
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(submission.createdAt).toLocaleString()} •
                Last updated: {new Date(submission.updatedAt).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'approve' ? 'Approve Photos' : 
           action === 'reject' ? 'Reject Photos' : 'Request Changes'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={action === 'approve' ? 'Approval message' : 'Feedback'}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              action === 'approve' ? 'Add any additional comments...' :
              action === 'reject' ? 'Please explain why these photos are being rejected...' :
              'Please specify what changes are needed...'
            }
            required
            sx={{ mt: 1 }}
          />
          
          {/* Reasons selection for client request changes */}
          {isClient && action === 'request_revision' && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Issues (Optional)</InputLabel>
                <Select
                  multiple
                  value={reasons}
                  onChange={(e) => setReasons(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Select Issues (Optional)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {options_changes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitFeedback}
            variant="contained"
            loading={loading}
            color={action === 'approve' ? 'success' : action === 'request_changes' ? 'warning' : 'error'}
          >
            {action === 'approve' ? 'Approve' : action === 'request_changes' ? 'Request Changes' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

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
            placeholder="https://www.instagram.com/p/ABC123/"
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Enter the social media post URL where these photos were published
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostingDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitPostingLink}
            variant="contained"
            loading={loading}
          >
            {hasPostingLink ? 'Update' : 'Add'} Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Individual Photo Feedback Dialog */}
      <Dialog open={individualPhotoDialog} onClose={() => setIndividualPhotoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {individualPhotoAction === 'approve' ? 'Approve Photo' : 
           individualPhotoAction === 'request_changes' ? 'Request Changes for Photo' : 'Reject Photo'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={individualPhotoAction === 'approve' ? 'Approval message (optional)' : 'Feedback'}
            value={individualPhotoFeedback}
            onChange={(e) => setIndividualPhotoFeedback(e.target.value)}
            placeholder={
              individualPhotoAction === 'approve' ? 'Add any additional comments...' :
              individualPhotoAction === 'reject' ? 'Please explain why this photo is being rejected...' :
              'Please specify what changes are needed for this photo...'
            }
            required={individualPhotoAction !== 'approve'}
            sx={{ mt: 1 }}
          />
          
          {/* Reasons selection for client request changes */}
          {isClient && individualPhotoAction === 'request_changes' && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Issues (Optional)</InputLabel>
                <Select
                  multiple
                  value={individualPhotoReasons}
                  onChange={(e) => setIndividualPhotoReasons(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Select Issues (Optional)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {options_changes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIndividualPhotoDialog(false)} disabled={individualPhotoLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitIndividualPhotoFeedback}
            variant="contained"
            loading={individualPhotoLoading}
            color={individualPhotoAction === 'approve' ? 'success' : individualPhotoAction === 'reject' ? 'error' : 'warning'}
          >
            {individualPhotoAction === 'approve' ? 'Approve' : individualPhotoAction === 'request_changes' ? 'Request Changes' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Feedback History Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Iconify icon="eva:message-circle-fill" />
            <Typography variant="h6">
              Feedback History - Photo
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {feedbackLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Loading feedback...</Typography>
            </Box>
          ) : selectedPhotoFeedback ? (
            <Stack spacing={3}>
              {/* Photo Info */}
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  {selectedPhotoFeedback.photo.url && (
                    <Box
                      component="img"
                      src={selectedPhotoFeedback.photo.url}
                      alt="Photo"
                      sx={{
                        width: 80,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                    />
                  )}
                  <Box>
                    <Typography variant="subtitle2">
                      Photo ID: {selectedPhotoFeedback.photo.id}
                    </Typography>
                    <Chip
                      label={formatStatus(selectedPhotoFeedback.photo.status)}
                      color={getStatusColor(selectedPhotoFeedback.photo.status)}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Card>

              {/* Feedback History */}
              {selectedPhotoFeedback.feedbackHistory.length > 0 ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2">
                    Feedback History ({selectedPhotoFeedback.totalFeedback} items):
                  </Typography>
                  {selectedPhotoFeedback.feedbackHistory
                    .filter((feedback, index, array) => {
                      // Remove duplicates by checking if this is the first occurrence of this feedback content and timestamp
                      return array.findIndex(f => 
                        f.feedback === feedback.feedback && 
                        f.createdAt === feedback.createdAt &&
                        f.admin?.name === feedback.admin?.name
                      ) === index;
                    })
                    .map((feedback) => (
                    <Card key={`${feedback.id}-${feedback.type}-${feedback.createdAt}`} sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ 
                            minWidth: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            bgcolor: feedback.type === 'client_feedback' ? 'warning.main' : 'primary.main',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {feedback.type === 'client_feedback' ? 'C' : feedback.admin?.name?.charAt(0) || 'A'}
                            </Typography>
                          </Box>
                          <Box flex={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle2">
                                {feedback.admin?.name || 'Admin'}
                                {feedback.type === 'client_feedback' && ' (Client)'}
                              </Typography>
                              <Chip 
                                label={feedback.type === 'client_feedback' ? 'Client Feedback' : 'Admin Feedback'} 
                                size="small" 
                                variant="outlined"
                                color={feedback.type === 'client_feedback' ? 'warning' : 'primary'}
                              />
                              {!feedback.sentToCreator && feedback.type === 'client_feedback' && !isApproved && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip 
                                    label="Pending Forward" 
                                    size="small" 
                                    color="warning"
                                  />
                                  {!isClient && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="primary"
                                      onClick={() => handleForwardFeedback(feedback.id)}
                                      disabled={forwardingFeedback[feedback.id]}
                                      startIcon={forwardingFeedback[feedback.id] ? 
                                        <Iconify icon="eva:loader-outline" spin /> : 
                                        <Iconify icon="eva:arrow-forward-fill" />
                                      }
                                    >
                                      {forwardingFeedback[feedback.id] ? 'Forwarding...' : 'Forward'}
                                    </Button>
                                  )}
                                </Stack>
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(feedback.createdAt).toLocaleString()}
                              {feedback.sentToCreator && feedback.type === 'client_feedback' && ' (forwarded to creator)'}
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
                  No feedback available for this photo yet.
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
    </>
  );
}

V4PhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  index: PropTypes.number,
  onUpdate: PropTypes.func,
};