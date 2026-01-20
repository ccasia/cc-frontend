import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { memo, useRef, useMemo, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, MenuItem, Collapse, FormLabel, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  primaryKPIOptions,
  boostContentOptions,
  primaryObjectivesList,
  secondaryObjectivesByPrimary,
} from 'src/contants/campaign-objectives';

import FormProvider from 'src/components/hook-form/form-provider';
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
          display: required ? 'inline-block' : 'none',
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

// Validation schema
const UpdateObjectivesSchema = Yup.object().shape({
  campaignObjectives: Yup.string().required('Primary objective is required'),
  secondaryObjectives: Yup.array().max(2, 'Maximum 2 secondary objectives allowed'),
  boostContent: Yup.string().nullable(),
  primaryKPI: Yup.string().nullable(),
  performanceBaseline: Yup.string().nullable(),
});

const UpdateObjectives = ({ campaign, campaignMutate }) => {
  const prevPrimaryObjective = useRef(null);

  // Get existing values from campaign
  const defaultValues = useMemo(
    () => ({
      campaignObjectives: campaign?.campaignBrief?.objectives || '',
      secondaryObjectives: campaign?.campaignBrief?.secondaryObjectives || [],
      boostContent: campaign?.campaignBrief?.boostContent || '',
      primaryKPI: campaign?.campaignBrief?.primaryKPI || '',
      performanceBaseline: campaign?.campaignBrief?.performanceBaseline || '',
    }),
    [campaign]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateObjectivesSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods;

  // Reset form when campaign data changes
  useEffect(() => {
    if (campaign) {
      reset(defaultValues);
    }
  }, [campaign, defaultValues, reset]);

  const primaryObjective = watch('campaignObjectives');
  const secondaryOptions = secondaryObjectivesByPrimary[primaryObjective] || [];

  // Clear secondary objectives when primary objective changes
  useEffect(() => {
    if (
      prevPrimaryObjective.current !== null &&
      prevPrimaryObjective.current !== primaryObjective
    ) {
      setValue('secondaryObjectives', [], { shouldDirty: true });
    }
    prevPrimaryObjective.current = primaryObjective;
  }, [primaryObjective, setValue]);

  const onSubmit = async (data) => {
    try {
      await axiosInstance.patch(endpoints.campaign.editCampaignObjectives, {
        id: campaign?.id,
        objectives: data.campaignObjectives,
        secondaryObjectives: data.secondaryObjectives,
        boostContent: data.boostContent,
        primaryKPI: data.primaryKPI,
        performanceBaseline: data.performanceBaseline,
      });

      enqueueSnackbar('Campaign objectives updated successfully!', { variant: 'success' });
      if (campaignMutate) campaignMutate();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || 'Failed to update campaign objectives',
        { variant: 'error' }
      );
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: '600px' }}>
        {/* Primary Campaign Objective */}
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
            <FormField label="Secondary Campaign Objective - Choose up to 2" required={false}>
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
            <FormField label="Boost/Promote Content" required={false}>
              <RHFSelectV2 name="boostContent" placeholder="Select an option" multiple={false}>
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
            <FormField label="Primary KPI" required={false}>
              <RHFSelectV2 name="primaryKPI" placeholder="Select an option" multiple={false}>
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
            <FormField label="Current Performance Baseline" required={false}>
              <Typography mt={-1} mb={0.5} variant="caption" color="#8E8E93">
                This helps us measure campaign impact and improvement. Enter your current
                performance baseline (e.g., &quot;2,000 website visits/day&quot; or &quot;500
                clicks/post&quot; or &quot;200 leads/month&quot; or &quot;150 inquiries/month&quot;)
              </Typography>
              <RHFTextField
                name="performanceBaseline"
                placeholder="Current Performance Baseline"
                multiline
                rows={1}
              />
            </FormField>
          </Box>
        </Collapse>

        {/* Submit Button */}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!isDirty}
            size="large"
            sx={{
              bgcolor: '#1340ff',
              boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.45) inset',
              '&:hover': {
                bgcolor: '#1340ff',
              },
              '&:disabled': {
                bgcolor: 'rgba(19, 64, 255, 0.3)',
                color: '#fff',
                boxShadow: '0px -3px 0px 0px inset rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Save Changes
          </LoadingButton>
        </Stack>
      </Box>
    </FormProvider>
  );
};

UpdateObjectives.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

export default memo(UpdateObjectives);
