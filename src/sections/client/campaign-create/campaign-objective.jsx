import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import React, { memo, useRef, useEffect } from 'react';

import {
  Box,
  Stack,
  MenuItem,
  Collapse,
  FormLabel,
  Typography,
} from '@mui/material';

import {
  primaryKPIOptions,
  boostContentOptions,
  primaryObjectivesList,
  secondaryObjectivesByPrimary,
} from 'src/contants/campaign-objectives';

import { RHFSelectV2, RHFTextField, RHFMultiSelect } from 'src/components/hook-form';

// Form field component with consistent styling
const FormField = ({ label, children, required = true }) => (
  <Stack spacing={0.5}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem',
        mb: 0.5,
        '& .MuiFormLabel-asterisk': {
          color: '#FF3500',
        },
      }}
    >
      {label}
    </FormLabel>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
};


const CampaignObjective = () => {
  const { watch, setValue } = useFormContext();
  const primaryObjective = watch('campaignObjectives');
  const secondaryOptions = secondaryObjectivesByPrimary[primaryObjective] || [];
  const prevPrimaryObjective = useRef(primaryObjective);

  useEffect(() => {
    if (prevPrimaryObjective.current !== undefined && prevPrimaryObjective.current !== primaryObjective) {
      setValue('secondaryObjectives', []);
    }
    prevPrimaryObjective.current = primaryObjective;
  }, [primaryObjective, setValue]);

  return (
    <Box sx={{ maxWidth: '600px', mx: 'auto', mb: 8 }}>
      {/* Campaign Objectives - Full width */}
      <Box sx={{ mt: 2 }}>
        <FormField label="Primary Campaign Objective">
          <RHFSelectV2
            name="campaignObjectives"
            placeholder="Select Primary Campaign Objective"
            multiple={false}
          >
            {primaryObjectivesList.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </RHFSelectV2>
        </FormField>
      </Box>

      {/* Additional fields - only show after primary objective is selected */}
      <Collapse in={Boolean(primaryObjective)}>
        {/* Secondary Campaign Objective */}
        <Box sx={{ mt: 2 }}>
          <FormField label="Secondary Campaign Objective - Choose up to 2">
            <RHFMultiSelect
              name="secondaryObjectives"
              placeholder="Select Secondary Campaign Objectives"
              options={secondaryOptions.map((item) => ({
                value: item,
                label: item,
              }))}
              chip
              disabled={secondaryOptions.length === 0}
            />
          </FormField>
        </Box>

        {/* Boost/Promote Content */}
        <Box sx={{ mt: 2 }}>
          <FormField label="Boost/Promote Content">
            <RHFSelectV2
              name="boostContent"
              placeholder="Select an option"
              multiple={false}
            >
              {boostContentOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </RHFSelectV2>
          </FormField>
        </Box>

        {/* Primary KPI */}
        <Box sx={{ mt: 2 }}>
          <FormField label="Primary KPI">
            <RHFSelectV2
              name="primaryKPI"
              placeholder="Select an option"
              multiple={false}
            >
              {primaryKPIOptions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </RHFSelectV2>
          </FormField>
        </Box>

        {/* Current Performance Baseline */}
        <Box sx={{ mt: 2, mb: 4 }}>
          <FormField label="Current Performance Baseline">
            <Typography mt={-1} mb={0.5} variant='caption' color="#8E8E93">This helps us measure campaign impact and improvement. Enter your current performance baseline (e.g., &quot;2,000 website visits/day&quot; or &quot;500 clicks/post&quot; or &quot;200 leads/month&quot; or &quot;150 inquiries/month&quot;)</Typography>
            <RHFTextField
              name="performanceBaseline"
              placeholder="Current Performance Baseline"
              multiline
              rows={1}
            />
          </FormField>
        </Box>
      </Collapse>
    </Box>
  );
};

export default memo(CampaignObjective);
