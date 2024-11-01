import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Stack,
  Paper,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

const Posting = ({ campaign, submission, creator }) => {
  const dialogApprove = useBoolean();
  const dialogReject = useBoolean();
  const [feedback, setFeedback] = useState('');
  const loading = useBoolean();

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

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Box component={Paper} p={1.5}>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
              <Stack spacing={1} justifyContent="space-evenly">
                <Typography variant="subtitle2">Due Date</Typography>
                <Typography variant="subtitle2">Status</Typography>
                <Typography variant="subtitle2">Date Submission</Typography>
                <Typography variant="subtitle2">Review on</Typography>
              </Stack>
              <Stack spacing={1} justifyContent="space-evenly">
                <Typography variant="subtitle2" color="text.secondary">
                  {dayjs(submission?.dueDate).format('ddd LL')}
                </Typography>
                <Label>{submission?.status}</Label>
                <Typography variant="subtitle2" color="text.secondary">
                  {submission?.submissionDate
                    ? dayjs(submission?.submissionDate).format('ddd LL')
                    : '-'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {submission?.isReview
                    ? dayjs(submission?.updatedAt).format('ddd LL')
                    : 'Pending Review'}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={9}>
          {submission?.status === 'NOT_STARTED' && <EmptyContent title="No submission." />}
          {submission?.status === 'REJECTED' && (
            <EmptyContent title="Waiting for another submission." />
          )}
          {submission?.status === 'PENDING_REVIEW' && (
            <>
              <Box component={Paper} p={1.5}>
                <Button
                  LinkComponent="a"
                  target="__blank"
                  href={submission?.content}
                  variant="contained"
                  startIcon={<Iconify icon="lucide:external-link" />}
                  fullWidth
                >
                  View Posting
                </Button>
              </Box>
              {submission?.status === 'PENDING_REVIEW' && (
                <Stack my={2} textAlign="end" direction="row" spacing={1} justifyContent="end">
                  <Button size="small" variant="outlined" onClick={dialogReject.onTrue}>
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={dialogApprove.onTrue}
                    endIcon={<Iconify icon="ic:round-check" />}
                  >
                    Approve
                  </Button>
                </Stack>
              )}
            </>
          )}
          {submission?.isReview && submission?.status === 'APPROVED' && (
            <Box component={Paper} position="relative" p={10}>
              <Stack gap={1.5} alignItems="center">
                <Image src="/assets/approve.svg" width={200} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Posting has been reviewed
                </Typography>
              </Stack>
            </Box>
          )}
        </Grid>
      </Grid>
      <Dialog open={dialogApprove.value}>
        <DialogTitle>Approve Posting?</DialogTitle>
        <DialogContent>
          Are you sure you want to approve this posting? Once approved, this action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={dialogApprove.onFalse} size="small" variant="outlined">
            Cancel
          </Button>
          <LoadingButton
            onClick={() => {
              onSubmit('APPROVED');
            }}
            size="small"
            variant="contained"
            loading={loading.value}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog open={dialogReject.value} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Posting?</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <DialogContentText>Please provide a feedback.</DialogContentText>
            <TextField
              label="Provide feedback"
              onChange={(e) => setFeedback(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialogReject.onFalse} size="small" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit('REJECTED');
            }}
            size="small"
            variant="contained"
          >
            Confirm
          </Button>
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
