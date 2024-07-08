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
  Divider,
  MenuItem,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  DialogContentText,
} from '@mui/material';

import { useGetTimelineType } from 'src/hooks/use-get-timelinetype';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';

export const EditTimeline = ({ open, campaign, onClose }) => {
  const { campaignTimeline } = campaign;
  const [isLoading, setIsLoading] = useState(false);
  const { timelineType } = useGetTimelineType();
  const [dateError] = useState(false);

  const methods = useForm({
    defaultValues: {
      timeline: [],
      campaignStartDate: '',
      campaignEndDate: '',
    },
  });

  const { setValue, control, reset, watch, handleSubmit } = methods;

  const { fields, append, remove } = useFieldArray({
    name: 'timeline',
    control,
  });

  const existingTimeline = watch('timeline');
  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const timelineEndDate = dayjs(existingTimeline[fields.length - 1]?.endDate);

  useEffect(() => {
    reset({
      timeline:
        campaign &&
        campaignTimeline.map((item) => ({
          ...item,
          timeline_type: item.timeline_type,
          duration: item.duration,
          startDate: dayjs(item.startDate).format('ddd LL'),
          endDate: dayjs(item.endDate).format('ddd LL'),
        })),
    });
    setValue('campaignStartDate', dayjs(campaign?.campaignBrief?.startDate));
    setValue('campaignEndDate', dayjs(campaign?.campaignBrief?.endDate));
  }, [campaign, campaignTimeline, reset, setValue]);

  // useEffect(() => {
  //   setValue('timeline.openForPitch', campaign?.customCampaignTimeline?.openForPitch);
  //   setValue('timeline.filterPitch', campaign?.customCampaignTimeline?.filterPitch);
  //   setValue('timeline.shortlistCreator', campaign?.customCampaignTimeline?.shortlistCreator);
  //   setValue('timeline.agreementSign', campaign?.customCampaignTimeline?.agreementSign);
  //   setValue('timeline.firstDraft', campaign?.customCampaignTimeline?.firstDraft);
  //   setValue('timeline.feedBackFirstDraft', campaign?.customCampaignTimeline?.feedBackFirstDraft);
  //   setValue('timeline.finalDraft', campaign?.customCampaignTimeline?.finalDraft);
  //   setValue('timeline.qc', campaign?.customCampaignTimeline?.qc);
  //   setValue('timeline.feedBackFinalDraft', campaign?.customCampaignTimeline?.feedBackFinalDraft);
  //   setValue('timeline.posting', campaign?.customCampaignTimeline?.posting);
  // }, [setValue, campaign]);

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
  }, [existingTimeline.length, updateTimelineDates]);

  const handleDurationChange = (index, value) => {
    setValue(`timeline[${index}].duration`, value);
    updateTimelineDates();
  };

  useEffect(() => {
    if (timelineEndDate) {
      setValue('campaignEndDate', timelineEndDate);
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
            {/* <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  md: 'repeat(2, 1fr)',
                },
                gap: 2,
              }}
            >
              <Controller
                name="timeline.openForPitch"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Open For Pitches"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // TODO TEMP: Ignore `errors` for now
                    // error={errors.timeline?.openForPitch && errors.timeline.openForPitch}
                    // helperText={errors.timeline?.openForPitch && errors.timeline.openForPitch.message}
                  />
                )}
              />
              <Controller
                name="timeline.filterPitch"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Filtering of pitches by CC"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.filterPitch}
                    // helperText={errors?.timeline?.filterPitch && errors?.timeline?.filterPitch?.message}
                  />
                )}
              />

              <Controller
                name="timeline.shortlistCreator"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Shortlisting of creators by brand"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.shortlistCreator}
                    // helperText={
                    //   errors?.timeline?.shortlistCreator && errors?.timeline?.shortlistCreator?.message
                    // }
                  />
                )}
              />

              <Controller
                name="timeline.agreementSign"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Signing of agreement"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.agreementSign}
                    // helperText={errors?.timeline?.agreementSign && errors?.timeline?.agreementSign?.message}
                  />
                )}
              />

              <Controller
                name="timeline.firstDraft"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First draft from creators"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.firstDraft}
                    // helperText={errors?.timeline?.firstDraft && errors?.timeline?.firstDraft?.message}
                  />
                )}
              />

              <Controller
                name="timeline.feedBackFirstDraft"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Feedback on first draft by brand"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.feedBackFirstDraft}
                    // helperText={
                    //   errors?.timeline?.feedBackFirstDraft && errors?.timeline?.feedBackFirstDraft?.message
                    // }
                  />
                )}
              />

              <Controller
                name="timeline.finalDraft"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Final draft from creators"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.finalDraft}
                    // helperText={errors?.timeline?.finalDraft && errors?.timeline?.finalDraft?.message}
                  />
                )}
              />

              <Controller
                name="timeline.qc"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="QC of drafts by CC"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.qc}
                    // helperText={errors?.timeline?.qc && errors?.timeline?.qc?.message}
                  />
                )}
              />

              <Controller
                name="timeline.feedBackFinalDraft"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Feedback on final draft by brand"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.feedBackFinalDraft}
                    // helperText={
                    //   errors?.timeline?.feedBackFinalDraft && errors?.timeline?.feedBackFinalDraft?.message
                    // }
                  />
                )}
              />

              <Controller
                name="timeline.posting"
                // TODO TEMP: Ignore `control` for now, we don't know where it comes from
                // control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Posting in social media"
                    InputProps={{
                      endAdornment: <InputAdornment position="start">days</InputAdornment>,
                    }}
                    // error={errors?.timeline?.posting}
                    // helperText={errors?.timeline?.posting && errors?.timeline?.posting?.message}
                  />
                )}
              />
            </Box> */}

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
                <RHFDatePicker name="campaignEndDate" label="Campaign End Date" />
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
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems="center">
                    {fields.length <= timelineType.length ? (
                      <RHFSelect name={`timeline[${index}].timeline_type`} label="Timeline Type">
                        {timelineType.map((elem) => (
                          <MenuItem key={elem.id} value={elem.name}>
                            {elem.name}
                          </MenuItem>
                        ))}
                      </RHFSelect>
                    ) : (
                      <RHFTextField
                        name={`timeline[${index}].timeline_type`}
                        label="Timeline Type"
                        placeholder="Eg: Open For Pitch"
                      />
                    )}
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
                    <RHFTextField
                      name={`timeline[${index}].startDate`}
                      label="Start Date"
                      disabled
                    />
                    <RHFTextField name={`timeline[${index}].endDate`} label="End Date" disabled />
                    <IconButton color="error" onClick={() => remove(index)}>
                      <Iconify icon="uil:trash" />
                    </IconButton>
                  </Stack>
                  <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
                </Box>
              ))}

              <Button
                sx={{ mt: 1 }}
                onClick={() =>
                  append({ timeline_type: '', duration: undefined, for: '', dependency: '' })
                }
              >
                Add New Timeline
              </Button>
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
