/* eslint-disable react/prop-types */
import * as Yup from 'yup';
import { m } from 'framer-motion';
import React, { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import {
  Box,
  Stack,
  Button,
  Divider,
  MenuItem,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetAllTimelineType from 'src/hooks/use-get-all-timeline';
import useGetDefaultTimeLine from 'src/hooks/use-get-default-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import TimelineTypeModal from './timeline-type-modal';

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

  const { data: timelines, isLoading } = useGetAllTimelineType();
  const { data: defaultTimelines, isLoading: defaultTimelineLoading } = useGetDefaultTimeLine();
  const errorTimeline = useBoolean();
  const timelineModal = useBoolean();

  console.log(defaultTimelines);

  const schema = Yup.object().shape({
    timeline: Yup.array().of(
      Yup.object().shape({
        timeline_type: Yup.object()
          .shape({
            id: Yup.string().required('Field is required'),
            name: Yup.string().required('Field is required'),
          })
          .required('Field is required'),

        duration: Yup.number().required('Field is required').integer('Field must be an integer'),
        dependsOn: Yup.string().required('Field is required'),
        for: Yup.string().required('Field is required'),
      })
    ),
  });

  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      timeline: [
        { timeline_type: { id: '', name: '' }, dependsOn: '', duration: undefined, for: '' },
      ],
    },
  });

  const { handleSubmit, reset, control, watch, setValue } = methods;

  const { fields, remove, append, insert } = useFieldArray({
    control,
    name: 'timeline',
  });

  useEffect(() => {
    if (!defaultTimelineLoading && defaultTimelines.length > 0) {
      // eslint-disable-next-line array-callback-return
      reset({
        timeline: defaultTimelines.map((item) => ({
          timeline_type: { id: item.timelineType.id, name: item.timelineType.name } || {
            id: '',
            name: '',
          },
          dependsOn:
            item.dependsOn.length < 1
              ? 'startDate'
              : item?.dependsOn[0]?.dependsOnTimeline?.timelineTypeId || '',
          duration: item.duration || undefined,
          for: item.for || '',
        })),
      });
    }
  }, [reset, defaultTimelineLoading, defaultTimelines]);

  // useEffect(() => {
  //   if (!isLoading && timelines) {
  //     reset({
  //       timeline: timelines.map((elem) => ({
  //         timeline_type: { id: elem.id, name: elem.name },
  //         dependsOn: '',
  //         duration: '',
  //         for: '',
  //       })),
  //     });
  //   }
  // }, [reset, isLoading, timelines]);
  const test = watch('timeline');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.updateOrCreateDefaultTimeline, data);
      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  const handleChange = (val, index) => {
    setValue(`timeline[${index}].timeline_type`, val);

    if (index === 0) {
      setValue(`timeline[0].dependsOn`, 'startDate');
    }

    if (index < fields.length - 1) {
      setValue(`timeline[${index + 1}].dependsOn`, val.id);
    }
  };

  const handleRemove = (index, item) => {
    if (index < fields.length - 1) {
      setValue(`timeline[${index + 1}]`, {
        dependsOn: item.dependsOn,
        timeline_type: test[index + 1].timeline_type,
        duration: test[index + 1].duration,
        for: test[index + 1].for,
      });
    }
    remove(index);
  };

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
          {fields.map((item, index) => {
            const existingIds = test.length && test.map((elem) => elem.timeline_type?.id);
            // const ada = getValues(`timeline[${index}].timelineType`);

            const options =
              !isLoading &&
              timelines
                .filter((timeline) => !existingIds?.includes(timeline?.id))
                .map((elem) => ({ name: elem.name, id: elem.id }));
            return (
              <Box
                key={item.id}
                component={m.div}
                initial={{ opacity: 0, top: 0.5 }}
                animate={{ opacity: 1, top: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems="center">
                  {!isLoading && (
                    <RHFAutocomplete
                      name={`timeline[${index}].timeline_type`}
                      // disabled
                      onChange={(event, newValue) => {
                        handleChange(newValue, index);
                      }}
                      fullWidth
                      options={options}
                      // options={
                      //   !isLoading && timelines.map((elem) => ({ name: elem.name, id: elem.id }))
                      // }
                      getOptionLabel={(option) => option.name}
                      label="Timeline Type"
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                          <MenuItem key={key} {...optionProps}>
                            {option.name}
                          </MenuItem>
                        );
                      }}
                      sx={{
                        '& .MuiInputBase-root': {
                          cursor: 'not-allowed', // Change cursor to indicate disabled state
                        },
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      helperText={
                        errorTimeline.value && (
                          <Typography variant="caption" color="error">
                            Please select other timeline
                          </Typography>
                        )
                      }
                    />
                  )}

                  <RHFSelect disabled name={`timeline[${index}].dependsOn`} label="Depends On">
                    {!isLoading &&
                      timelines.map((elem) => (
                        // <MenuItem key={elem?.id} value={elem?.id}>
                        <MenuItem key={elem?.id} value={elem?.id}>
                          {elem?.name}
                        </MenuItem>
                      ))}
                    <MenuItem value="startDate">Campaign Start Date</MenuItem>
                  </RHFSelect>

                  <RHFTextField
                    name={`timeline[${index}].duration`}
                    label="Duration"
                    type="number"
                    placeholder="Eg: 2"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">days</InputAdornment>,
                    }}
                  />

                  <RHFSelect name={`timeline[${index}].for`} label="For">
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="creator">Creator</MenuItem>
                  </RHFSelect>

                  <IconButton color="error" onClick={() => handleRemove(index, item)}>
                    <Iconify icon="uil:trash" />
                  </IconButton>
                </Stack>
                <Stack direction="row" alignItems="center" mt={2} gap={1}>
                  <IconButton
                    onClick={() => {
                      insert(index + 1, {
                        timeline_type: { id: '', name: '' },
                        dependsOn: test[index]?.timeline_type?.id,
                        duration: null,
                        for: '',
                      });
                    }}
                  >
                    <Iconify icon="carbon:add-filled" />
                  </IconButton>
                  <Divider sx={{ borderStyle: 'dashed', flexGrow: 1 }} />
                </Stack>
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            mt: 2,
            textAlign: 'end',
            position: 'absolute',
            bottom: 10,
            right: 30,
          }}
        >
          <Button variant="outlined" color="primary" type="submit" fullWidth={!!isSmallScreen}>
            Save
          </Button>
        </Box>
      </FormProvider>

      <Button
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
        }}
        onClick={timelineModal.onTrue}
        variant="contained"
        size="small"
        startIcon={<Iconify icon="material-symbols-light:manage-history" />}
      >
        Manage Timeline Type
      </Button>
      <TimelineTypeModal
        open={timelineModal.value}
        handleClose={timelineModal.onFalse}
        append={append}
      />
    </>
  );
};

export default Timeline;
