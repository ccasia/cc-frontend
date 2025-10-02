import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { Box, Stack, Button, TextField, Typography, Link } from '@mui/material';
import axiosInstance from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';
import { BUTTON_STYLES } from './submission-styles';

export default function PostingLinkSection({ submission, onUpdate }) {
  const { user } = useAuthContext();
  const [postingLink, setPostingLink] = useState(submission.content || '');
  const [loading, setLoading] = useState(false);

  const userRole = user?.admin?.role?.name || user?.role?.name || user?.role || '';
  const isSuperAdmin = userRole.toLowerCase() === 'superadmin';

  const handleSubmitPostingLink = useCallback(async () => {
    if (!postingLink.trim()) {
      enqueueSnackbar('Please enter a posting link', { variant: 'warning' });
      return;
    }

    try {
      new URL(postingLink.trim());
    } catch {
      enqueueSnackbar('Please enter a valid URL', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.put('/api/submissions/v4/posting-link', {
        submissionId: submission.id,
        postingLink: postingLink.trim()
      });

      enqueueSnackbar('Posting link updated successfully', { variant: 'success' });
      onUpdate?.();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update posting link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [postingLink, submission.id, onUpdate]);

  const handleApprovePosting = useCallback(async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/approve', {
        submissionId: submission.id,
        action: 'approve'
      });

      enqueueSnackbar('Posting link approved successfully', { variant: 'success' });
      onUpdate?.();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve posting link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [submission.id, onUpdate]);

  const handleRejectPosting = useCallback(async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/submissions/v4/posting-link/approve', {
        submissionId: submission.id,
        action: 'reject'
      });

      enqueueSnackbar('Posting link rejected successfully', { variant: 'success' });
      onUpdate?.();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to reject posting link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [submission.id, onUpdate]);

  const isPosted = submission.status === 'POSTED';
  const postingLinkAddedByAdmin = Boolean(submission.admin?.userId);

  return (
    <Box sx={{ flex: '0 0 auto' }}>
      <Box>
        {isPosted && (
          <Box display="flex" sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ mr: 0.5 }}>
              Date approved:
            </Typography>
            <Typography variant="caption" color="#636366">
              {new Date(submission.updatedAt).toLocaleDateString('en-GB')}
            </Typography>
          </Box>
        )}

        {!isPosted && postingLinkAddedByAdmin && submission.content && (
          <Box display="flex" sx={{ mb: 1 }}>
            <Typography variant="caption" color="#636366" sx={{ fontStyle: 'italic' }}>
              Added by admin: {submission.admin?.user?.name} • Requires superadmin approval
            </Typography>
          </Box>
        )}

        {submission.content && (
          <Box sx={{
            p: 2,
            border: '1px solid #E7E7E7',
            borderRadius: 1,
            bgcolor: 'background.paper',
            mb: 2
          }}>
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
                  color: '#004A9F'
                }
              }}
            >
              {submission.content}
            </Link>
          </Box>
        )}

        {!postingLinkAddedByAdmin && !isPosted && submission.content && (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={handleRejectPosting}
              disabled={loading}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.warning,
              }}
            >
              {loading ? 'Processing...' : 'Request a Change'}
            </Button>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={handleApprovePosting}
              disabled={loading}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.success,
              }}
            >
              {loading ? 'Processing...' : 'Approve'}
            </Button>
          </Stack>
        )}

        {postingLinkAddedByAdmin && !isPosted && submission.content && isSuperAdmin && (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={handleRejectPosting}
              disabled={loading}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.warning,
              }}
            >
              {loading ? 'Processing...' : 'Request a Change'}
            </Button>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={handleApprovePosting}
              disabled={loading}
              sx={{
                ...BUTTON_STYLES.base,
                ...BUTTON_STYLES.success,
              }}
            >
              {loading ? 'Processing...' : 'Approve'}
            </Button>
          </Stack>
        )}

        {!submission.content && (
          <Box display={'flex'} flexDirection={'column'}>
            <Typography variant="caption" fontWeight="bold" color="#636366">
              Posting Link
            </Typography>
            <TextField
              fullWidth
              size="medium"
              placeholder="Enter posting link URL..."
              value={postingLink}
              onChange={(e) => setPostingLink(e.target.value)}
              disabled={loading}
              sx={{
                mt: 1,
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
            <Box alignSelf={'flex-end'}>
              <Button
                variant="contained"
                color="success"
                size='small'
                onClick={handleSubmitPostingLink}
                disabled={loading}
                sx={{
                  display: 'flex',
                  ...BUTTON_STYLES.base,
                  ...BUTTON_STYLES.success
                }}
              >
                {loading ? 'Saving...' : 'Submit'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

PostingLinkSection.propTypes = {
  submission: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
};
