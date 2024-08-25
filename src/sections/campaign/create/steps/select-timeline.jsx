/* eslint-disable react/prop-types */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect, useCallback } from 'react';
import { Droppable, Draggable, DragDropContext } from 'react-beautiful-dnd';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Divider,
  MenuItem,
  Typography,
  IconButton,
  DialogContent,
  InputAdornment,
} from '@mui/material';
import {
  Timeline,
  TimelineDot,
  TimelineItem,
  TimelineContent,
  TimelineConnector,
  TimelineSeparator,
  TimelineOppositeContent,
} from '@mui/lab';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetAllTimelineType from 'src/hooks/use-get-all-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFSelect, RHFTextField, RHFDatePicker, RHFAutocomplete } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const SelectTimeline = ({
  defaultTimelines,
  setValue,
  watch,
  timelineMethods,
  modal: timelineModal,
}) => {
  const { data, isLoading } = useGetAllTimelineType();
  const [dateError, setDateError] = useState(false);
  const { fields, remove, move, append } = timelineMethods;
  const modal = useBoolean();
  const [query, setQuery] = useState('');

  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const existingTimeline = watch('timeline');
  const timelineEndDate = existingTimeline[fields.length - 1]?.endDate;

  // useEffect(() => {
  //   // Sorted based on dependencies
  //   const sortedTimeline = (defaultTimelines && topologicalSort(defaultTimelines)) || [];

  //   if (sortedTimeline.length) {
  //     setValue(
  //       'timeline',
  //       sortedTimeline.map((elem) => ({
  //         timeline_type: { name: elem?.timelineType?.name },
  //         id: elem?.id,
  //         duration: elem.duration,
  //         for: elem?.for,
  //         dependsOn:
  //           elem.dependsOn.length < 1
  //             ? 'Campaign Start Date'
  //             : elem?.dependsOn[0]?.dependsOnTimeline?.timelineType?.name || '',
  //         startDate: '',
  //         endDate: '',
  //       }))
  //     );
  //   } else {
  //     setValue('timeline[0].dependsOn', 'Campaign Start Date');
  //   }
  // }, [setValue, defaultTimelines]);

  useEffect(() => {
    if (timelineEndDate) {
      setValue('campaignEndDate', dayjs(timelineEndDate).format('ddd LL'));
    }
  }, [setValue, timelineEndDate]);

  useEffect(() => {
    setValue(
      'timeline',
      defaultTimelines
        ?.sort((a, b) => a.order - b.order)
        ?.map((elem) => ({
          timeline_type: { id: elem?.timelineType?.id, name: elem.timelineType.name },
          id: elem?.id,
          duration: elem.duration,
          for: elem?.for,
          startDate: '',
          endDate: '',
        }))
    );
  }, [defaultTimelines, setValue]);

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

  useEffect(() => {
    updateTimelineDates();
  }, [startDate, existingTimeline.length, updateTimelineDates]);

  const handleDurationChange = (index, value) => {
    setValue(`timeline[${index}].duration`, value);
    updateTimelineDates();
  };

  const handleRemove = (index, item) => {
    // if (index < fields.length - 1) {
    //   setValue(`timeline[${index + 1}]`, {
    //     name:
    //     duration: timelines[index + 1].duration,
    //     for: timelines[index + 1].for,
    //   });
    // }
    remove(index);
  };

  // const handleChange = (e, index) => {
  //   setValue(`timeline[${index}].timeline_type`, { name: e.target.value });
  //   // eslint-disable-next-line no-unsafe-optional-chaining
  //   if (index !== fields?.length - 1) {
  //     setValue(`timeline[${index + 1}].dependsOn`, e.target.value);
  //   }
  // };

  useEffect(() => {
    if (endDate && startDate && endDate < startDate) {
      setDateError(true);
    } else {
      setDateError(false);
    }
  }, [startDate, endDate]);

  // const handleAdd = (index) => {
  //   insert(index + 1, {
  //     timeline_type: { id: '1', name: '' },
  //     dependsOn: timelines[index]?.timeline_type?.name || '',
  //     duration: null,
  //     for: '',
  //   });
  //   // if (timelines.length) {
  //   //   const existingIds = timelines.length && timelines.map((elem) => elem.timeline_type?.id);
  //   //   const options = data && data.filter((a) => !existingIds?.includes(a?.id));
  //   //   if (options.length > 0) {
  //   //     insert(index + 1, {
  //   //       timeline_type: { id: '', name: '' },
  //   //       dependsOn: timelines[index]?.timeline_type?.name,
  //   //       duration: null,
  //   //       for: '',
  //   //     });
  //   //   } else {
  //   //     insert(index + 1, {
  //   //       timeline_type: { id: '1', name: 'dawdsadsdasd' },
  //   //       dependsOn: timelines[index]?.timeline_type?.id,
  //   //       duration: null,
  //   //       for: '',
  //   //     });
  //   //   }
  //   // } else {
  //   //   console.log('asdas');
  //   // }
  // };

  // const renderTimelineForm = (
  //   <Box display="grid" gridTemplateColumns={{ xs: 'repeat(1,fr)', md: 'repeat(1, 1fr)' }} gap={1}>
  //     <Stack direction="row" justifyContent="space-between">
  //       <Typography sx={{ textAlign: 'start', mb: 2 }} variant="h6">
  //         Campaign Timeline
  //       </Typography>
  //       <Typography sx={{ textAlign: 'start', mb: 2 }} variant="h6">
  //         Total days: {dayjs(endDate).diff(dayjs(startDate), 'day') || 0}
  //       </Typography>
  //     </Stack>
  //     {fields.map((item, index) => {
  //       const existingIds = timelines.length && timelines.map((elem) => elem.timeline_type?.id);
  //       const options =
  //         data &&
  //         data
  //           .filter((a) => !existingIds?.includes(a?.id))
  //           .map((elem) => ({ name: elem.name, id: elem.id }));
  //       return (
  //         <Box key={item.id}>
  //           <Stack direction="row" alignItems="center" gap={1}>
  //             <Avatar
  //               sx={{
  //                 width: 14,
  //                 height: 14,
  //                 fontSize: 10,
  //                 bgcolor: (theme) => theme.palette.success.main,
  //               }}
  //             >
  //               {index + 1}
  //             </Avatar>
  //             <Stack
  //               direction={{ xs: 'column', md: 'row' }}
  //               gap={1}
  //               alignItems="center"
  //               flexGrow={1}
  //             >
  //               <RHFAutocomplete
  //                 name={`timeline[${index}].timeline_type`}
  //                 fullWidth
  //                 options={options}
  //                 onChange={(e, val) => handleChange(val, index)}
  //                 getOptionLabel={(option) => option.name}
  //                 label="Timeline Type"
  //                 renderOption={(props, option) => {
  //                   const { key, ...optionProps } = props;
  //                   return (
  //                     <MenuItem key={key} {...optionProps}>
  //                       {option.name}
  //                     </MenuItem>
  //                   );
  //                 }}
  //                 sx={{
  //                   '& .MuiInputBase-root': {
  //                     cursor: 'not-allowed', // Change cursor to indicate disabled state
  //                   },
  //                 }}
  //                 isOptionEqualToValue={(option, value) => option.id === value.id}
  //               />

  //               <RHFSelect disabled name={`timeline[${index}].dependsOn`} label="Depends On">
  //                 {!isLoading &&
  //                   data.map((elem) => (
  //                     <MenuItem key={elem?.id} value={elem?.id}>
  //                       {elem?.name}
  //                     </MenuItem>
  //                   ))}
  //                 <MenuItem value="startDate">Campaign Start Date</MenuItem>
  //               </RHFSelect>
  //               <RHFSelect name={`timeline[${index}].for`} label="For">
  //                 <MenuItem value="admin">Admin</MenuItem>
  //                 <MenuItem value="creator">Creator</MenuItem>
  //               </RHFSelect>
  //               <RHFTextField
  //                 name={`timeline[${index}].duration`}
  //                 type="number"
  //                 label="Duration"
  //                 placeholder="Eg: 2"
  //                 InputProps={{
  //                   endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //                 }}
  //                 onChange={(e) => handleDurationChange(index, e.target.value)}
  //               />
  //               {/* <RHFTextField
  //                 name={`timeline[${index}].startDate`}
  //                 label="Start Date"
  //                 // value={item.startDate}
  //                 disabled
  //               /> */}
  //               <RHFTextField name={`timeline[${index}].endDate`} label="End Date" disabled />
  //               <IconButton color="error" onClick={() => handleRemove(index, item)}>
  //                 <Iconify icon="uil:trash" />
  //               </IconButton>
  //             </Stack>
  //           </Stack>
  //           <Stack direction="row" alignItems="center" mt={2} gap={1}>
  //             <Tooltip title={`Add a new row under ${timelines[index]?.timeline_type?.name}`}>
  //               <IconButton
  //                 onClick={() => {
  //                   handleAdd(index);
  //                 }}
  //               >
  //                 <Iconify icon="carbon:add-filled" />
  //               </IconButton>
  //             </Tooltip>
  //             <Divider sx={{ borderStyle: 'dashed', flexGrow: 1 }} />
  //           </Stack>
  //         </Box>
  //       );
  //     })}
  //   </Box>
  // );

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

  const renderTimelineForm = (
    <Box display="grid" gridTemplateColumns={{ xs: 'repeat(1,fr)', md: 'repeat(1, 1fr)' }} gap={1}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} mb={2} gap={2}>
        <Typography sx={{ textAlign: 'start' }} variant="h6">
          Campaign Timeline
        </Typography>
        <Box sx={{ flexGrow: 1, textAlign: 'start' }}>
          <Button variant="contained" size="small" onClick={modal.onTrue}>
            Preview
          </Button>
        </Box>
        <Typography sx={{ textAlign: 'start', mb: 2 }} variant="h6">
          Total days: {dayjs(endDate).diff(dayjs(startDate), 'day') || 0}
        </Typography>
      </Stack>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chraraters">
          {(value) => (
            <Box {...value.droppableProps} ref={value.innerRef}>
              <Stack gap={3}>
                {fields.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        key={item.id}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
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
                          <Iconify icon="mingcute:dots-fill" width={20} />

                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            gap={1}
                            alignItems="center"
                            flexGrow={1}
                          >
                            {!isLoading && (
                              <RHFAutocomplete
                                disabled={!!timelines[index]?.timeline_type?.name}
                                label="Select a timeline name"
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
                            )}

                            <RHFSelect name={`timeline[${index}].for`} label="For">
                              <MenuItem value="admin">Admin</MenuItem>
                              <MenuItem value="creator">Creator</MenuItem>
                            </RHFSelect>
                            <RHFTextField
                              name={`timeline[${index}].duration`}
                              type="number"
                              label="Duration"
                              placeholder="Eg: 2"
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="start">days</InputAdornment>
                                ),
                              }}
                              onChange={(e) => handleDurationChange(index, e.target.value)}
                            />

                            <RHFTextField
                              name={`timeline[${index}].endDate`}
                              label="End Date"
                              disabled
                            />
                            <IconButton color="error" onClick={() => handleRemove(index, item)}>
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

  const renderPreview = (
    <Dialog open={modal.value} onClose={modal.onFalse}>
      <DialogContent>
        <Timeline position="alternate">
          {existingTimeline.map((timeline, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="text.secondary" fontSize={13}>
                {dayjs(timeline.startDate).format('ddd LL')}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent variant="subtitle1">{timeline?.name}</TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </DialogContent>
    </Dialog>
  );

  return (
    <Box
      component="div"
      sx={{
        textAlign: 'center',
      }}
    >
      <Stack gap={1}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems="center">
          <RHFDatePicker
            name="campaignStartDate"
            label="Campaign Start Date"
            minDate={new Date()}
          />
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
          {/* <RHFDatePicker name="campaignEndDate" label="Campaign End Date" /> */}
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
          borderStyle: 'dashed',
        }}
      />

      {renderTimelineForm}
      {renderPreview}
    </Box>
  );
};

export default SelectTimeline;

SelectTimeline.propTypes = {
  defaultTimelines: PropTypes.array,
};
