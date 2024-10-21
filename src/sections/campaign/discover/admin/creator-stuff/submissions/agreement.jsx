import React from 'react';
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Grid,
  Stack,
  Paper,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';

const Agreement = ({ campaign, submission, creator }) => {
  const modal = useBoolean();
  const methods = useForm({
    defaultValues: {
      feedback: '',
    },
  });

  const { reset, handleSubmit } = methods;

  const handleClick = async () => {
    try {
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'approve',
        userId: creator?.user?.id,
        submissionId: submission?.id,
        submission,
      });
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Faileddsadsa', {
        variant: 'error',
      });
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'reject',
        userId: creator?.user?.id,
        campaignTaskId: submission?.campaignTask?.id,
        submissionId: submission?.id,
        feedback: data.feedback,
        submission,
      });
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      modal.onFalse();
      reset();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      console.log(error);
      enqueueSnackbar('Failed', {
        variant: 'error',
      });
    }
  });

  const renderFeedbackForm = (
    <Dialog open={modal.value} onClose={modal.onFalse} maxWidth="xs" fullWidth>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Feedback</DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <RHFTextField
              name="feedback"
              label="Feedback"
              placeholder="Reason to reject"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              reset();
              modal.onFalse();
            }}
            size="small"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button type="submit" size="small" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Box component={Paper} p={1.5} position="sticky" top={80}>
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
          {submission?.status === 'IN_PROGRESS' && <EmptyContent title="No submission" />}
          {(submission?.status === 'PENDING_REVIEW' || submission?.status === 'APPROVED') && (
            <Box component={Paper} p={1.5}>
              <>
                <iframe
                  src={submission?.content}
                  style={{
                    borderRadius: 10,
                    width: '100%',
                    height: 900,
                  }}
                  title="AgreementForm"
                />
                {submission.status === 'PENDING_REVIEW' && (
                  <Stack direction="row" gap={1.5} justifyContent="end" mt={2}>
                    <Button
                      onClick={modal.onTrue}
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="mingcute:close-fill" />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleClick()}
                      variant="contained"
                      color="success"
                      startIcon={<Iconify icon="hugeicons:tick-03" />}
                    >
                      Approve
                    </Button>
                  </Stack>
                )}
                {renderFeedbackForm}
              </>
            </Box>
          )}
          {submission?.status === 'CHANGES_REQUIRED' && (
            <EmptyContent title="Waiting for another submission" />
          )}
          {/* {submission?.isReview && submission?.status === 'APPROVED' && (
            <Box component={Paper} position="relative" p={10}>
              <Stack gap={1.5} alignItems="center">
                <Image src="/assets/approve.svg" width={200} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Agreement has been reviewed
                </Typography>
              </Stack>
            </Box>
          )} */}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Agreement;

Agreement.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
