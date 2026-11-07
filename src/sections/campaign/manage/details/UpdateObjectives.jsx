import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { memo, useRef, useMemo, useEffect } from 'react';

import { Box, Collapse } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  primaryKPIOptions,
  boostContentOptions,
  primaryObjectivesList,
  secondaryObjectivesByPrimary,
} from 'src/contants/campaign-objectives';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField } from 'src/components/hook-form';

import ChipSelect from 'src/sections/campaign/create/components/chip-select';
import { helperTextSx } from 'src/sections/campaign/create/components/field-styles';

import FormField from './components/form-field';

// Options read "Brand Awareness (Introduce brands to new audiences)"
const OBJECTIVE_PARTS = /^(.*?)\s*\((.*)\)$/;
const objectiveTitle = (option) => option.match(OBJECTIVE_PARTS)?.[1] ?? option;
const objectiveDescription = (option) => option.match(OBJECTIVE_PARTS)?.[2];

const BOOST_OPTIONS = boostContentOptions.map((option) => option.value);
const boostTitle = (value) =>
  boostContentOptions.find((option) => option.value === value)?.label ?? value;

const BASELINE_HINT =
  'This helps us measure campaign impact and improvement. Enter your current performance baseline (e.g., "2,000 website visits/day" or "500 clicks/post" or "200 leads/month" or "150 inquiries/month")';

// Validation schema
const UpdateObjectivesSchema = Yup.object().shape({
  campaignObjectives: Yup.string().required('Primary objective is required'),
  secondaryObjectives: Yup.array().max(2, 'Maximum 2 secondary objectives allowed'),
  boostContent: Yup.string().nullable(),
  primaryKPI: Yup.string().nullable(),
  performanceBaseline: Yup.string().nullable(),
});

const UpdateObjectives = ({ campaign, campaignMutate, formId, onFormStateChange }) => {
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

  useEffect(() => {
    onFormStateChange?.({ isDirty, isSubmitting });
  }, [isDirty, isSubmitting, onFormStateChange]);

  const primaryObjective = watch('campaignObjectives');
  const secondaryOptions = secondaryObjectivesByPrimary[primaryObjective] || [];

  // Clear secondary objectives when primary objective changes
  useEffect(() => {
    if (
      prevPrimaryObjective.current !== null &&
      prevPrimaryObjective.current !== primaryObjective
    ) {
      setValue('secondaryObjectives', [], { shouldDirty: true });
      // Clear fields if switching to Awareness
      if (primaryObjective === 'Awareness') {
        setValue('boostContent', '', { shouldDirty: true });
        setValue('primaryKPI', '', { shouldDirty: true });
        setValue('performanceBaseline', '', { shouldDirty: true });
      }
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
    <FormProvider id={formId} methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: '600px', ...helperTextSx }}>
        <Box sx={{ mt: 2 }}>
          <FormField label="Primary Campaign Objective" required>
            <ChipSelect
              single
              name="campaignObjectives"
              options={primaryObjectivesList}
              placeholder="Select primary objective"
            />
          </FormField>
        </Box>

        <Collapse in={Boolean(primaryObjective)}>
          <Box sx={{ mt: 2 }}>
            <FormField label="Secondary Campaign Objective">
              <ChipSelect
                name="secondaryObjectives"
                options={secondaryOptions}
                placeholder="Select up to 2 objectives"
                noOptionsText="No matching objective"
                max={2}
                getTitle={objectiveTitle}
                getDescription={objectiveDescription}
              />
            </FormField>
          </Box>

          {primaryObjective === 'Performance' && (
            <>
              <Box sx={{ mt: 2 }}>
                <FormField label="Boost/Promote Content">
                  <ChipSelect
                    single
                    clearable
                    name="boostContent"
                    options={BOOST_OPTIONS}
                    getTitle={boostTitle}
                    placeholder="Select an option"
                  />
                </FormField>
              </Box>

              <Box sx={{ mt: 2 }}>
                <FormField label="Primary KPI">
                  <ChipSelect
                    single
                    clearable
                    name="primaryKPI"
                    options={primaryKPIOptions}
                    placeholder="Select an option"
                  />
                </FormField>
              </Box>

              <Box sx={{ mt: 2, mb: 4 }}>
                <FormField label="Current Performance Baseline" hint={BASELINE_HINT}>
                  <RHFTextField
                    name="performanceBaseline"
                    placeholder="Current Performance Baseline"
                    multiline
                    rows={1}
                  />
                </FormField>
              </Box>
            </>
          )}
        </Collapse>
      </Box>
    </FormProvider>
  );
};

UpdateObjectives.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  formId: PropTypes.string,
  onFormStateChange: PropTypes.func,
};

export default memo(UpdateObjectives);
