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
  IconButton,
  FormControl,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import TypographyMotion from 'src/components/animate/motion-typography';
import ConfirmDialogV2 from 'src/components/custom-dialog/confirm-dialog-v2';

import { BUTTON_STYLES } from './submission-styles';
import { posting_link_options_changes } from '../constants';

const MAX_POSTING_LINKS = 2;

export default function PostingLinkSection({
  submission,
  onUpdate,
  onViewLogs,
  onReviewSubmission,
  isDisabled = false,
  isClient = false,
}) {
  const { user } = useAuthContext();
  const [postingLinks, setPostingLinks] = useState(
    submission.videos?.length ? submission.videos : ['']
  );
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [action, setAction] = useState('approve');
  const [reasons, setReasons] = useState([]);
  const [newPostedLink, setNewPostedLink] = useState('');
  const [addLinkLoading, setAddLinkLoading] = useState(false);

  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isSuperAdmin = userRole.toLowerCase() === 'superadmin';

  const handlePostingLinkChange = useCallback((index, value) => {
    setPostingLinks((prev) => prev.map((link, i) => (i === index ? value : link)));
  }, []);

  const handleAddPostingLinkField = useCallback(() => {
    setPostingLinks((prev) => (prev.length >= MAX_POSTING_LINKS ? prev : [...prev, '']));
  }, []);

  const handleRemovePostingLinkField = useCallback((index) => {
    setPostingLinks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmitPostingLink = useCallback(async () => {
    const trimmedLinks = postingLinks.map((link) => link.trim()).filter(Boolean);

    if (trimmedLinks.length === 0) {
      enqueueSnackbar('Please enter a posting link', { variant: 'warning' });
      return;
    }

    const allValid = trimmedLinks.every((link) => {
      try {
        // eslint-disable-next-line no-new
        new URL(link);
        return true;
      } catch {
        return false;
      }
    });

    if (!allValid) {
      enqueueSnackbar('Please enter a valid URL', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.put('/api/submissions/v4/posting-link', {
        submissionId: submission.id,
        postingLinks: trimmedLinks,
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
  }, [postingLinks, submission.id, onUpdate]);

  const handleAddLinkToPostedSubmission = useCallback(async () => {
    const trimmed = newPostedLink.trim();

    if (!trimmed) {
      enqueueSnackbar('Please enter a posting link', { variant: 'warning' });
      return;
    }

    try {
      // eslint-disable-next-line no-new
      new URL(trimmed);
    } catch {
      enqueueSnackbar('Please enter a valid URL', { variant: 'error' });
      return;
    }

    try {
      setAddLinkLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/add', {
        submissionId: submission.id,
        postingLink: trimmed,
      });

      enqueueSnackbar('Posting link added successfully', { variant: 'success' });
      setNewPostedLink('');
      onUpdate?.();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to add posting link', {
        variant: 'error',
      });
    } finally {
      setAddLinkLoading(false);
    }
  }, [newPostedLink, submission.id, onUpdate]);

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
          <Box display="flex" flexDirection="row" width="100%" gap={1} justifyContent="flex-end">
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
            {!isClient && (
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#636366' }}>
                Posting Link
              </Typography>
            )}
            {onReviewSubmission && (
              <TypographyMotion
                component="button"
                onClick={onReviewSubmission}
                initial={{ scale: 1 }}
                whileHover={{
                  scale: 1.1,
                  transition: { duration: 0.1 },
                }}
                transition={{ duration: 0.1 }}
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: 'transparent',
                  fontWeight: 800,
                  fontSize: 14,
                  color: ['SENT_TO_CLIENT', 'CLIENT_FEEDBACK'].includes(submission.status)
                    ? '#1340FF'
                    : '#919191',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  textUnderlineOffset: 4,
                }}
              >
                View Feedback
              </TypographyMotion>
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
            {onReviewSubmission && (
              <TypographyMotion
                component="button"
                onClick={onReviewSubmission}
                initial={{ scale: 1 }}
                whileHover={{
                  scale: 1.1,
                  transition: { duration: 0.1 },
                }}
                transition={{ duration: 0.1 }}
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: 'transparent',
                  fontWeight: 800,
                  fontSize: 14,
                  color: ['SENT_TO_CLIENT', 'CLIENT_FEEDBACK'].includes(submission.status)
                    ? '#1340FF'
                    : '#919191',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  textUnderlineOffset: 4,
                }}
              >
                View Feedback
              </TypographyMotion>
            )}
          </Box>
        )}
        {/* Admin can add another posting link even after the submission is POSTED — no approval step */}
        {!isClient && isPosted && (submission.videos?.length || 0) < MAX_POSTING_LINKS && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add another posting link..."
              value={newPostedLink}
              onChange={(e) => setNewPostedLink(e.target.value)}
              disabled={addLinkLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
            <Button
              variant="contained"
              color="success"
              onClick={handleAddLinkToPostedSubmission}
              disabled={addLinkLoading}
              sx={{
                ...actionButtonSx,
                color: '#1ABF66',
                whiteSpace: 'nowrap',
              }}
            >
              {addLinkLoading ? 'Adding...' : '+ Add Link'}
            </Button>
          </Stack>
        )}
        {!isClient && !isPosted && postingLinkAddedByAdmin && submission.content && (
          <Box display="flex" sx={{ mb: 1 }}>
            <Typography variant="caption" color="#636366" sx={{ fontStyle: 'italic' }}>
              Added by admin: {submission.admin?.user?.name} • Requires superadmin approval
            </Typography>
          </Box>
        )}

        {/* The posting link(s) themselves are part of the internal flow — clients only see them once POSTED */}
        {submission.content && (!isClient || isPosted) && (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {(submission.videos?.length ? submission.videos : [submission.content]).map((link) => (
              <Box
                key={link}
                sx={{
                  p: 2,
                  border: '1px solid #E7E7E7',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <Link
                  href={link}
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
                  {link}
                </Link>
              </Box>
            ))}
          </Stack>
        )}
        {/* Posting link submitted by creator */} {/* To be review */}
        {!isClient &&
          !postingLinkAddedByAdmin &&
          !isPosted &&
          submission.content &&
          renderActionButtons()}
        {/* Posting link to be approved by superadmin */}
        {!isClient &&
          postingLinkAddedByAdmin &&
          !isPosted &&
          submission.content &&
          isSuperAdmin &&
          renderActionButtons()}
        {/* No posting link yet — admin can enter one (or two) */}
        {!isClient && !submission.content && (
          <Box display="flex" flexDirection="column">
            <Stack spacing={1} sx={{ mb: 2 }}>
              {postingLinks.map((link, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    size="medium"
                    placeholder="Enter posting link URL..."
                    value={link}
                    onChange={(e) => handlePostingLinkChange(index, e.target.value)}
                    disabled={loading || isDisabled}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  />
                  {index > 0 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemovePostingLinkField(index)}
                      disabled={loading || isDisabled}
                      aria-label="Remove posting link"
                    >
                      <Iconify icon="eva:close-fill" />
                    </IconButton>
                  )}
                </Stack>
              ))}
              {postingLinks.length < MAX_POSTING_LINKS && (
                <Button
                  size="small"
                  startIcon={<Iconify icon="eva:plus-fill" />}
                  onClick={handleAddPostingLinkField}
                  disabled={loading || isDisabled}
                  sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                >
                  Add another link
                </Button>
              )}
            </Stack>
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
