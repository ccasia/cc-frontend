/* eslint-disable jsx-a11y/media-has-caption */
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import React, { useState, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Card, Grid, Stack, Button, Tooltip, TextField, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';

const FirstDraft = ({ campaign, submission, user }) => {
  const [type, setType] = useState('approve');
  const { user } = useAuthContext();

  const campaignTasks = user?.user?.campaignTasks.filter(
    (task) => task?.campaignId === campaign.id
  );

  const requestSchema = Yup.object().shape({
    reasons: Yup.string().required('Reasons is required'),
  });

  const approveMethods = useForm({
    defaultValues: {
      comment: '',
    },
  });

  const requestMethods = useForm({
    resolver: yupResolver(requestSchema),
    defaultValues: {
      reasons: '',
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = requestMethods;

  //   Function to submit request edit
  const handleSubmitRequest = handleSubmit(async (data) => {
    try {
      const newData = {
        ...data,
        type: 'request',
        campaignTaskId: submission?.campaignTask?.id,
        creatorId: user?.user?.id,
        finalDraftId: campaignTasks.filter((value) => value.task === 'Final Draft')[0]?.id,
      };
      const res = await axiosInstance.patch(
        endpoints.campaign.draft.submitFeedBackFirstDraft,
        newData
      );
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Failed', {
        variant: 'error',
      });
    }
  });

  const isDisabled = useMemo(() => {
    return (
      user?.admin?.mode === 'advanced' && 
      !campaign?.campaignAdmin?.some(
        (adminObj) => adminObj?.admin?.user?.id === user?.id
      )
    );
  }, [user, campaign]);

  return (
    <Box>
      {submission ? (
        <>
          {submission?.campaignTask.status === 'CHANGES_REQUIRED' ? (
            // <Box>
            //   <video
            //     autoPlay
            //     width="100%"
            //     height="100%"
            //     controls
            //     style={{
            //       borderRadius: 10,
            //     }}
            //   >
            //     <source src={submission?.firstDraft?.draftURL} />
            //   </video>
            // </Box>
            <Box
              component="video"
              autoPlay
              controls
              sx={{
                maxHeight: '60vh',
                width: { xs: '70vw', sm: 'auto' },
                borderRadius: 2,
              }}
            >
              <source src={submission?.firstDraft?.draftURL} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {/* left side */}
              <Grid item xs={12} md={6} alignContent="center">
                <Stack
                  p={1.5}
                  spacing={2}
                  sx={{
                    boxShadow: (theme) => theme.shadows[2],
                    borderRadius: 1,
                  }}
                >
                  <Box>
                    <video
                      autoPlay
                      width="100%"
                      height="100%"
                      controls
                      style={{
                        borderRadius: 10,
                      }}
                    >
                      <source src={submission?.firstDraft?.draftURL} />
                    </video>
                  </Box>
                  <Typography variant="h5">{submission?.firstDraft?.caption}</Typography>
                </Stack>
              </Grid>
              {/* right side */}
              <Grid item xs={12} md={6}>
                {type === 'approve' ? (
                  <Box component={Card} p={2} position="relative">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">Give your feedback</Typography>
                      <Button size="small" variant="outlined" onClick={() => setType('request')} disabled={isDisabled}>
                        Request Edit
                      </Button>
                    </Stack>
                    <FormProvider methods={approveMethods}>
                      <Stack gap={3} alignItems="end" mt={3}>
                        <RHFTextField name="comment" label="Comments" />
                        <Tooltip title="Approve">
                          <Button size="small" color="success" variant="contained" disabled={isDisabled}>
                            Approve
                          </Button>
                        </Tooltip>
                      </Stack>
                    </FormProvider>
                  </Box>
                ) : (
                  <Box component={Card} p={2} position="relative">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">Give your feedback</Typography>
                      <Button size="small" variant="outlined" onClick={() => setType('approve')}>
                        Back
                      </Button>
                    </Stack>
                    <FormProvider methods={requestMethods} onSubmit={handleSubmitRequest}>
                      <Stack gap={3} alignItems="end" mt={3}>
                        <Controller
                          name="reasons"
                          control={control}
                          render={({ field, fieldState: { error } }) => (
                            <TextField
                              {...field}
                              fullWidth
                              placeholder="Reason For Requesting Edit"
                              value={field.value}
                              onChange={(event) => {
                                field.onChange(event.target.value);
                              }}
                              error={!!error}
                              helperText={errors.reasons && errors.reasons.message}
                            />
                          )}
                        />

                        <Tooltip title="Approve">
                          <Button size="small" color="success" variant="contained" type="submit" disabled={isDisabled}>
                            Request Edit
                          </Button>
                        </Tooltip>
                      </Stack>
                    </FormProvider>
                  </Box>
                )}

                {/* <FormProvider methods={methods}>
       <RHFTextField name="reason" />
     </FormProvider> */}
              </Grid>
            </Grid>
          )}
        </>
      ) : (
        <EmptyContent title="No submission " />
      )}
    </Box>
  );
};

export default FirstDraft;

FirstDraft.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  user: PropTypes.object,
};
