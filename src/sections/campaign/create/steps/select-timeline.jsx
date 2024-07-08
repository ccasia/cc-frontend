/* eslint-disable react/prop-types */
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

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

import { useGetTimelineType } from 'src/hooks/use-get-timelinetype';

import { sortTimelines } from 'src/utils/sortTimeline';

import Iconify from 'src/components/iconify';
import { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const SelectTimeline = ({
  control,
  defaultTimeline,
  getValues,
  setValue,
  errors,
  timeline,
  setTimeline,
  fields,
  remove,
  watch,
  append,
}) => {
  // eslint-disable-next-line no-unused-vars

  const [dateError, setDateError] = useState(false);
  const { timelineType } = useGetTimelineType();

  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const existingTimeline = watch('timeline');
  const timelineEndDate = dayjs(existingTimeline[fields.length - 1].endDate);

  useEffect(() => {
    if (timelineEndDate) {
      setValue('campaignEndDate', timelineEndDate);
    }
  }, [setValue, timelineEndDate]);

  useEffect(() => {
    // Sorted based on dependencies
    const sortedTimeline = sortTimelines(timelineType);

    setValue(
      'timeline',
      sortedTimeline.map((elem) => ({
        timeline_type: elem?.name,
        id: elem?.id,
        duration: undefined,
        startDate: '',
        endDate: '',
      }))
    );
  }, [setValue, timelineType]);

  // useEffect(() => {
  //   if (timeline === 'defaultTimeline') {
  //     setValue('timeline', defaultTimeline);
  //   } else {
  //     setValue('timeline', {
  //       openForPitch: '',
  //       filterPitch: '',
  //       shortlistCreator: '',
  //       agreementSign: '',
  //       firstDraft: '',
  //       feedBackFirstDraft: '',
  //       finalDraft: '',
  //       qc: '',
  //       feedBackFinalDraft: '',
  //       posting: '',
  //     });
  //   }
  // }, [setValue, timeline, defaultTimeline]);

  // const defaultTimelineView = (
  //   <Box
  //     display="grid"
  //     columnGap={2}
  //     rowGap={2}
  //     gridTemplateColumns={{
  //       xs: 'repeat(1, 1fr)',
  //       sm: 'repeat(2, 1fr)',
  //     }}
  //   >
  //     <Controller
  //       name="timeline.openForPitch"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Open For Pitches"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />
  //     <Controller
  //       name="timeline.filterPitch"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Filtering of pitches by CC"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.shortlistCreator"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Shortlisting of creators by brand"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.agreementSign"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Signing of agreement"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.firstDraft"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="First draft from creators"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.feedBackFirstDraft"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Feedback on first draft by brand"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.finalDraft"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Final draft from creators"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.qc"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="QC of drafts by CC"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.feedBackFinalDraft"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Feedback on final draft by brand"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.posting"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Posting in social media"
  //           disabled
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //         />
  //       )}
  //     />
  //   </Box>
  // );

  // const defaultTimelineView = (
  //   <Box
  //     display="grid"
  //     columnGap={2}
  //     rowGap={2}
  //     gridTemplateColumns={{
  //       sm: 'repeat(1, 1fr)',
  //     }}
  //     maxHeight={400}
  //     overflow="scroll"
  //     py={2}
  //   >
  //     {fields.map((item, index) => (
  //       <Box key={item.id}>
  //         <Stack
  //           // key={item.id}
  //           direction={{ xs: 'column', md: 'row' }}
  //           gap={1}
  //           alignItems="center"
  //         >
  //           <RHFTextField
  //             name={`timeline[${index}].timeline_type`}
  //             label="Timeline Type"
  //             placeholder="Eg: Open For Pitch"
  //             disabled
  //           />
  //           <RHFTextField
  //             name={`timeline[${index}].days`}
  //             label="Days"
  //             type="number"
  //             placeholder="Eg: 2"
  //             InputProps={{
  //               endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //             }}
  //             disabled
  //           />
  //           <RHFSelect name={`timeline[${index}].for`} label="For" disabled>
  //             <MenuItem value="admin">Admin</MenuItem>
  //             <MenuItem value="creator">Creator</MenuItem>
  //           </RHFSelect>
  //         </Stack>
  //         <Divider sx={{ borderStyle: 'dashed', mt: 2 }} />
  //       </Box>
  //     ))}
  //   </Box>
  // );

  // const customeTimelineView = (
  //   <Box
  //     display="grid"
  //     columnGap={2}
  //     rowGap={2}
  //     gridTemplateColumns={{
  //       xs: 'repeat(1, 1fr)',
  //       sm: 'repeat(2, 1fr)',
  //     }}
  //   >
  //     <Controller
  //       name="timeline.openForPitch"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Open For Pitches"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors.timeline?.openForPitch && errors.timeline.openForPitch}
  //           helperText={errors.timeline?.openForPitch && errors.timeline.openForPitch.message}
  //         />
  //       )}
  //     />
  //     <Controller
  //       name="timeline.filterPitch"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Filtering of pitches by CC"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.filterPitch}
  //           helperText={errors?.timeline?.filterPitch && errors?.timeline?.filterPitch?.message}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.shortlistCreator"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Shortlisting of creators by brand"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.shortlistCreator}
  //           helperText={
  //             errors?.timeline?.shortlistCreator && errors?.timeline?.shortlistCreator?.message
  //           }
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.agreementSign"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Signing of agreement"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.agreementSign}
  //           helperText={errors?.timeline?.agreementSign && errors?.timeline?.agreementSign?.message}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.firstDraft"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="First draft from creators"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.firstDraft}
  //           helperText={errors?.timeline?.firstDraft && errors?.timeline?.firstDraft?.message}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.feedBackFirstDraft"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Feedback on first draft by brand"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.feedBackFirstDraft}
  //           helperText={
  //             errors?.timeline?.feedBackFirstDraft && errors?.timeline?.feedBackFirstDraft?.message
  //           }
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.finalDraft"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Final draft from creators"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.finalDraft}
  //           helperText={errors?.timeline?.finalDraft && errors?.timeline?.finalDraft?.message}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.qc"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="QC of drafts by CC"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.qc}
  //           helperText={errors?.timeline?.qc && errors?.timeline?.qc?.message}
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.feedBackFinalDraft"
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Feedback on final draft by brand"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.feedBackFinalDraft}
  //           helperText={
  //             errors?.timeline?.feedBackFinalDraft && errors?.timeline?.feedBackFinalDraft?.message
  //           }
  //         />
  //       )}
  //     />

  //     <Controller
  //       name="timeline.posting"
  //       control={control}
  //       render={({ field }) => (
  //         <TextField
  //           {...field}
  //           label="Posting in social media"
  //           InputProps={{
  //             endAdornment: <InputAdornment position="start">days</InputAdornment>,
  //           }}
  //           error={errors?.timeline?.posting}
  //           helperText={errors?.timeline?.posting && errors?.timeline?.posting?.message}
  //         />
  //       )}
  //     />
  //   </Box>
  // );

  // const getDays = existingTimeline.filter((elem) => elem.timeline_type === 'Open For Pitch')[0]
  //   ?.duration;

  // const penat = dayjs(startDate).add(parseInt(getDays, 10), 'day').format('LL');

  // console.log(penat);

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

  const renderTimelineForm = (
    <Box display="grid" gridTemplateColumns={{ xs: 'repeat(1,fr)', md: 'repeat(1, 1fr)' }} gap={1}>
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
              // value={item.startDate}
              disabled
            />
            <RHFTextField
              name={`timeline[${index}].endDate`}
              label="End Date"
              // value={dayjs(item.startDate)
              //   .add(parseInt(item.duration || 0, 10), 'day')
              //   .format('ddd LL')}
              disabled
            />
            <IconButton color="error" onClick={() => remove(index)}>
              <Iconify icon="uil:trash" />
            </IconButton>
          </Stack>
          <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
        </Box>
      ))}

      <Button
        sx={{ mt: 1 }}
        onClick={() => append({ timeline_type: '', duration: undefined, for: '', dependency: '' })}
      >
        Add New Timeline
      </Button>
    </Box>
  );

  useEffect(() => {
    if (endDate && startDate && endDate < startDate) {
      setDateError(true);
    } else {
      setDateError(false);
    }
  }, [startDate, endDate]);

  return (
    <Box
      component="div"
      sx={{
        textAlign: 'center',
      }}
    >
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

      {renderTimelineForm}

      {/* <ToggleButtonGroup
        color="primary"
        value={timeline}
        exclusive
        onChange={(e) => setTimeline(e.target.value)}
        aria-label="Platform"
      >
        <ToggleButton value="defaultTimeline">Default timeline</ToggleButton>
        <ToggleButton value="custom">Custom timeline</ToggleButton>
      </ToggleButtonGroup> */}

      {/* Down here show the list of timelines */}

      {/* <Box mt={2}>
        {timeline === 'defaultTimeline' && defaultTimelineView}
        {timeline === 'custom' && customeTimelineView}
      </Box> */}

      {/* <Controller
        name="defaultTimeline"
        control={control}
        render={({ field }) => (
          <FormControlLabel control={<Checkbox {...field} />} label="Default timeline" />
        )}
      /> */}
    </Box>
  );
};

export default SelectTimeline;

SelectTimeline.propTypes = {
  control: PropTypes.array,
  defaultTimeline: PropTypes.object,
};
