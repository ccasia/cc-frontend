/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import React, { useState, useEffect } from 'react';

import { Box, TextField, ToggleButton, InputAdornment, ToggleButtonGroup } from '@mui/material';

// eslint-disable-next-line react/prop-types
const SelectTimeline = ({ control, defaultTimeline, getValues, setValue, errors }) => {
  // eslint-disable-next-line no-unused-vars
  const [timeline, setTimeline] = useState('defaultTimeline');

  useEffect(() => {
    if (timeline === 'defaultTimeline') {
      setValue('defaultTimeline', defaultTimeline);
    } else {
      setValue('defaultTimeline', {});
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
        name="defaultTimeline.openForPitch"
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
        name="defaultTimeline.filterPitch"
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
        name="defaultTimeline.shortlistCreator"
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
        name="defaultTimeline.agreementSign"
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
        name="defaultTimeline.firstDraft"
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
        name="defaultTimeline.feedBackFirstDraft"
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
        name="defaultTimeline.finalDraft"
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
        name="defaultTimeline.qc"
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
        name="defaultTimeline.feedBackFinalDraft"
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
        name="customTimeline.openForPitch"
        render={({ field }) => (
          <TextField
            {...field}
            label="Open For Pitches"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
            error={errors.customTimeline?.openForPitch && errors.customTimeline.openForPitch}
            helperText={
              errors.customTimeline?.openForPitch && errors.customTimeline.openForPitch.message
            }
          />
        )}
      />
      <Controller
        name="customTimeline.filterPitch"
        render={({ field }) => (
          <TextField
            {...field}
            label="Filtering of pitches by CC"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="customTimeline.shortlistCreator"
        render={({ field }) => (
          <TextField
            {...field}
            label="Shortlisting of creators by brand"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="customTimeline.agreementSign"
        render={({ field }) => (
          <TextField
            {...field}
            label="Signing of agreement"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="customTimeline.firstDraft"
        render={({ field }) => (
          <TextField
            {...field}
            label="First draft from creators"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="customTimeline.feedBackFirstDraft"
        render={({ field }) => (
          <TextField
            {...field}
            label="Feedback on first draft by brand"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="customTimeline.finalDraft"
        render={({ field }) => (
          <TextField
            {...field}
            label="Final draft from creators"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="customTimeline.qc"
        render={({ field }) => (
          <TextField
            {...field}
            label="QC of drafts by CC"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
          />
        )}
      />

      <Controller
        name="customTimeline.feedBackFinalDraft"
        render={({ field }) => (
          <TextField
            {...field}
            label="Feedback on final draft by brand"
            InputProps={{
              endAdornment: <InputAdornment position="start">days</InputAdornment>,
            }}
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
