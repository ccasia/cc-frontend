import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useState, useCallback } from 'react';

import {
  Box,
  Link,
  Chip,
  Stack,
  Button,
  Select,
  Avatar,
  MenuItem,
  TextField,
  Typography,
  FormControl,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import ConfirmDialogV2 from 'src/components/custom-dialog/confirm-dialog-v2';

import { BUTTON_STYLES } from './submission-styles';
import { posting_link_options_changes } from '../constants';

export default function PostingLinkSection({ submission, onUpdate, onViewLogs, onReviewSubmission, isDisabled = false, isClient = false }) {
  const { user } = useAuthContext();
  const [postingLink, setPostingLink] = useState(submission.content || '');
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [action, setAction] = useState('approve');
  const [reasons, setReasons] = useState([]);

  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isSuperAdmin = userRole.toLowerCase() === 'superadmin';

  const handleSubmitPostingLink = useCallback(async () => {
    if (!postingLink.trim()) {
      enqueueSnackbar('Please enter a posting link', { variant: 'warning' });
      return;
    }

    try {
      // eslint-disable-next-line no-new
      new URL(postingLink.trim());
    } catch {
      enqueueSnackbar('Please enter a valid URL', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.put('/api/submissions/v4/posting-link', {
        submissionId: submission.id,
        postingLink: postingLink.trim(),
      });

      enqueueSnackbar('Posting link updated successfully', { variant: 'success' });
      onUpdate?.();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update posting link', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [postingLink, submission.id, onUpdate]);

  const handleApprovePosting = useCallback(async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/approve', {
        submissionId: submission.id,
        action: 'approve',
      });

      enqueueSnackbar('Posting link approved successfully', { variant: 'success' });
      onUpdate?.();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve posting link', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [submission.id, onUpdate]);

  const handleRejectPosting = useCallback(async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/approve', {
        submissionId: submission.id,
        action: 'reject',
        reasons,
      });

      enqueueSnackbar('Change request sent successfully', { variant: 'success' });
      setAction('approve');
      setReasons([]);
      onUpdate?.();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to send change request', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [submission.id, reasons, onUpdate]);

  const isPosted = submission.status === 'POSTED';
  const postingLinkAddedByAdmin = Boolean(submission.admin?.userId);

  const handleConfirmApprove = () => {
    setConfirmDialogOpen(false);
    handleApprovePosting();
  };

  const actionText = 'Approve Posting Link?';

  const actionButtonSx = {
    borderRadius: 1.15,
    border: '1px solid #E7E7E7',
    borderBottom: '3px solid #E7E7E7',
    backgroundColor: '#FFFFFF',
    boxShadow: 'none',
    fontWeight: 800,
    textTransform: 'none',
    px: { xs: 1.8, sm: 2.25 },
    py: { xs: 0.55, sm: 0.65 },
    fontSize: { xs: '0.85rem', sm: '0.95rem' },
    '&:hover': {
      backgroundColor: '#F5F5F5',
      boxShadow: 'none',
    },
  };

  // Shared action buttons for approve/request-change (used by both creator-submitted and admin-submitted flows)
  const renderActionButtons = () => (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} justifyContent="space-between">
        {action === 'approve' && (
          <Button
            variant="contained"
            color="warning"
            onClick={() => setAction('request_revision')}
            disabled={loading || isDisabled}
            sx={{
              ...actionButtonSx,
              color: '#D4321C',
            }}
          >
            {loading ? 'Processing...' : 'Request a Change'}
          </Button>
        )}
        {action === 'request_revision' && (
          <Box
            display="flex"
            flexDirection="row"
            width="100%"
            gap={1}
            justifyContent="flex-end"
          >
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={() => {
                setAction('approve');
                setReasons([]);
              }}
              disabled={loading || isDisabled}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.secondary,
              }}
            >
              Cancel Change Request
            </Button>
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={handleRejectPosting}
              disabled={loading || isDisabled}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.warning,
              }}
            >
              {loading ? 'Processing...' : 'Send to Creator'}
            </Button>
          </Box>
        )}
        {action === 'approve' && (
          <Button
            variant="contained"
            color="success"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={loading || isDisabled}
            sx={{
              ...actionButtonSx,
              color: '#1ABF66',
            }}
          >
            {loading ? 'Processing...' : 'Approve'}
          </Button>
        )}
      </Stack>
      {action === 'request_revision' && (
        <FormControl
          fullWidth
          style={{ backgroundColor: '#fff', borderRadius: 10 }}
          hiddenLabel
          size="small"
        >
          <Select
            multiple
            value={reasons}
            onChange={(e) => setReasons(e.target.value)}
            displayEmpty
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <span style={{ color: '#999' }}>Change Request Reasons</span>;
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 35 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              );
            }}
          >
            {posting_link_options_changes.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );

  return (
    <Box sx={{ flex: '0 0 auto' }}>
      <Box>
        {/* Header row: "Posting Link" title + "Review Submission" button */}
        {!isPosted && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#636366' }}>
              Posting Link
            </Typography>
            {onReviewSubmission && (
              <Typography
                component="button"
                onClick={onReviewSubmission}
                sx={{
                  pl: 2,
                  pr: 0,
                  py: 1,
                  bgcolor: 'transparent',
                  fontWeight: 800,
                  fontSize: 14,
                  color: '#919191',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                Review Submission
              </Typography>
            )}
          </Box>
        )}

        {isPosted && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box display="flex">
              <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ mr: 0.5 }}>
                Date approved:
              </Typography>
              <Typography variant="caption" color="#636366">
                {new Date(submission.updatedAt).toLocaleDateString('en-GB')}
              </Typography>
            </Box>
           {(onReviewSubmission && <Typography
              component="button"
              onClick={onReviewSubmission}
              sx={{
                pl: 2,
                pr: 0,
                py: 1,
                bgcolor: 'transparent',
                fontWeight: 800,
                fontSize: 14,
                color: '#919191',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              View Feedback
            </Typography>)}
          </Box>
        )}

        {!isClient && !isPosted && postingLinkAddedByAdmin && submission.content && (
          <Box display="flex" sx={{ mb: 1 }}>
            <Typography variant="caption" color="#636366" sx={{ fontStyle: 'italic' }}>
              Added by admin: {submission.admin?.user?.name} • Requires superadmin approval
            </Typography>
          </Box>
        )}

        {submission.content && (
          <Box
            sx={{
              p: 2,
              border: '1px solid #E7E7E7',
              borderRadius: 1,
              bgcolor: 'background.paper',
              mb: 2,
            }}
          >
            <Link
              href={submission.content}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                wordBreak: 'break-all',
                color: '#0062CD',
                textDecoration: 'underline',
                fontSize: 14,
                '&:hover': {
                  color: '#004A9F',
                },
              }}
            >
              {submission.content}
            </Link>
          </Box>
        )}

        {/* Posting link submitted by creator */}
        {!isClient && !postingLinkAddedByAdmin && !isPosted && submission.content && renderActionButtons()}

        {/* Posting link to be approved by superadmin */}
        {!isClient && postingLinkAddedByAdmin && !isPosted && submission.content && isSuperAdmin && renderActionButtons()}

        {/* No posting link yet — admin can enter one */}
        {!isClient && !submission.content && (
          <Box display="flex" flexDirection="column">
            <TextField
              fullWidth
              size="medium"
              placeholder="Enter posting link URL..."
              value={postingLink}
              onChange={(e) => setPostingLink(e.target.value)}
              disabled={loading || isDisabled}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
            <Box alignSelf="flex-end">
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmitPostingLink}
                disabled={loading || isDisabled}
                sx={{
                  ...actionButtonSx,
                  color: '#1ABF66',
                }}
              >
                {loading ? 'Saving...' : 'Submit'}
              </Button>
            </Box>
          </Box>
        )}

        <ConfirmDialogV2
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          title={actionText}
          isPosting
          emoji={
            <Avatar
              src="/assets/images/modals/approve.png"
              alt="approve"
              sx={{
                width: 80,
                height: 80,
              }}
            />
          }
          content=""
          action={
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirmApprove}
              disabled={loading}
            >
              {actionText}
            </Button>
          }
        />
      </Box>
    </Box>
  );
}

PostingLinkSection.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
  onViewLogs: PropTypes.any,
  onReviewSubmission: PropTypes.func,
  isDisabled: PropTypes.bool,
  isClient: PropTypes.bool,
};
