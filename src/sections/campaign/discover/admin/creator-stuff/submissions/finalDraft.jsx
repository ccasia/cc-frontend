/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
/* eslint-disable no-undef */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Box,
  Grid,
  Card,
  Paper,
  Stack,
  alpha,
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

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';

const FinalDraft = ({ campaign, submission, creator }) => {
  const [type, setType] = useState('approve');
  const approve = useBoolean();
  const request = useBoolean();

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
  });

  const methods = useForm({
    resolver: type === 'request' && yupResolver(requestSchema),
    defaultValues: {
      feedback: 'Thank you for submitting',
      type,
    },
  });

  const { handleSubmit, setValue, reset } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.submission.admin.draft, {
        ...data,
        submissionId: submission.id,
      });

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
        <Button onClick={onSubmit}>Confirm</Button>
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
        <Button onClick={onSubmit}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Due date
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dayjs(submission?.dueDate).format('ddd LL')}
          </Typography>
        </Stack>
      </Card>

      {submission?.status === 'IN_PROGRESS' && !submission?.content ? (
        <EmptyContent title="No submission" />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <video autoPlay style={{ width: '100%', borderRadius: 10, margin: 'auto' }} controls>
              <source src={submission?.content} />
            </video>
            <Box component={Paper} p={1.5}>
              <Typography variant="subtitle1">{submission?.caption}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            {submission?.status === 'PENDING_REVIEW' && (
              <Box component={Paper} p={1.5}>
                <Typography variant="h6" mb={1} mx={1}>
                  {type === 'approve' ? 'Approval' : 'Request Changes'}
                </Typography>
                <FormProvider methods={methods} onSubmit={onSubmit}>
                  <Stack gap={2}>
                    <RHFTextField
                      name="feedback"
                      multiline
                      minRows={5}
                      placeholder={type === 'approve' ? 'Comment' : 'Reason'}
                    />

                    {type === 'approve' ? (
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
                    ) : (
                      <Stack alignItems="center" direction="row" gap={1} alignSelf="end">
                        <Typography
                          component="a"
                          onClick={() => {
                            setType('approve');
                            setValue('type', 'approve');
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
                          Back
                        </Typography>
                        <Button variant="contained" size="small" onClick={request.onTrue}>
                          Submit
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                  {confirmationApproveModal(approve.value, approve.onFalse)}
                  {confirmationRequestModal(request.value, request.onFalse)}
                </FormProvider>
              </Box>
            )}
            {submission?.isReview && (
              <Box
                component={Paper}
                position="relative"
                p={10}
                sx={{
                  // border: 1,
                  // borderColor: (theme) => theme.palette.text.secondary,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.15),
                }}
              >
                <Stack gap={1.5} alignItems="center">
                  <Iconify icon="mdi:tick-circle-outline" color="success.main" width={40} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Final Draft has been reviewed
                  </Typography>
                </Stack>
              </Box>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default FinalDraft;

FinalDraft.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
