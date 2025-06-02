import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import {
  Box,
  Grid,
  Stack,
  Paper,
  Button,
  Dialog,
  Avatar,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import EmptyContent from 'src/components/empty-content/empty-content';

const Posting = ({ campaign, submission, creator }) => {
  const dialogApprove = useBoolean();
  const dialogReject = useBoolean();
  const { user } = useAuthContext();
  const [feedback, setFeedback] = useState('');
  const loading = useBoolean();
  const postingDate = useBoolean();
  const [date, setDate] = useState({
    dueDate: submission?.endDate,
  });
  const loadingDate = useBoolean();

  const [dateError, setDateError] = useState({ dueDate: null });

  const onSubmit = async (type) => {
    let res;
    try {
      loading.onTrue();
      if (type === 'APPROVED') {
        res = await axiosInstance.patch(endpoints.submission.admin.posting, {
          submissionId: submission?.id,
          status: 'APPROVED',
        });
        dialogApprove.onFalse();
      } else {
        res = await axiosInstance.patch(endpoints.submission.admin.posting, {
          submissionId: submission?.id,
          status: 'REJECTED',
          feedback,
          feedbackId: submission?.feedback?.id,
        });
        dialogReject.onFalse();
      }
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      setFeedback('');
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  };

  const handleChangeDate = async (data) => {
    try {
      loadingDate.onTrue();
      const res = await axiosInstance.patch('/api/submission/posting', {
        endDate: data.dueDate,
        submissionId: submission.id,
      });

      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      postingDate.onFalse();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loadingDate.onFalse();
    }
  };

  useEffect(() => {
    if (dayjs(date.dueDate).isBefore(dayjs(), 'date')) {
      setDateError((prev) => ({ ...prev, dueDate: 'Due Date cannot be in the past' }));
    } else {
      setDateError((prev) => ({ ...prev, dueDate: null }));
    }
  }, [date]);

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid item xs={12}>
          <Box component={Paper} p={1.5} mb={2}>
            <Stack
              direction="row"
              spacing={3}
              sx={{ mb: 3, mt: -2 }}
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Date Submitted:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.submissionDate
                      ? dayjs(submission?.submissionDate).format('ddd, D MMM YYYY')
                      : '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Due:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.dueDate
                      ? dayjs(submission?.dueDate).format('ddd, D MMM YYYY')
                      : '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Reviewed On:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.isReview
                      ? dayjs(submission?.updatedAt).format('ddd, D MMM YYYY')
                      : '-'}
                  </Typography>
                </Stack>
              </Stack>
              <Button
                variant="outlined"
                onClick={postingDate.onTrue}
                disabled={isDisabled}
                sx={{
                  '&:disabled': {
                    display: 'none',
                  },
                }}
              >
                Change Posting Date
              </Button>
            </Stack>
          </Box>

          {submission?.status === 'NOT_STARTED' && <EmptyContent title="No submission." />}
          {submission?.status === 'REJECTED' && (
            <EmptyContent title="Waiting for another submission." />
          )}
          {submission?.status === 'PENDING_REVIEW' && (
            <>
              <Box
                component={Paper}
                p={1.5}
                sx={{
                  maxWidth: '100%',
                  overflow: 'visible',
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    mt: -2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    pb: 1,
                    width: '100%',
                    overflow: 'visible',
                    position: 'relative',
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        src={creator?.user?.photoURL}
                        alt={creator?.user?.name}
                        sx={{
                          width: 40,
                          height: 40,
                          border: '1px solid #e7e7e7',
                        }}
                      >
                        {creator?.user?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontSize: '1.05rem',
                          mt: -3,
                        }}
                      >
                        {creator?.user?.name}
                      </Typography>
                    </Stack>

                    <Box
                      sx={{
                        pl: 7,
                        maxWidth: '100%',
                        overflow: 'visible',
                      }}
                    >
                      <Box
                        sx={{
                          mt: -4.5,
                          maxWidth: '100%',
                          wordBreak: 'break-all',
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="a"
                          href={submission?.content}
                          target="_blank"
                          rel="noopener"
                          sx={{
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word',
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                            maxWidth: '100%',
                            display: 'inline-block',
                          }}
                        >
                          {submission?.content}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Stack my={2} textAlign="end" direction="row" spacing={1.5} justifyContent="end">
                <Button
                  onClick={dialogReject.onTrue}
                  disabled={isDisabled}
                  size="small"
                  variant="contained"
                  // startIcon={<Iconify icon="solar:close-circle-bold" />}
                  sx={{
                    bgcolor: '#FFFFFF',
                    border: 1.5,
                    borderRadius: 1.15,
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    color: '#D4321C',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#D4321C',
                    },
                    textTransform: 'none',
                    px: 2.5,
                    py: 1.2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    minWidth: '80px',
                    height: '45px',
                  }}
                >
                  Reject
                </Button>
                <LoadingButton
                  size="small"
                  onClick={dialogApprove.onTrue}
                  disabled={isDisabled}
                  variant="contained"
                  // startIcon={<Iconify icon="solar:check-circle-bold" />}
                  loading={loading.value}
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#1ABF66',
                    border: '1.5px solid',
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    borderRadius: 1.15,
                    px: 2.5,
                    py: 1.2,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#1ABF66',
                    },
                    fontSize: '1rem',
                    minWidth: '80px',
                    height: '45px',
                    textTransform: 'none',
                  }}
                >
                  Approve
                </LoadingButton>
              </Stack>
            </>
          )}
          {submission?.isReview && submission?.status === 'APPROVED' && (
            <Box component={Paper} p={1.5}>
              <Box
                sx={{
                  p: 3,
                  mt: -4.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  pb: 1,
                }}
              >
                <Box display="flex" flexDirection="column" gap={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      src={creator?.user?.photoURL}
                      alt={creator?.user?.name}
                      sx={{
                        width: 40,
                        height: 40,
                        border: '1px solid #e7e7e7',
                      }}
                    >
                      {creator?.user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontSize: '1.05rem',
                        mt: -3,
                      }}
                    >
                      {creator?.user?.name}
                    </Typography>
                  </Stack>

                  <Box sx={{ pl: 7 }}>
                    <Box sx={{ mt: -4.5 }}>
                      <Typography
                        variant="body2"
                        component="a"
                        href={submission?.content}
                        target="_blank"
                        rel="noopener"
                        sx={{
                          wordBreak: 'break-word',
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {submission?.content}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
      <Dialog
        open={dialogApprove.value}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '500px',
            borderRadius: 2,
            margin: '16px',
            overflowX: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
          }}
        >
          Approve Posting ✨
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <DialogContentText sx={{ fontSize: '0.925rem', fontWeight: 500 }}>
              Are you sure you want to approve this posting?
            </DialogContentText>
            <DialogContentText sx={{ fontSize: '0.925rem', fontWeight: 500 }}>
              Once approved, this action cannot be undone.
            </DialogContentText>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="body2"
                component="a"
                href={submission?.content}
                target="_blank"
                rel="noopener"
                sx={{
                  wordBreak: 'break-word',
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {submission?.content}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button
            onClick={dialogApprove.onFalse}
            size="small"
            sx={{
              bgcolor: 'white',
              border: 1.5,
              borderRadius: 1.15,
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              color: 'text.primary',
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#231F20',
              },
              textTransform: 'none',
              px: 2.5,
              py: 1.2,
              fontSize: '0.9rem',
              minWidth: '80px',
              height: '45px',
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={() => {
              onSubmit('APPROVED');
            }}
            size="small"
            variant="contained"
            loading={loading.value}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#1ABF66',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              px: 2.5,
              py: 1.2,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#1ABF66',
              },
              fontSize: '0.9rem',
              minWidth: '80px',
              height: '45px',
              textTransform: 'none',
            }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog
        open={dialogReject.value}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '500px',
            borderRadius: 2,
            margin: '16px',
            overflowX: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
          }}
        >
          Reject Posting 🫣
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <DialogContentText sx={{ fontSize: '0.925rem', fontWeight: 500 }}>
              Are you sure you want to reject this posting?
            </DialogContentText>
            <DialogContentText sx={{ fontSize: '0.925rem', fontWeight: 500 }}>
              Please provide a feedback for the creator.
            </DialogContentText>
            <TextField
              label="Provide a feedback"
              onChange={(e) => setFeedback(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button
            onClick={dialogReject.onFalse}
            size="small"
            sx={{
              bgcolor: 'white',
              border: 1.5,
              borderRadius: 1.15,
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              color: 'text.primary',
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#231F20',
              },
              textTransform: 'none',
              px: 2.5,
              py: 1.2,
              fontSize: '0.9rem',
              minWidth: '80px',
              height: '45px',
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={() => {
              onSubmit('REJECTED');
            }}
            size="small"
            variant="contained"
            loading={loading.value}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#1ABF66',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              px: 2.5,
              py: 1.2,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#1ABF66',
              },
              fontSize: '0.9rem',
              minWidth: '80px',
              height: '45px',
              textTransform: 'none',
            }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog
        open={postingDate.value}
        onClose={postingDate.onFalse}
        PaperProps={{
          sx: {
            borderRadius: 1,
          },
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography
            sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily }}
            variant="h4"
          >
            Change Due Date
          </Typography>
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{ sm: 'row' }} gap={2} py={1}>
              <DatePicker
                label="Due Date"
                value={dayjs(date.dueDate)}
                onChange={(val) => setDate((prev) => ({ ...prev, dueDate: val }))}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!dateError.dueDate,
                    helperText: dateError.dueDate,
                  },
                }}
                minDate={dayjs()}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined">Cancel</Button>
          <LoadingButton
            variant="contained"
            onClick={() => handleChangeDate(date)}
            disabled={!!dateError.dueDate}
            loading={loadingDate.value}
          >
            Change
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Posting;

Posting.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
