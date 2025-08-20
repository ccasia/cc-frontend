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

import { options_changes } from '../../../client/submissions/v4';
// ----------------------------------------------------------------------

export default function V4PhotoSubmission({ submission, campaign, index = 1, onUpdate }) {
  const { user } = useAuthContext();
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [postingDialog, setPostingDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [postingLink, setPostingLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [reasons, setReasons] = useState([]);

  // Detect client role
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const photos = submission.photos || []; // V4 can have multiple photos
  const isApproved = submission.status === 'APPROVED';
  const hasPostingLink = Boolean(submission.content);

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

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING_REVIEW: 'warning',
      IN_PROGRESS: 'info', 
      APPROVED: 'success',
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
                  label={formatStatus(submission.status)}
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
                Photo Content ({photos.length} photos)
              </Typography>
              {photos.length > 0 ? (
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
                            {photo.feedback && (
                              <Typography variant="caption" color="text.secondary">
                                Has feedback
                              </Typography>
                            )}
                          </Stack>
                          
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
                </Typography>
                {isApproved && (
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
            color={action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'warning'}
          >
            {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Request Changes'}
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
    </>
  );
}

V4PhotoSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  index: PropTypes.number,
  onUpdate: PropTypes.func,
};