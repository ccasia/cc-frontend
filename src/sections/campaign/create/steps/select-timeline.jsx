/* eslint-disable react/prop-types */
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Divider,
  Tooltip,
  MenuItem,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { topologicalSort } from 'src/utils/sortTimeline';

import Iconify from 'src/components/iconify';
import { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const SelectTimeline = ({ defaultTimelines, setValue, watch, timelineMethods, timelineType }) => {
  // eslint-disable-next-line no-unused-vars

  const [dateError, setDateError] = useState(false);
  // const { timelineType } = useGetTimelineType();
  // const { data } = timelineType;
  const { fields, insert, remove } = timelineMethods;

  const startDate = watch('campaignStartDate');
  const endDate = watch('campaignEndDate');
  const existingTimeline = watch('timeline');
  const timelineEndDate = existingTimeline[fields.length - 1].endDate;

  useEffect(() => {
    if (timelineEndDate) {
      setValue('campaignEndDate', dayjs(timelineEndDate));
    }
  }, [setValue, timelineEndDate]);

  useEffect(() => {
    // Sorted based on dependencies
    const sortedTimeline = topologicalSort(defaultTimelines);
    if (sortedTimeline.length) {
      setValue(
        'timeline',
        sortedTimeline.map((elem) => ({
          timeline_type: { name: elem?.timelineType?.name },
          id: elem?.id,
          duration: elem.duration,
          for: elem?.for,
          dependsOn:
            elem.dependsOn.length < 1
              ? 'Campaign Start Date'
              : elem?.dependsOn[0]?.dependsOnTimeline?.timelineType?.name || '',
          startDate: '',
          endDate: '',
        }))
      );
    } else {
      setValue('timeline[0].dependsOn', 'Campaign Start Date');
    }
  }, [setValue, defaultTimelines]);

  const timelines = watch('timeline');

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

  const handleRemove = (index, item) => {
    if (index < fields.length - 1) {
      setValue(`timeline[${index + 1}]`, {
        dependsOn: item.dependsOn,
        timeline_type: timelines[index + 1].timeline_type,
        duration: timelines[index + 1].duration,
        for: timelines[index + 1].for,
      });
    }
    remove(index);
  };

  const handleAdd = (index) => {
    insert(index + 1, {
      timeline_type: { id: '1', name: '' },
      dependsOn: timelines[index]?.timeline_type?.name || '',
      duration: null,
      for: '',
    });
    // if (timelines.length) {
    //   const existingIds = timelines.length && timelines.map((elem) => elem.timeline_type?.id);
    //   const options = data && data.filter((a) => !existingIds?.includes(a?.id));
    //   if (options.length > 0) {
    //     insert(index + 1, {
    //       timeline_type: { id: '', name: '' },
    //       dependsOn: timelines[index]?.timeline_type?.name,
    //       duration: null,
    //       for: '',
    //     });
    //   } else {
    //     insert(index + 1, {
    //       timeline_type: { id: '1', name: 'dawdsadsdasd' },
    //       dependsOn: timelines[index]?.timeline_type?.id,
    //       duration: null,
    //       for: '',
    //     });
    //   }
    // } else {
    //   console.log('asdas');
    // }
  };

  const handleChange = (e, index) => {
    setValue(`timeline[${index}].timeline_type`, { name: e.target.value });
    // eslint-disable-next-line no-unsafe-optional-chaining
    if (index !== fields?.length - 1) {
      setValue(`timeline[${index + 1}].dependsOn`, e.target.value);
    }
  };

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
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems="center" flexGrow={1}>
              <RHFTextField
                name={`timeline[${index}].timeline_type.name`}
                onChange={(e, val) => handleChange(e, index)}
                label="Timeline Type"
                placeholder="Eg: Open For Pitch"
              />

              <RHFTextField disabled name={`timeline[${index}].dependsOn`} />

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
            <Tooltip title={`Add a new row under ${timelines[index]?.timeline_type?.name}`}>
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
    </Box>
  );
};

export default SelectTimeline;

SelectTimeline.propTypes = {
  defaultTimelines: PropTypes.array,
};
