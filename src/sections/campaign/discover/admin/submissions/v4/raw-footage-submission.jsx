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

export default function V4RawFootageSubmission({ submission, campaign, index = 1, onUpdate }) {
  const { user } = useAuthContext();
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');
  const [reasons, setReasons] = useState([]);

  // Detect client role
  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isClient = userRole.toLowerCase() === 'client';

  const rawFootage = submission.rawFootages?.[0]; // V4 has one raw footage per submission

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
          `Raw footage ${clientAction === 'approve' ? 'approved' : 'changes requested'} successfully`,
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
          `Raw footage ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision requested'} successfully`,
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
                <Iconify icon="eva:film-fill" sx={{ color: 'warning.main' }} />
                <Typography variant="h6">
                  Raw Footage {index}
                </Typography>
                <Chip
                  label={getClientStatusLabel(submission.status)}
                  color={getStatusColor(submission.status)}
                  size="small"
                />
              </Stack>
            </Box>
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={3}>
            {/* Raw Footage Content */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Raw Footage Content
              </Typography>
              {rawFootage ? (
                <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Stack spacing={2}>
                    {rawFootage.url ? (
                      <Box>
                        <video
                          controls
                          style={{ width: '100%', maxWidth: 400, height: 'auto' }}
                          src={rawFootage.url}
                        />
                      </Box>
                    ) : (
                      <Typography color="text.secondary">No raw footage uploaded yet</Typography>
                    )}
                    
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Chip
                        label={formatStatus(rawFootage.status)}
                        color={getStatusColor(rawFootage.status)}
                        size="small"
                      />
                      {rawFootage.feedback && (
                        <Typography variant="caption" color="text.secondary">
                          Last feedback: {new Date(rawFootage.feedbackAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Stack>

                    {rawFootage.feedback && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" fontWeight="medium">
                          Feedback:
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {rawFootage.feedback}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Card>
              ) : (
                <Typography color="text.secondary">No raw footage data available</Typography>
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
          {action === 'approve' ? 'Approve Raw Footage' : 
           action === 'reject' ? 'Reject Raw Footage' : 'Request Changes'}
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
              action === 'reject' ? 'Please explain why this raw footage is being rejected...' :
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

    </>
  );
}

V4RawFootageSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  index: PropTypes.number,
  onUpdate: PropTypes.func,
};