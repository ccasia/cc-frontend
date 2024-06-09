/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';

import { Box, TextField, ToggleButton, InputAdornment, ToggleButtonGroup } from '@mui/material';

// eslint-disable-next-line react/prop-types
const SelectTimeline = ({
  control,
  defaultTimeline,
  getValues,
  setValue,
  errors,
  timeline,
  setTimeline,
}) => {
  // eslint-disable-next-line no-unused-vars

  useEffect(() => {
    if (timeline === 'defaultTimeline') {
      setValue('timeline', defaultTimeline);
    }
  }, [setValue, timeline, defaultTimeline]);

  const defaultTimelineView = (
    <Box
      display="grid"
      columnGap={2}
      rowGap={2}
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
      }}
    >
      <Controller
        name="timeline.openForPitch"
        render={({ field }) => (
          <TextField
            {...field}
            label="Open For Pitches"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />
      <Controller
        name="timeline.filterPitch"
        render={({ field }) => (
          <TextField
            {...field}
            label="Filtering of pitches by CC"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="timeline.shortlistCreator"
        render={({ field }) => (
          <TextField
            {...field}
            label="Shortlisting of creators by brand"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="timeline.agreementSign"
        render={({ field }) => (
          <TextField
            {...field}
            label="Signing of agreement"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="timeline.firstDraft"
        render={({ field }) => (
          <TextField
            {...field}
            label="First draft from creators"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="timeline.feedBackFirstDraft"
        render={({ field }) => (
          <TextField
            {...field}
            label="Feedback on first draft by brand"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="timeline.finalDraft"
        render={({ field }) => (
          <TextField
            {...field}
            label="Final draft from creators"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="timeline.qc"
        render={({ field }) => (
          <TextField
            {...field}
            label="QC of drafts by CC"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="timeline.feedBackFinalDraft"
        render={({ field }) => (
          <TextField
            {...field}
            label="Feedback on final draft by brand"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="timeline.posting"
        render={({ field }) => (
          <TextField
            {...field}
            label="Posting in social media"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />
    </Box>
  );

  const customeTimelineView = (
    <Box
      display="grid"
      columnGap={2}
      rowGap={2}
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
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
            error={errors.timeline?.openForPitch && errors.timeline.openForPitch}
            helperText={errors.timeline?.openForPitch && errors.timeline.openForPitch.message}
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
            error={errors?.timeline?.filterPitch}
            helperText={errors?.timeline?.filterPitch && errors?.timeline?.filterPitch?.message}
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
            error={errors?.timeline?.shortlistCreator}
            helperText={
              errors?.timeline?.shortlistCreator && errors?.timeline?.shortlistCreator?.message
            }
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
            error={errors?.timeline?.agreementSign}
            helperText={errors?.timeline?.agreementSign && errors?.timeline?.agreementSign?.message}
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
            error={errors?.timeline?.firstDraft}
            helperText={errors?.timeline?.firstDraft && errors?.timeline?.firstDraft?.message}
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
            error={errors?.timeline?.feedBackFirstDraft}
            helperText={
              errors?.timeline?.feedBackFirstDraft && errors?.timeline?.feedBackFirstDraft?.message
            }
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
            error={errors?.timeline?.finalDraft}
            helperText={errors?.timeline?.finalDraft && errors?.timeline?.finalDraft?.message}
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
            error={errors?.timeline?.qc}
            helperText={errors?.timeline?.qc && errors?.timeline?.qc?.message}
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
            error={errors?.timeline?.feedBackFinalDraft}
            helperText={
              errors?.timeline?.feedBackFinalDraft && errors?.timeline?.feedBackFinalDraft?.message
            }
          />
        )}
      />

      <Controller
        name="timeline.posting"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Posting in social media"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
            error={errors?.timeline?.posting}
            helperText={errors?.timeline?.posting && errors?.timeline?.posting?.message}
          />
        )}
      />
    </Box>
  );

  return (
    <Box
      component="div"
      sx={{
        textAlign: 'center',
      }}
    >
      <ToggleButtonGroup
        color="primary"
        value={timeline}
        exclusive
        onChange={(e) => setTimeline(e.target.value)}
        aria-label="Platform"
      >
        <ToggleButton value="defaultTimeline">Default timeline</ToggleButton>
        <ToggleButton value="custom">Custom timeline</ToggleButton>
      </ToggleButtonGroup>

      {/* Down here show the list of timelines */}
      <Box mt={2}>
        {timeline === 'defaultTimeline' && defaultTimelineView}
        {timeline === 'custom' && customeTimelineView}
      </Box>

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
