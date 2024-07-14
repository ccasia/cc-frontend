import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Avatar,
  Divider,
  Tooltip,
  MenuItem,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  DialogContentText,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';

export const EditTimeline = ({ open, campaign, onClose }) => {
  const { CampaignTimeline } = campaign;
  const [isLoading, setIsLoading] = useState(false);
  // const { timelineType } = useGetTimelineType();
  const [dateError] = useState(false);

  const methods = useForm({
    defaultValues: {
      timeline: [],
      campaignStartDate: '',
      campaignEndDate: '',
    },
  });

  const { setValue, control, reset, watch, handleSubmit } = methods;

  const { fields, remove, insert } = useFieldArray({
    name: 'timeline',
    control,
  });

  const existingTimeline = watch('timeline');

  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const timelineEndDate = existingTimeline[fields.length - 1]?.endDate;

  useEffect(() => {
    reset({
      timeline:
        campaign &&
        CampaignTimeline.map((item) => ({
          ...item,
          timeline_type: { name: item?.name },
          duration: item.duration,
          dependsOn:
            item?.dependsOnCampaignTimeline[0]?.campaignTimeline?.name || 'Campaign Start Date',
          startDate: dayjs(item.startDate).format('ddd LL'),
          endDate: dayjs(item.endDate).format('ddd LL'),
        })),
    });
    setValue('campaignStartDate', dayjs(campaign?.campaignBrief?.startDate));
    setValue('campaignEndDate', dayjs(campaign?.campaignBrief?.endDate));
  }, [campaign, CampaignTimeline, reset, setValue]);

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
    setValue('campaignEndDate', dayjs(timelineEndDate));
    updateTimelineDates();
  };

  useEffect(() => {
    if (timelineEndDate) {
      setValue('campaignEndDate', dayjs(timelineEndDate));
    }
  }, [setValue, timelineEndDate]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.patch(
        endpoints.campaign.updateCampaignTimeline(campaign?.id),
        data
      );
      setIsLoading(false);
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
        dependsOn: item.dependsOn,
        timeline_type: existingTimeline[index + 1].timeline_type,
        duration: existingTimeline[index + 1].duration,
        for: existingTimeline[index + 1].for,
      });
    }
    remove(index);
  };

  const handleAdd = (index) => {
    insert(index + 1, {
      timeline_type: { name: '' },
      dependsOn: existingTimeline[index]?.name,
      duration: null,
      for: '',
    });
  };

  const handleChange = (e, index) => {
    setValue(`timeline[${index}].timeline_type`, { name: e.target.value });
    setValue(`timeline[${index + 1}].dependsOn`, e.target.value);
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
          <DialogContentText id="alert-dialog-description" p={1.5}>
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
                <RHFDatePicker name="campaignEndDate" label="Campaign End Date" disabled />
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

            <Box
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(1,fr)', md: 'repeat(1, 1fr)' }}
              gap={1}
            >
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ textAlign: 'start', mb: 2 }} variant="h6">
                  Campaign Timeline
                </Typography>
                <Typography sx={{ textAlign: 'start', mb: 2 }} variant="h6">
                  Total days: {dayjs(endDate).diff(dayjs(startDate), 'day') || 0}
                </Typography>
              </Stack>
              {fields.map((item, index) => (
                <Box key={item.id}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Avatar
                      sx={{
                        width: 14,
                        height: 14,
                        fontSize: 10,
                        bgcolor: (theme) => theme.palette.success.main,
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      gap={1}
                      alignItems="center"
                      flexGrow={1}
                    >
                      <RHFTextField
                        name={`timeline[${index}].timeline_type.name`}
                        onChange={(e, val) => handleChange(e, index)}
                        label="Timeline Type"
                        placeholder="Eg: Open For Pitch"
                      />
                      <RHFTextField
                        disabled
                        name={`timeline[${index}].dependsOn`}
                        label="Depends On"
                      />

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
                          endAdornment: <InputAdornment position="start">days</InputAdornment>,
                        }}
                        onChange={(e) => handleDurationChange(index, e.target.value)}
                      />

                      <RHFTextField name={`timeline[${index}].endDate`} label="End Date" disabled />
                      <IconButton color="error" onClick={() => handleRemove(index, item)}>
                        <Iconify icon="uil:trash" />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Stack direction="row" alignItems="center" mt={2} gap={1}>
                    <Tooltip
                      title={`Add a new row under ${existingTimeline[index]?.timeline_type?.name}`}
                    >
                      <IconButton
                        onClick={() => {
                          handleAdd(index);
                        }}
                      >
                        <Iconify icon="carbon:add-filled" />
                      </IconButton>
                    </Tooltip>
                    <Divider sx={{ borderStyle: 'dashed', flexGrow: 1 }} />
                  </Stack>
                </Box>
              ))}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose('timeline')}>Cancel</Button>
          <LoadingButton autoFocus color="primary" type="submit" loading={isLoading}>
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
