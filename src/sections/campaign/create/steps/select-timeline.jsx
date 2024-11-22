/* eslint-disable react/prop-types */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import { enqueueSnackbar } from 'notistack';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Button,
  Divider,
  MenuItem,
  FormLabel,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import useGetAllTimelineType from 'src/hooks/use-get-all-timeline';
import useGetDefaultTimeLine from 'src/hooks/use-get-default-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { RHFSelect, RHFTextField, RHFDatePicker, RHFAutocomplete } from 'src/components/hook-form';

const FormField = ({ label, children }) => (
  <Stack spacing={1} alignItems="start" width={200}>
    <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
      {label}
    </FormLabel>
    {children}
  </Stack>
);

const SelectTimeline = () => {
  const { data, isLoading } = useGetAllTimelineType();
  const { data: defaultTimelines, isLoading: defaultTimelineLoading } = useGetDefaultTimeLine();
  const [dateError, setDateError] = useState(false);

  const doneLoading = !isLoading && !defaultTimelineLoading;

  const [query, setQuery] = useState('');

  const { watch, setValue, control } = useFormContext();

  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const existingTimeline = watch('timeline');
  const campaignType = watch('campaignType');

  const timelineMethods = useFieldArray({
    name: 'timeline',
    control,
  });

  const { fields, remove, move, append } = timelineMethods;

  const timelineEndDate = existingTimeline[fields.length - 1]?.endDate;

  const processedTimelines = useMemo(() => {
    if (!defaultTimelines) return [];
    if (campaignType === 'ugc') {
      return defaultTimelines
        .filter((timeline) => timeline?.timelineType?.name !== 'Posting')
        .sort((a, b) => a.order - b.order)
        .map((elem) => ({
          timeline_type: { id: elem?.timelineType?.id, name: elem?.timelineType?.name },
          id: elem?.id,
          duration: elem.duration,
          for: elem?.for,
          startDate: '',
          endDate: '',
        }));
    }

    return defaultTimelines
      .sort((a, b) => a.order - b.order)
      .map((elem) => ({
        timeline_type: { id: elem?.timelineType?.id, name: elem.timelineType.name },
        id: elem?.id,
        duration: elem.duration,
        for: elem?.for,
        startDate: '',
        endDate: '',
      }));
  }, [defaultTimelines, campaignType]);

  const timelines = watch('timeline');

  const updateTimelineDates = useCallback(() => {
    let currentStartDate = dayjs(startDate);

    existingTimeline.forEach((item, index) => {
      const start = currentStartDate.format('ddd LL');
      const end = currentStartDate.add(parseInt(item.duration || 0, 10), 'day').format('ddd LL');

      setValue(`timeline[${index}].startDate`, start);
      setValue(`timeline[${index}].endDate`, end);

      currentStartDate = currentStartDate.add(parseInt(item.duration || 0, 10), 'day');
    });
  }, [existingTimeline, setValue, startDate]);

  const handleDurationChange = (index, value) => {
    setValue(`timeline[${index}].duration`, value);
    updateTimelineDates();
  };

  const handleRemove = (index, item) => {
    remove(index);
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    move(result.source.index, result.destination.index);
  };

  const handleAdd = () => {
    append({
      timeline_type: null,
      duration: null,
      for: '',
    });
  };

  const handleSubmitNewTimelineType = async (index) => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.timeline.createSingleTimelineType, {
        name: query,
      });
      mutate(endpoints.campaign.getTimelineType);
      setValue(`timeline[${index}].timeline_type`, { id: res.data.id, name: res.data.name });
      enqueueSnackbar('New Timeline Type Created');
    } catch (error) {
      enqueueSnackbar('Create Failed', {
        variant: 'error',
      });
    }
  };

  // Process end date based on start date
  useEffect(() => {
    if (timelineEndDate) {
      setValue('campaignEndDate', dayjs(timelineEndDate).format('ddd LL'));
    }
  }, [setValue, timelineEndDate]);

  useEffect(() => {
    if (existingTimeline.length < 1) {
      setValue('timeline', processedTimelines);
    }
  }, [processedTimelines, setValue, existingTimeline]);

  useEffect(() => {
    updateTimelineDates();
  }, [startDate, existingTimeline.length, updateTimelineDates]);

  useEffect(() => {
    // Check if campaign type is 'ugc' and remove timelines with 'Posting'
    if (existingTimeline?.length > 0) {
      if (campaignType === 'ugc') {
        const removedPostingTimelines =
          timelines?.filter((timeline) => timeline?.timeline_type?.name !== 'Posting') || []; // If timelines is undefined, default to an empty array

        setValue('timeline', removedPostingTimelines);
      }

      if (campaignType === 'normal') {
        setValue('timeline', processedTimelines);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignType]);

  const renderTimelineForm = (
    <Box display="grid" gridTemplateColumns={{ xs: 'repeat(1,fr)', md: 'repeat(1, 1fr)' }} gap={1}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="timeline">
          {(value) => (
            <Box {...value.droppableProps} ref={value.innerRef}>
              <Stack gap={3}>
                {fields.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        key={item.id}
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        sx={
                          snapshot.isDragging && {
                            bgcolor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.grey[900]
                                : theme.palette.grey[200],
                            borderRadius: 1.5,
                          }
                        }
                        {...provided.draggableProps.style}
                      >
                        <Stack direction="row" alignItems="center" gap={3}>
                          <IconButton
                            sx={{
                              border: 1,
                              borderColor: '#EBEBEB',
                              borderRadius: 1,
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              mt: 4,
                            }}
                            {...provided.dragHandleProps}
                          >
                            <Iconify icon="mingcute:dots-fill" width={20} />
                          </IconButton>
                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            gap={1}
                            flexGrow={1}
                            alignItems="center"
                          >
                            <FormField label="Timeline Name">
                              <RHFAutocomplete
                                disabled={!!timelines[index]?.timeline_type?.name}
                                name={`timeline[${index}].timeline_type`}
                                fullWidth
                                onInputChange={(e, val) => setQuery(val)}
                                noOptionsText={
                                  <Stack alignItems="center">
                                    <Typography>No Option</Typography>
                                    {query && (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        fullWidth
                                        sx={{ mt: 2, fontSize: 12 }}
                                        onClick={() => handleSubmitNewTimelineType(index)}
                                      >
                                        Create {query}
                                      </Button>
                                    )}
                                  </Stack>
                                }
                                options={data || []}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, a) => option.name === a.name}
                                renderOption={(props, option) => {
                                  const { key, ...optionProps } = props;
                                  return (
                                    <MenuItem key={key} {...optionProps}>
                                      {option.name}
                                    </MenuItem>
                                  );
                                }}
                                filterOptions={(a, state) => {
                                  const existingNames = timelines.map(
                                    (val) => val?.timeline_type?.name
                                  );
                                  const filtered = a.filter(
                                    (option) =>
                                      !existingNames.includes(option.name) &&
                                      option.name
                                        .toLowerCase()
                                        .includes(state.inputValue.toLowerCase())
                                  );

                                  return filtered;
                                }}
                              />
                            </FormField>
                            <FormField label="Assigned To">
                              <RHFSelect name={`timeline[${index}].for`} label="For">
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="creator">Creator</MenuItem>
                              </RHFSelect>
                            </FormField>
                            <FormField label="Duration">
                              <RHFTextField
                                name={`timeline[${index}].duration`}
                                type="number"
                                placeholder="Eg: 2"
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="start">days</InputAdornment>
                                  ),
                                }}
                                onChange={(e) => handleDurationChange(index, e.target.value)}
                              />
                            </FormField>
                            <FormField label="End Date">
                              <RHFTextField
                                name={`timeline[${index}].endDate`}
                                placeholder="End Date"
                                disabled
                              />
                            </FormField>

                            <IconButton
                              color="error"
                              sx={{
                                border: 1,
                                borderRadius: 1,
                                mt: 4,
                              }}
                              onClick={() => handleRemove(index, item)}
                            >
                              <Iconify icon="uil:trash" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Box>
                    )}
                  </Draggable>
                ))}
              </Stack>
              {value.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      <Button variant="contained" onClick={handleAdd}>
        Add new timeline
      </Button>
    </Box>
  );

  if (!doneLoading)
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );

  return (
    doneLoading && (
      <Box
        sx={{
          textAlign: 'center',
          position: 'relative',
          mt: 2,
        }}
      >
        <Label color="info" sx={{ p: 2, fontSize: 14 }}>
          Total days: {dayjs(endDate).diff(dayjs(startDate), 'day') || 0}
        </Label>
        <Stack gap={1} mt={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems="center">
            <RHFDatePicker name="campaignStartDate" label="Campaign Start Date" minDate={dayjs()} />
            <Iconify
              icon="pepicons-pop:line-x"
              width={20}
              sx={{
                transform: {
                  xs: 'rotate(90deg)',
                  md: 'rotate(180deg)',
                },
              }}
            />
            <RHFTextField name="campaignEndDate" disabled />
          </Stack>

          {dateError && (
            <Typography variant="caption" color="red">
              End date cannot be less than Start Date
            </Typography>
          )}
        </Stack>

        <Divider
          sx={{
            my: 2,
          }}
        />

        {renderTimelineForm}
      </Box>
    )
  );
};

export default memo(SelectTimeline);
