import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Dialog,
  TextField,
  Accordion,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import { approveV4Submission } from 'src/hooks/use-get-v4-submissions';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function V4AgreementSubmission({ submission, campaign, onUpdate }) {
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('approve');

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

    try {
      setLoading(true);
      await approveV4Submission({
        submissionId: submission.id,
        action,
        feedback: feedback.trim() || undefined,
        reasons: [],
      });

      const getActionText = (act) => {
        if (act === 'approve') return 'approved';
        if (act === 'reject') return 'rejected';
        return 'revision requested';
      };
      
      enqueueSnackbar(
        `Agreement ${getActionText(action)} successfully`,
        { variant: 'success' }
      );
      
      setFeedbackDialog(false);
      setFeedback('');
      onUpdate?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      enqueueSnackbar(error.message || 'Failed to submit feedback', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [action, feedback, submission.id, onUpdate]);

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
    if (status === 'IN_PROGRESS') return 'Processing';
    return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  return (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Iconify icon="eva:file-text-fill" sx={{ color: 'info.main' }} />
                <Typography variant="h6">
                  Agreement Form
                </Typography>
                <Chip
                  label={formatStatus(submission.status)}
                  color={getStatusColor(submission.status)}
                  size="small"
                />
              </Stack>
            </Box>
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={3}>
            {/* Agreement Content */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Agreement Status
              </Typography>
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      label={formatStatus(submission.status)}
                      color={getStatusColor(submission.status)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {(() => {
                        if (submission.status === 'APPROVED') return 'Creator can proceed with content creation';
                        if (submission.status === 'PENDING_REVIEW') return 'Waiting for admin review';
                        return 'Action required';
                      })()}
                    </Typography>
                  </Stack>

                  {/* Agreement Details */}
                  <Box sx={{ pt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Agreement submissions are automatically created for V4 campaigns.
                      Approve this to allow the creator to start working on content submissions.
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Box>

            {/* Creator Information (if needed) */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Submission Details
              </Typography>
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Submission Type:</strong> Agreement Form
                  </Typography>
                  <Typography variant="body2">
                    <strong>Campaign:</strong> {campaign?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Version:</strong> V4 (Content-type based)
                  </Typography>
                </Stack>
              </Card>
            </Box>

            {/* Admin Actions */}
            {submission.status === 'PENDING_REVIEW' && (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleApprove}
                  startIcon={<Iconify icon="eva:checkmark-fill" />}
                >
                  Approve Agreement
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

            {/* Status Information */}
            {submission.status === 'APPROVED' && (
              <Card sx={{ p: 2, bgcolor: 'success.lighter' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Iconify icon="eva:checkmark-circle-fill" sx={{ color: 'success.main' }} />
                  <Box>
                    <Typography variant="subtitle2" color="success.main">
                      Agreement Approved
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creator can now proceed with content submissions (videos, photos, raw footage)
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            )}

            {submission.status === 'REJECTED' && (
              <Card sx={{ p: 2, bgcolor: 'error.lighter' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Iconify icon="eva:close-circle-fill" sx={{ color: 'error.main' }} />
                  <Box>
                    <Typography variant="subtitle2" color="error.main">
                      Agreement Rejected
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creator cannot proceed with submissions until agreement is resolved
                    </Typography>
                  </Box>
                </Stack>
              </Card>
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
          {(() => {
            if (action === 'approve') return 'Approve Agreement';
            if (action === 'reject') return 'Reject Agreement';
            return 'Request Changes';
          })()}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={action === 'approve' ? 'Approval message (optional)' : 'Feedback'}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={(() => {
              if (action === 'approve') return 'Add any additional comments...';
              if (action === 'reject') return 'Please explain why this agreement is being rejected...';
              return 'Please specify what changes are needed...';
            })()}
            required={action === 'reject'}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitFeedback}
            variant="contained"
            loading={loading}
            color={(() => {
              if (action === 'approve') return 'success';
              if (action === 'reject') return 'error';
              return 'warning';
            })()}
          >
            {(() => {
              if (action === 'approve') return 'Approve';
              if (action === 'reject') return 'Reject';
              return 'Request Changes';
            })()}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

V4AgreementSubmission.propTypes = {
  submission: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
};