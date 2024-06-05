/* eslint-disable react/prop-types */
import * as Yup from 'yup';
import React, { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Button, TextField, Typography, InputAdornment } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

// eslint-disable-next-line react/prop-types
const Timeline = ({ defaultTimeline, isSmallScreen }) => {
  const schema = Yup.object().shape({
    openForPitch: Yup.number('Must be a number').required('Required'),
    filterPitch: Yup.number().required(),
    shortlistCreator: Yup.number().required(),
    agreementSign: Yup.number().required(),
    firstDraft: Yup.number().required(),
    feedBackFirstDraft: Yup.number().required(),
    finalDraft: Yup.number().required(),
    qc: Yup.number().required(),
    feedBackFinalDraft: Yup.number().required(),
  });

  const defaultValues = {
    openForPitch: '',
    filterPitch: '',
    shortlistCreator: '',
    agreementSign: '',
    firstDraft: '',
    feedBackFirstDraft: '',
    finalDraft: '',
    qc: '',
    feedBackFinalDraft: '',
  };

  const methods = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (defaultTimeline) {
      reset(defaultTimeline);
    }
  }, [defaultTimeline, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.updateDefaultTimeline, data);
      enqueueSnackbar(res.data.message, {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar(error.message, {
        variant: 'error',
      });
    }
  };

  return (
    <>
      <Typography variant="h5" mb={3}>
        Default Timeline
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          display="grid"
          columnGap={2}
          rowGap={2}
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
          }}
        >
          <Controller
            name="openForPitch"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Open For Pitches"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
                error={errors?.openForPitch}
                helperText={errors?.openForPitch && errors?.openForPitch?.message}
              />
            )}
          />
          <Controller
            name="filterPitch"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Filtering of pitches by CC"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
              />
            )}
          />

          <Controller
            name="shortlistCreator"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Shortlisting of creators by brand"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
              />
            )}
          />

          <Controller
            name="agreementSign"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Signing of agreement"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
              />
            )}
          />

          <Controller
            name="firstDraft"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="First draft from creators"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
              />
            )}
          />

          <Controller
            name="feedBackFirstDraft"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Feedback on first draft by brand"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
              />
            )}
          />

          <Controller
            name="finalDraft"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Final draft from creators"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
              />
            )}
          />

          <Controller
            name="qc"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="QC of drafts by CC"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
              />
            )}
          />

          <Controller
            name="feedBackFinalDraft"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Feedback on final draft by brand"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
              />
            )}
          />
        </Box>
        <Box
          sx={{
            mt: 2,
            textAlign: 'end',
          }}
        >
          <Button variant="outlined" color="primary" type="submit" fullWidth={!!isSmallScreen}>
            Save
          </Button>
        </Box>
      </form>
    </>
  );
};

export default Timeline;
