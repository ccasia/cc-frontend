/* eslint-disable react/prop-types */
import * as Yup from 'yup';
import React, { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { Box, Stack, Button, Divider, MenuItem, Typography, IconButton } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const Timeline = ({ timelineType, isSmallScreen }) => {
  // const schema = Yup.object().shape({
  //   openForPitch: Yup.number('Must be a number')
  //     .min(14, 'Minumum is 14 days')
  //     .max(30, 'Maximum is 30 days')
  //     .required('Open for pitch timeline is required'),
  //   filterPitch: Yup.number('Must be a number')
  //     .min(2, 'Minumum is 2 days')
  //     .max(3, 'Maximum is 3 days')
  //     .required('Filtering timeline is required'),
  //   shortlistCreator: Yup.number('Must be a number')
  //     .min(1, 'Minumum is 1 days')
  //     .max(2, 'Maximum is 2 days')
  //     .required('Shortlist creator timeline is required'),
  //   agreementSign: Yup.number('Must be a number')
  //     .min(1, 'Minumum is 1 days')
  //     .max(2, 'Maximum is 2 days')
  //     .required('Sign of agreement timeline is required'),
  //   firstDraft: Yup.number('Must be a number')
  //     .min(3, 'Minumum is 3 days')
  //     .max(5, 'Maximum is 5 days')
  //     .required('First draft timeline is required'),
  //   feedBackFirstDraft: Yup.number('Must be a number')
  //     .min(2, 'Minumum is 2 days')
  //     .max(3, 'Maximum is 3 days')
  //     .required('Feedback first draft timeline is required'),
  //   finalDraft: Yup.number('Must be a number')
  //     .min(2, 'Minumum is 2 days')
  //     .max(4, 'Maximum is 4 days')
  //     .required('Final draft timeline is required'),
  //   feedBackFinalDraft: Yup.number('Must be a number')
  //     .min(1, 'Minumum is 1 days')
  //     .max(2, 'Maximum is 2 days')
  //     .required('Feedback final draft timeline is required'),
  //   posting: Yup.number('Must be a number')
  //     .max(2, 'Maximum is 2 days')
  //     .required('Posting social media timeline is required'),
  //   qc: Yup.number('Must be a number').required('QC timeline is required'),
  // });

  // const defaultValues = {
  //   openForPitch: 0,
  //   filterPitch: 0,
  //   shortlistCreator: 0,
  //   agreementSign: 0,
  //   firstDraft: 0,
  //   feedBackFirstDraft: 0,
  //   finalDraft: 0,
  //   qc: 0,
  //   feedBackFinalDraft: 0,
  //   posting: 0,
  // };

  const schema = Yup.object().shape({
    timeline: Yup.array().of(
      Yup.object().shape({
        timeline_type: Yup.string().required('Required'),
        dependsOn: Yup.string().required('Required'),
        for: Yup.string().required('Required'),
      })
    ),
  });

  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      timeline: [{ timeline_type: '', dependsOn: '', for: '' }],
    },
  });

  const { handleSubmit, reset, control, watch } = methods;

  const timeline = watch('timeline');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'timeline',
  });

  // useEffect(() => {
  //   if (defaultTimeline.length > 0) {
  //     reset(defaultTimeline[0]);
  //   }
  // }, [defaultTimeline, reset]);

  useEffect(() => {
    if (timelineType.length) {
      reset({
        timeline: timelineType.map((elem) => ({
          timeline_type: elem.name,
          id: elem.id,
          for: elem.for,
          dependsOn: elem?.dependencies[0]?.dependsOnTimeline?.name || 'startDate',
          dependsOnId: elem?.dependencies[0]?.dependsOnTimeline?.id,
          dependenciesId: elem?.dependencies[0]?.id,
        })),
      });
    }
  }, [timelineType, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.updateTimelineType, data);
      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  return (
    <>
      <Typography variant="h5" mb={3}>
        Default Timeline
      </Typography>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        {/* <Box
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
                error={errors?.filterPitch}
                helperText={errors?.filterPitch && errors?.filterPitch?.message}
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
                error={errors?.shortlistCreator}
                helperText={errors?.shortlistCreator && errors?.shortlistCreator?.message}
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
                error={errors?.agreementSign}
                helperText={errors?.agreementSign && errors?.agreementSign?.message}
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
                error={errors?.firstDraft}
                helperText={errors?.firstDraft && errors?.firstDraft?.message}
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
                error={errors?.feedBackFirstDraft}
                helperText={errors?.feedBackFirstDraft && errors?.feedBackFirstDraft?.message}
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
                error={errors?.finalDraft}
                helperText={errors?.finalDraft && errors?.finalDraft?.message}
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
                error={errors?.qc}
                helperText={errors?.qc && errors?.qc?.message}
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
                error={errors?.feedBackFinalDraft}
                helperText={errors?.feedBackFinalDraft && errors?.feedBackFinalDraft?.message}
              />
            )}
          />

          <Controller
            name="posting"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Posting in social media"
                InputProps={{
                  endAdornment: <InputAdornment position="start">days</InputAdornment>,
                }}
                error={errors?.posting}
                helperText={errors?.posting && errors?.posting?.message}
              />
            )}
          />
        </Box> */}
        <Box
          display="grid"
          columnGap={2}
          rowGap={2}
          gridTemplateColumns={{
            sm: 'repeat(1, 1fr)',
          }}
          maxHeight={400}
          overflow="scroll"
          py={2}
        >
          {fields.map((item, index) => (
            <Box key={item.id}>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems="center">
                <RHFTextField
                  name={`timeline[${index}].timeline_type`}
                  label="Timeline Type"
                  placeholder="Eg: Open For Pitch"
                />
                <RHFSelect name={`timeline[${index}].dependsOn`} label="Depends On">
                  {timeline.map((elem) => (
                    <MenuItem value={elem?.timeline_type}>{elem?.timeline_type}</MenuItem>
                  ))}
                  <MenuItem value="startDate">Campaign Start Date</MenuItem>
                </RHFSelect>

                <RHFSelect name={`timeline[${index}].for`} label="For">
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="creator">Creator</MenuItem>
                </RHFSelect>

                <IconButton color="error" onClick={() => remove(index)}>
                  <Iconify icon="uil:trash" />
                </IconButton>
              </Stack>
              <Divider sx={{ borderStyle: 'dashed', mt: 2 }} />
            </Box>
          ))}
        </Box>

        <Button sx={{ mt: 1 }} onClick={() => append({ timeline_type: '' })}>
          Add New Timeline
        </Button>

        <Box
          sx={{
            mt: 2,
            textAlign: 'end',
            position: 'absolute',
            bottom: 20,
            right: 30,
          }}
        >
          <Button variant="outlined" color="primary" type="submit" fullWidth={!!isSmallScreen}>
            Save
          </Button>
        </Box>
      </FormProvider>
    </>
  );
};

export default Timeline;
