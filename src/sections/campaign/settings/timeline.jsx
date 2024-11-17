/* eslint-disable react/prop-types */
import * as Yup from 'yup';
import { m } from 'framer-motion';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
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
import { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import TimelineTypeModal from './timeline-type-modal';

// eslint-disable-next-line react/prop-types
const Timeline = ({ timelineType, isSmallScreen }) => {
  const { data: timelines, isLoading } = useGetAllTimelineType();
  const [, setQuery] = useState('');

  const { data: defaultTimelines, isLoading: defaultTimelineLoading } = useGetDefaultTimeLine();

  const errorTimeline = useBoolean();
  const timelineModal = useBoolean();

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
        for: Yup.string().required('Field is required'),
      })
    ),
  });

  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      timeline: [{ timeline_type: { id: '', name: '' }, duration: undefined, for: '' }],
    },
  });

  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { isDirty, isSubmitting },
  } = methods;

  const { fields, remove, append, insert } = useFieldArray({
    control,
    name: 'timeline',
  });

  useEffect(() => {
    if (!defaultTimelineLoading && defaultTimelines.length > 0) {
      reset({
        timeline: defaultTimelines
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            timeline_type: { id: item.timelineType.id, name: item.timelineType.name } || {
              id: '',
              name: '',
            },
            duration: item.duration || undefined,
            for: item.for || '',
          })),
      });
    }
  }, [reset, defaultTimelineLoading, defaultTimelines]);

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
  };

  const handleRemove = (index, item) => {
    if (index < fields.length - 1) {
      setValue(`timeline[${index + 1}]`, {
        timeline_type: test[index + 1].timeline_type,
        duration: test[index + 1].duration,
        for: test[index + 1].for,
      });
    }
    remove(index);
  };

  // Options
  const existingIds = test.length && test.map((elem) => elem.timeline_type?.id);
  const options =
    !isLoading &&
    timelines
      .filter((timeline) => !existingIds?.includes(timeline?.id))
      .map((elem) => ({ name: elem.name, id: elem.id }));

  return (
    <>
      <Box height={1}>
        {/* <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Button
              onClick={timelineModal.onTrue}
              variant="contained"
              size="small"
              startIcon={<Iconify icon="material-symbols-light:manage-history" />}
              sx={{
                ml: 'auto',
              }}
            >
              Manage Timeline Type
            </Button>

            <Stack spacing={2} flexGrow={1}>
            {fields.map((item, index) => (
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
                      onChange={(event, newValue) => {
                        console.log(newValue);
                        handleChange(newValue, index);
                        setQuery(newValue);
                      }}
                      fullWidth
                      freeSolo
                      options={options}
                      getOptionLabel={(option) => option.name}
                      label="Timeline Type"
                      filterOptions={(a, state) => {
                        const filtered = a.filter((option) =>
                          option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                        );

                        if (
                          state.inputValue !== '' &&
                          !options.some((option) => option.name === state.inputValue)
                        ) {
                          filtered.push({ name: `Create new: ${state.inputValue}` });
                        }

                        return filtered;
                      }}
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
            ))}
          </Stack>

            <Box
              sx={{
                mt: 2,
                textAlign: 'end',
              }}
            >
              <LoadingButton
                variant="outlined"
                color="primary"
                type="submit"
                fullWidth={!!isSmallScreen}
                disabled={!isDirty}
                loading={isSubmitting}
              >
                Save
              </LoadingButton>
            </Box>
          </Stack>
        </FormProvider> */}

        <FormProvider {...methods}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ height: 1 }}>
            <Stack spacing={2} overflow="hidden">
              <Button
                onClick={timelineModal.onTrue}
                variant="contained"
                size="small"
                startIcon={<Iconify icon="material-symbols-light:manage-history" />}
                sx={{
                  ml: 'auto',
                  flex: 1,
                }}
              >
                Manage Timeline Type
              </Button>

              <Stack
                spacing={2}
                maxHeight={460}
                overflow="auto"
                py={1}
                sx={{ scrollbarWidth: 'none' }}
              >
                {fields.map((item, index) => (
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
                          onChange={(event, newValue) => {
                            console.log(newValue);
                            handleChange(newValue, index);
                            setQuery(newValue);
                          }}
                          fullWidth
                          freeSolo
                          options={options}
                          getOptionLabel={(option) => option.name}
                          label="Timeline Type"
                          filterOptions={(a, state) => {
                            const filtered = a.filter((option) =>
                              option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                            );

                            if (
                              state.inputValue !== '' &&
                              !options.some((option) => option.name === state.inputValue)
                            ) {
                              filtered.push({ name: `Create new: ${state.inputValue}` });
                            }

                            return filtered;
                          }}
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
                ))}
              </Stack>

              <Box
                sx={{
                  textAlign: 'end',
                  flex: 1,
                }}
              >
                <LoadingButton
                  variant="outlined"
                  color="primary"
                  type="submit"
                  fullWidth={!!isSmallScreen}
                  disabled={!isDirty}
                  loading={isSubmitting}
                >
                  Save
                </LoadingButton>
              </Box>
            </Stack>
          </Box>
        </FormProvider>
      </Box>

      <TimelineTypeModal
        open={timelineModal.value}
        handleClose={timelineModal.onFalse}
        append={append}
      />
    </>
  );
};

export default Timeline;
