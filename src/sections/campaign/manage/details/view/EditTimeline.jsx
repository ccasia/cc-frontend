import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Divider,
  MenuItem,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
} from '@mui/material';

import useGetAllTimelineType from 'src/hooks/use-get-all-timeline';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField, RHFDatePicker, RHFAutocomplete } from 'src/components/hook-form';

export const EditTimeline = ({ open, campaign, onClose }) => {
  const { campaignTimeline } = campaign && campaign;
  const [isLoading, setIsLoading] = useState(false);
  const { data: timelineData, isLoading: timelineLoading } = useGetAllTimelineType();
  const [query, setQuery] = useState('');
  const [dateError] = useState(false);

  const methods = useForm({
    defaultValues: {
      timeline: [],
      campaignStartDate: '',
      campaignEndDate: '',
    },
  });

  const { setValue, control, reset, watch, handleSubmit } = methods;

  const { fields, remove, append, move } = useFieldArray({
    name: 'timeline',
    control,
  });

  const existingTimeline = watch('timeline');

  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const timelineEndDate = existingTimeline[fields.length - 1]?.endDate;

  useEffect(() => {
    if (timelineEndDate) {
      setValue('campaignEndDate', dayjs(timelineEndDate).format('ddd LL'));
    }
  }, [setValue, timelineEndDate]);

  useEffect(() => {
    reset({
      timeline:
        campaign &&
        campaignTimeline
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            ...item,
            id: item.id,
            timeline_type: { name: item?.name },
            duration: item.duration,
            startDate: dayjs(item.startDate).format('ddd LL'),
            endDate: dayjs(item.endDate).format('ddd LL'),
          })),
    });
    setValue('campaignStartDate', dayjs(campaign?.campaignBrief?.startDate));
  }, [campaign, campaignTimeline, reset, setValue]);

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

    setValue('campaignEndDate', dayjs(timelineEndDate).format('ddd LL'));
    updateTimelineDates();
  };

  useEffect(() => {
    if (timelineEndDate) {
      setValue('campaignEndDate', dayjs(timelineEndDate).format('ddd LL'));
    }
  }, [setValue, timelineEndDate, startDate]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.patch(
        endpoints.campaign.editCampaignTimeline(campaign?.id),
        data
      );
      setIsLoading(false);
      mutate(endpoints.campaign.getCampaignById(campaign.id));
      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  });

  const handleRemove = (index, item) => {
    if (index < fields.length - 1) {
      setValue(`timeline[${index + 1}]`, {
        timeline_type: existingTimeline[index + 1].timeline_type,
        duration: existingTimeline[index + 1].duration,
        for: existingTimeline[index + 1].for,
      });
    }
    remove(index);
  };

  const closeDialog = () => onClose('timeline');

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    move(result.source.index, result.destination.index);
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

  return (
    <Dialog
      open={open.timeline}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle id="alert-dialog-title">Edit Timeline</DialogTitle>
        <DialogContent>
          <Box my={3}>
            <Stack gap={1}>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems="center">
                <RHFDatePicker name="campaignStartDate" label="Campaign Start Date" />
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
                <RHFTextField name="campaignEndDate" label="End Date" disabled />
                {/* <RHFDatePicker name="campaignEndDate" label="Campaign End Date" disabled /> */}
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

            {/* Droppable container */}
            <Box
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(1,fr)', md: 'repeat(1, 1fr)' }}
              gap={1}
              // maxHeight={600}
              // overflow="hidden"
            >
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ textAlign: 'start', mb: 2 }} variant="h6">
                  Campaign Timeline
                </Typography>
                <Typography sx={{ textAlign: 'start', mb: 2 }} variant="h6">
                  Total days: {dayjs(endDate).diff(dayjs(startDate), 'day') || 0}
                </Typography>
              </Stack>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="chraraters">
                  {(value) => (
                    <Box {...value.droppableProps} ref={value.innerRef} overflow="auto">
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
                                    {!timelineLoading && (
                                      <RHFAutocomplete
                                        disabled={!!existingTimeline[index]?.timeline_type?.name}
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
                                        options={timelineData || []}
                                        getOptionLabel={(option) => option.name}
                                        isOptionEqualToValue={(option, a) => option.name === a.name}
                                        renderOption={(props, option) => {
                                          // eslint-disable-next-line react/prop-types
                                          const { key, ...optionProps } = props;
                                          return (
                                            <MenuItem key={key} {...optionProps}>
                                              {option.name}
                                            </MenuItem>
                                          );
                                        }}
                                        filterOptions={(a, state) => {
                                          const existingNames = existingTimeline.map(
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
                                    <IconButton
                                      color="error"
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

              <Button
                variant="contained"
                onClick={() =>
                  append({
                    timeline_type: { name: '' },
                    duration: null,
                    for: '',
                  })
                }
              >
                Add new timeline
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <LoadingButton
            type="submit"
            onClick={closeDialog}
            loading={isLoading}
            autoFocus
            color="primary"
          >
            Save
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

EditTimeline.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
