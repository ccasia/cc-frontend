import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { Box, Stack, Button, TextField, Typography, Link, Select, MenuItem, FormControl, Chip, Avatar } from '@mui/material';
import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import ConfirmDialogV2 from 'src/components/custom-dialog/confirm-dialog-v2';

import { BUTTON_STYLES } from './submission-styles';
import { posting_link_options_changes } from '../constants';

export default function PostingLinkSection({ submission, onUpdate, onViewLogs }) {
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
        action: 'reject',
        reasons
      });

      enqueueSnackbar('Change request sent successfully', { variant: 'success' });
      setAction('approve');
      setReasons([]);
      onUpdate?.();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to send change request', { variant: 'error' });
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

  return (
    <Box sx={{ flex: '0 0 auto' }}>
      <Box>
        {isPosted && (
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box display="flex">
              <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ mr: 0.5 }}>
                Date approved:
              </Typography>
              <Typography variant="caption" color="#636366">
                {new Date(submission.updatedAt).toLocaleDateString('en-GB')}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="text"
              onClick={onViewLogs}
              sx={{
                fontSize: 12,
                color: '#919191',
                p: 0,
                minWidth: 'auto',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              view logs
            </Button>
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

        {/* Posting link submitted by creator */}
        {!postingLinkAddedByAdmin && !isPosted && submission.content && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {action === 'approve' && (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={() => setAction('request_revision')}
                  disabled={loading}
                  sx={{
                    ...BUTTON_STYLES.base,
                    ...BUTTON_STYLES.warning,
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
                    disabled={loading}
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
                    disabled={loading}
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
                  size="small"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={loading}
                  sx={{
                    ...BUTTON_STYLES.base,
                    ...BUTTON_STYLES.success,
                  }}
                >
                  {loading ? 'Processing...' : 'Approve'}
                </Button>
              )}
            </Stack>
            {action === 'request_revision' && (
              <FormControl fullWidth style={{ backgroundColor: '#fff', borderRadius: 10 }} hiddenLabel size="small">
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
        )}

        {/* Posting link to be approved by superadmin */}
        {postingLinkAddedByAdmin && !isPosted && submission.content && isSuperAdmin && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {action === 'approve' && (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={() => setAction('request_revision')}
                  disabled={loading}
                  sx={{
                    ...BUTTON_STYLES.base,
                    ...BUTTON_STYLES.warning,
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
                    disabled={loading}
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
                    disabled={loading}
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
                  size="small"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={loading}
                  sx={{
                    ...BUTTON_STYLES.base,
                    ...BUTTON_STYLES.success,
                  }}
                >
                  {loading ? 'Processing...' : 'Approve'}
                </Button>
              )}
            </Stack>
            {action === 'request_revision' && (
              <FormControl fullWidth style={{ backgroundColor: '#fff', borderRadius: 10 }} hiddenLabel size="small">
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
        )}

        {/* Posting link added by admin */}
        {!submission.content && (
          <Box display="flex" flexDirection="column">
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" fontWeight="bold" color="#636366">
                Posting Link
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={onViewLogs}
                sx={{
                  fontSize: 12,
                  color: '#919191',
                  p: 0,
                  minWidth: 'auto',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                view logs
              </Button>
            </Box>
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
            <Box alignSelf="flex-end">
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

        <ConfirmDialogV2
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          title={actionText}
          isPosting={true}
          emoji={
            <Avatar
              src='/assets/images/modals/approve.png'
              alt='approve'
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
};
