import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Chip,
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
import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';

import { options_changes } from './constants';

// ----------------------------------------------------------------------

export default function V4VideoSubmission({ submission, index = 1, onUpdate }) {
  const { user } = useAuthContext();
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [postingApprovalLoading, setPostingApprovalLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [reasons, setReasons] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [forwardFeedbackDialog, setForwardFeedbackDialog] = useState(false);
  const [forwardFeedback, setForwardFeedback] = useState('');
  const [forwardLoading, setForwardLoading] = useState(false);

  // Detect client role
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  // Determine if client can see the actual content vs just placeholder
  const clientVisible = !isClient || ['SENT_TO_CLIENT', 'CLIENT_APPROVED', 'CLIENT_FEEDBACK', 'APPROVED', 'POSTED'].includes(submission.status);

  const video = submission.video?.[0]; // V4 has single video

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

    if (!feedback.trim() && (action === 'approve' || action === 'request_changes')) {
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
          `Video ${clientAction === 'approve' ? 'approved' : 'changes requested'} successfully`,
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
          `Video ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision requested'} successfully`,
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
      
      // Posting approval completed
      onUpdate?.();
    } catch (error) {
      console.error('Error approving posting link:', error);
      enqueueSnackbar(error.message || 'Failed to process posting link approval', { variant: 'error' });
    } finally {
      setPostingApprovalLoading(false);
    }
  }, [submission.id, onUpdate]);

  const handleSubmitForwardFeedback = useCallback(async () => {
    try {
      setForwardLoading(true);
      
      await axiosInstance.post('/api/submissions/v4/forward-client-feedback', {
        submissionId: submission.id,
        adminFeedback: forwardFeedback.trim() || undefined
      });

      enqueueSnackbar('Client feedback forwarded to creator successfully', { variant: 'success' });
      setForwardFeedbackDialog(false);
      setForwardFeedback('');
      onUpdate?.();
    } catch (error) {
      console.error('Error forwarding client feedback:', error);
      enqueueSnackbar(error.message || 'Failed to forward client feedback', { variant: 'error' });
    } finally {
      setForwardLoading(false);
    }
  }, [submission.id, forwardFeedback, onUpdate]);

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
    if (!isClient) {
      // Admin-specific status labels
      switch (status) {
        case 'CLIENT_FEEDBACK':
          return 'Client Feedback Received';
        default:
          return formatStatus(status);
      }
    }

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
        return 'In Progress'; // For clients - they've submitted feedback, now admin processing it
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
                <Iconify icon="eva:video-fill" sx={{ color: 'primary.main' }} />
                <Typography variant="h6">
                  Video {index}
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
              </Stack>
            </Box>
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={3}>
            {/* Video Content */}
            <Box>
              {clientVisible ? (
                // Show actual content to admins or when sent to client
                video?.url ? (
                  <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                    <Stack spacing={2}>                          
                      <Box>
                        <video
                          controls
                          style={{ width: '100%', maxWidth: 400, height: 'auto' }}
                          src={video.url}
                        />
                      </Box>

                      {/* Caption */}
                      {submission.caption && (
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Caption:
                          </Typography>
                          <Typography variant="body2">
                            {submission.caption}
                          </Typography>
                        </Box>
                      )}

                      {/* All submission feedback history */}
                      {submission.feedback && submission.feedback.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" fontWeight="medium" color="text.secondary">
                            Feedback History:
                          </Typography>
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            {submission.feedback.map((feedback, feedbackIndex) => (
                              <Card key={feedbackIndex} sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <Box sx={{ 
                                    minWidth: 24, 
                                    height: 24, 
                                    borderRadius: '50%', 
                                    bgcolor: feedback.admin?.role === 'client' ? 'warning.main' : 'primary.main', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                  }}>
                                    <Typography variant="caption" sx={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                      {feedback.admin?.role === 'client' ? 'C' : (feedback.admin?.name?.charAt(0) || feedback.user?.name?.charAt(0) || 'A')}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Typography variant="caption" fontWeight="medium">
                                        {feedback.admin?.name || feedback.user?.name || 'User'}
                                        {feedback.admin?.role === 'client' && ' (Client)'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(feedback.createdAt).toLocaleDateString()}
                                        {feedback.sentToCreator && feedback.admin?.role === 'client' && ' (forwarded to creator)'}
                                      </Typography>
                                      <Chip 
                                        label={feedback.admin?.role === 'client' ? 'Client Feedback' : 'Admin Feedback'} 
                                        size="small" 
                                        variant="outlined"
                                        color={feedback.admin?.role === 'client' ? 'warning' : 'primary'}
                                        sx={{ ml: 1 }}
                                      />
                                    </Stack>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                      {feedback.content}
                                    </Typography>
                                    {feedback.reasons && feedback.reasons.length > 0 && (
                                      <Box sx={{ mt: 1 }}>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                          {feedback.reasons.map((reason, idx) => (
                                            <Chip
                                              key={idx}
                                              label={reason}
                                              size="small"
                                              variant="outlined"
                                              color="warning"
                                            />
                                          ))}
                                        </Stack>
                                      </Box>
                                    )}
                                    {/* Forward button for client feedback */}
                                    {!isClient && !feedback.sentToCreator && feedback.admin?.role === 'client' && !isApproved && (
                                      <Box sx={{ mt: 1 }}>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          color="primary"
                                          onClick={() => {
                                            setSelectedFeedback(feedback);
                                            setForwardFeedbackDialog(true);
                                          }}
                                          startIcon={<Iconify icon="eva:arrow-forward-fill" />}
                                        >
                                          Forward to Creator
                                        </Button>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </Card>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Card>
                ) : (
                  <Typography color="text.secondary">No video uploaded yet</Typography>
                )
              ) : (
                // Show placeholder for clients when content is being processed
                <Card sx={{ p: 3, bgcolor: 'background.neutral', textAlign: 'center' }}>
                  <Stack spacing={2} alignItems="center">
                    <Iconify icon="eva:video-fill" sx={{ color: 'text.disabled', fontSize: 48 }} />
                    <Typography variant="body2" color="text.secondary">
                      Video content is being processed by the admin
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

            {/* Admin Actions */}
            {!isClient && submission.status === 'PENDING_REVIEW' && (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleApprove}
                  startIcon={<Iconify icon="eva:checkmark-fill" />}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleRequestRevision}
                  startIcon={<Iconify icon="eva:edit-fill" />}
                >
                  Request Changes
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleReject}
                  startIcon={<Iconify icon="eva:close-fill" />}
                >
                  Reject
                </Button>
              </Stack>
            )}

            {/* Client Actions */}
            {isClient && submission.status === 'SENT_TO_CLIENT' && (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleApprove}
                  startIcon={<Iconify icon="eva:checkmark-fill" />}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleRequestRevision}
                  startIcon={<Iconify icon="eva:edit-fill" />}
                >
                  Request Changes
                </Button>
              </Stack>
            )}

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
          {action === 'approve' ? 'Approve Video' : 
           action === 'reject' ? 'Reject Video' : 'Request Changes'}
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
              action === 'reject' ? 'Please explain why this video is being rejected...' :
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
            color={action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'warning'}
          >
            {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Request Changes'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Forward Client Feedback Dialog */}
      <Dialog open={forwardFeedbackDialog} onClose={() => setForwardFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Forward Client Feedback to Creator
        </DialogTitle>
        <DialogContent>
          {selectedFeedback && (
            <Card sx={{ p: 2, bgcolor: 'background.neutral', mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Original Client Feedback:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
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
                    {selectedFeedback.admin?.name?.charAt(0) || 'C'}
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight="medium">
                  {selectedFeedback.admin?.name || 'Client'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedFeedback.createdAt).toLocaleDateString()}
                </Typography>
              </Stack>
              <Typography variant="body2">
                {selectedFeedback.content}
              </Typography>
              {selectedFeedback.reasons && selectedFeedback.reasons.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {selectedFeedback.reasons.map((reason, idx) => (
                      <Chip
                        key={idx}
                        label={reason}
                        size="small"
                        variant="outlined"
                        color="warning"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Card>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional message (optional)"
            value={forwardFeedback}
            onChange={(e) => setForwardFeedback(e.target.value)}
            placeholder="Add any additional context or instructions for the creator..."
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            The original client feedback will be forwarded along with any additional message you provide.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setForwardFeedbackDialog(false);
            setSelectedFeedback(null);
          }} disabled={forwardLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitForwardFeedback}
            variant="contained"
            loading={forwardLoading}
            color="primary"
          >
            Forward to Creator
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

V4VideoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  index: PropTypes.number,
  onUpdate: PropTypes.func,
};