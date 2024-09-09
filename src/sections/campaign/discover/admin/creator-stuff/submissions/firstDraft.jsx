/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
/* eslint-disable no-undef */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Box,
  Grid,
  Paper,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Image from 'src/components/image';
import Label from 'src/components/label';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';
import { RHFTextField, RHFDatePicker, RHFMultiSelect } from 'src/components/hook-form';

const options_changes = [
  'Missing caption requirements',
  'Inverted logo',
  'Inverted brand name',
  'Audio not audible',
  'Video too dark',
  'Video too bright',
  'Mismatch of audio and video',
  'Frozen video',
  'Background too loud',
  'Voiceover not clear',
  'Audio not a good fit',
  'Audio too loud',
  'Speling in subtitles',
];

const FirstDraft = ({ campaign, submission, creator }) => {
  console.log(submission);
  const [type, setType] = useState('approve');
  const approve = useBoolean();
  const request = useBoolean();

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
    type: Yup.string(),
  });

  const normalSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
    schedule: Yup.object().shape({
      startDate: Yup.string().required('Start Date is required.'),
      endDate: Yup.string().required('End Date is required.'),
    }),
  });

  const methods = useForm({
    resolver: type === 'request' ? yupResolver(requestSchema) : yupResolver(normalSchema),
    defaultValues: {
      feedback: 'Thank you for submitting',
      type: '',
      reasons: [],
      schedule: {
        startDate: null,
        endDate: null,
      },
    },
  });

  const { handleSubmit, setValue, reset, watch } = methods;

  const scheduleStartDate = watch('schedule.startDate');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.submission.admin.draft, {
        ...data,
        submissionId: submission.id,
        userId: creator?.user?.id,
      });
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
      approve.onFalse();
      request.onFalse();
      reset();
    } catch (error) {
      enqueueSnackbar('Error submitting', {
        variant: 'error',
      });
      approve.onFalse();
      request.onFalse();
    }
  });

  const confirmationApproveModal = (open, onclose) => (
    <Dialog open={open} onClose={onclose}>
      <DialogTitle>Confirmation</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you ready to submit your response?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onclose}>Cancel</Button>
        <Button
          onClick={() => {
            setValue('type', 'approve');
            onSubmit();
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  const confirmationRequestModal = (open, onclose) => (
    <Dialog open={open} onClose={onclose}>
      <DialogTitle>Confirmation</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you ready to submit your response?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onclose}>Cancel</Button>
        <Button
          onClick={() => {
            setValue('type', 'request');
            onSubmit();
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

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
          {submission?.status === 'IN_PROGRESS' && !submission?.content ? (
            <EmptyContent title="No submission" />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <video
                  autoPlay
                  style={{ width: '100%', borderRadius: 10, margin: 'auto' }}
                  controls
                >
                  <source src={submission?.content} />
                </video>
                <Box component={Paper} p={1.5}>
                  <Typography variant="caption" color="text.secondary">
                    Caption
                  </Typography>
                  <Typography variant="subtitle1">{submission?.caption}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                {submission?.status === 'PENDING_REVIEW' && (
                  <Box component={Paper} p={1.5}>
                    {type === 'approve' && (
                      <FormProvider methods={methods} onSubmit={onSubmit}>
                        <Stack gap={1} mb={2}>
                          <Typography variant="subtitle1" mb={1} mx={1}>
                            Schedule This Post
                          </Typography>
                          <Stack direction="row" gap={3}>
                            <RHFDatePicker
                              name="schedule.startDate"
                              label="Start Date"
                              minDate={dayjs()}
                            />
                            <RHFDatePicker
                              name="schedule.endDate"
                              label="End Date"
                              minDate={dayjs(scheduleStartDate)}
                            />
                          </Stack>
                        </Stack>
                        <Typography variant="subtitle1" mb={1} mx={1}>
                          Comment For Creator
                        </Typography>
                        <Stack gap={2}>
                          <RHFTextField
                            name="feedback"
                            multiline
                            minRows={5}
                            placeholder="Comment"
                          />
                          <Stack alignItems="center" direction="row" gap={1} alignSelf="end">
                            <Typography
                              component="a"
                              onClick={() => {
                                setType('request');
                                setValue('type', 'request');
                                setValue('feedback', '');
                              }}
                              sx={{
                                color: (theme) => theme.palette.text.secondary,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                '&:hover': {
                                  color: (theme) => theme.palette.text.primary,
                                },
                              }}
                              variant="caption"
                            >
                              Request a change
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={approve.onTrue}
                            >
                              Approve
                            </Button>
                          </Stack>
                        </Stack>
                        {confirmationApproveModal(approve.value, approve.onFalse)}
                      </FormProvider>
                    )}
                    {type === 'request' && (
                      <>
                        <Typography variant="h6" mb={1} mx={1}>
                          Request Changes
                        </Typography>
                        <FormProvider methods={methods} onSubmit={onSubmit}>
                          <Stack gap={2}>
                            <RHFMultiSelect
                              name="reasons"
                              checkbox
                              chip
                              options={options_changes.map((item) => ({
                                value: item,
                                label: item,
                              }))}
                              label="Reasons"
                            />
                            <RHFTextField
                              name="feedback"
                              multiline
                              minRows={5}
                              placeholder="Feedback"
                            />

                            <Stack alignItems="center" direction="row" gap={1} alignSelf="end">
                              <Typography
                                component="a"
                                onClick={() => {
                                  setType('approve');
                                  setValue('type', 'approve');
                                  setValue('feedback', '');
                                  setValue('reasons', []);
                                }}
                                sx={{
                                  color: (theme) => theme.palette.text.secondary,
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: (theme) => theme.palette.text.primary,
                                  },
                                }}
                                variant="caption"
                              >
                                Back
                              </Typography>
                              <Button variant="contained" size="small" onClick={request.onTrue}>
                                Submit
                              </Button>
                            </Stack>
                          </Stack>

                          {confirmationRequestModal(request.value, request.onFalse)}
                        </FormProvider>
                      </>
                    )}
                  </Box>
                )}
                {submission?.isReview && (
                  <Box component={Paper} position="relative" p={10}>
                    <Stack gap={1.5} alignItems="center">
                      <Image src="/assets/approve.svg" width={200} />
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ textAlign: 'center' }}
                      >
                        First Draft has been reviewed
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default FirstDraft;

FirstDraft.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
