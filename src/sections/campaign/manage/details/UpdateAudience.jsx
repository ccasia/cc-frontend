import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { memo, useMemo, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Grid, Stack, MenuItem, FormLabel, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { langList } from 'src/contants/language';
import { countriesCities } from 'src/contants/countries';
import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import {
  RHFSelectV2,
  RHFTextField,
  RHFMultiSelect,
  RHFAutocomplete,
} from 'src/components/hook-form';

// Form field component with consistent styling (matching campaign-target-audience.jsx)
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

// Options matching campaign-target-audience.jsx
const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Non-Binary' },
];

const AGE_OPTIONS = [
  { value: '18-25', label: '18-25' },
  { value: '26-34', label: '26-34' },
  { value: '35-40', label: '35-40' },
  { value: '>40', label: '>40' },
];

// Prefer Malay and English at the top, then list remaining languages alphabetically
const LANGUAGE_OPTIONS = (() => {
  const preferredLanguages = ['Malay', 'English'];
  const remainingLanguages = [...langList]
    .filter((language) => !preferredLanguages.includes(language))
    .sort((a, b) => a.localeCompare(b));

  const orderedLanguages = [...preferredLanguages, ...remainingLanguages];
  return orderedLanguages.map((language) => ({ value: language, label: language }));
})();

const CREATOR_PERSONA_OPTIONS = interestsLists.map((item) => ({
  value: item.toLowerCase(),
  label: item,
}));

const GEOGRAPHIC_FOCUS_OPTIONS = [
  { value: 'SEAregion', label: 'SEA Region' },
  { value: 'global', label: 'Global' },
  { value: 'EastMalaysia', label: 'East Malaysia' },
  { value: 'KualaLumpur', label: 'Kuala Lumpur' },
  { value: 'others', label: 'Others' },
];

// Validation schema
const UpdateAudienceSchema = Yup.object().shape({
  // Primary Audience
  audienceGender: Yup.array().min(1, 'At least one gender is required'),
  audienceAge: Yup.array().min(1, 'At least one age group is required'),
  country: Yup.string().required('Country is required'),
  audienceLanguage: Yup.array().min(1, 'At least one language is required'),
  audienceCreatorPersona: Yup.array().min(1, "At least one creator's interest is required"),
  audienceUserPersona: Yup.string().required('User persona is required'),
  // Secondary Audience (optional)
  secondaryAudienceGender: Yup.array(),
  secondaryAudienceAge: Yup.array(),
  secondaryCountry: Yup.string().nullable(),
  secondaryAudienceLanguage: Yup.array(),
  secondaryAudienceCreatorPersona: Yup.array(),
  secondaryAudienceUserPersona: Yup.string().nullable(),
  // Geographic Focus
  geographicFocus: Yup.string().required('Geographic focus is required'),
  geographicFocusOthers: Yup.string().when('geographicFocus', {
    is: 'others',
    then: (schema) => schema.required('Please specify the geographic focus'),
    otherwise: (schema) => schema.nullable(),
  }),
});

const UpdateAudience = ({ campaign, campaignMutate }) => {
  // Get existing values from campaign
  const defaultValues = useMemo(
    () => ({
      // Primary Audience
      audienceGender: campaign?.campaignRequirement?.gender || [],
      audienceAge: campaign?.campaignRequirement?.age || [],
      country: campaign?.campaignRequirement?.country || '',
      audienceLanguage: campaign?.campaignRequirement?.language || [],
      audienceCreatorPersona: campaign?.campaignRequirement?.creator_persona || [],
      audienceUserPersona: campaign?.campaignRequirement?.user_persona || '',
      // Secondary Audience
      secondaryAudienceGender: campaign?.campaignRequirement?.secondary_gender || [],
      secondaryAudienceAge: campaign?.campaignRequirement?.secondary_age || [],
      secondaryCountry: campaign?.campaignRequirement?.secondary_country || '',
      secondaryAudienceLanguage: campaign?.campaignRequirement?.secondary_language || [],
      secondaryAudienceCreatorPersona: campaign?.campaignRequirement?.secondary_creator_persona || [],
      secondaryAudienceUserPersona: campaign?.campaignRequirement?.secondary_user_persona || '',
      // Geographic Focus
      geographicFocus: campaign?.campaignRequirement?.geographic_focus || '',
      geographicFocusOthers: campaign?.campaignRequirement?.geographicFocusOthers || '',
    }),
    [campaign]
  );

  const methods = useForm({
    resolver: yupResolver(UpdateAudienceSchema),
    defaultValues,
  });

  const {
    handleSubmit,
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

  const country = watch('country');
  const secondaryCountry = watch('secondaryCountry');
  const geographicFocus = watch('geographicFocus');

  // Determine which Geographic Focus options to show
  const showMalaysiaOptions = country === 'Malaysia';
  const filteredGeographicFocusOptions = showMalaysiaOptions
    ? GEOGRAPHIC_FOCUS_OPTIONS
    : [GEOGRAPHIC_FOCUS_OPTIONS[0], GEOGRAPHIC_FOCUS_OPTIONS[1], GEOGRAPHIC_FOCUS_OPTIONS[4]];

  const onSubmit = useCallback(
    async (data) => {
      try {
        // Payload matching editCampaignRequirements controller
        const payload = {
          campaignId: campaign?.id,
          // Primary Audience
          audienceGender: data.audienceGender,
          audienceAge: data.audienceAge,
          audienceLanguage: data.audienceLanguage,
          audienceCreatorPersona: data.audienceCreatorPersona,
          audienceUserPersona: data.audienceUserPersona,
          country: data.country,
          // Secondary Audience
          secondaryAudienceGender: data.secondaryAudienceGender,
          secondaryAudienceAge: data.secondaryAudienceAge,
          secondaryAudienceLanguage: data.secondaryAudienceLanguage,
          secondaryAudienceCreatorPersona: data.secondaryAudienceCreatorPersona,
          secondaryAudienceUserPersona: data.secondaryAudienceUserPersona,
          secondaryCountry: data.secondaryCountry,
          // Geographic Focus
          geographicFocus: data.geographicFocus,
          geographicFocusOthers: data.geographicFocus === 'others' ? data.geographicFocusOthers : null,
        };

        await axiosInstance.patch(endpoints.campaign.editCampaignRequirements, payload);

        enqueueSnackbar('Target audience updated successfully!', { variant: 'success' });

        if (campaignMutate) {
          campaignMutate();
        }
      } catch (error) {
        console.error('Error updating requirements:', error);
        enqueueSnackbar(error?.message || 'Failed to update requirements', { variant: 'error' });
      }
    },
    [campaign?.id, campaignMutate]
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ maxWidth: '820px' }}>
        <Grid container spacing={3}>
          {/* PRIMARY AUDIENCE SECTION */}
          <Grid item xs={12} md={6}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 15,
                mb: 1,
                color: (theme) => (theme.palette.mode === 'light' ? '#000' : '#fff'),
              }}
            >
              Primary Audience
            </Typography>
            <Stack spacing={2}>
              {/* Gender */}
              <FormField label="Gender">
                <RHFMultiSelect
                  name="audienceGender"
                  placeholder="Select Gender"
                  options={GENDER_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                  chip
                />
              </FormField>

              {/* Age */}
              <FormField label="Age">
                <RHFMultiSelect
                  name="audienceAge"
                  placeholder="Select Age"
                  options={AGE_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                  chip
                />
              </FormField>

              {/* Country */}
              <FormField label="Country">
                <RHFAutocomplete
                  name="country"
                  placeholder="Select Country"
                  options={Object.keys(countriesCities)}
                  getOptionLabel={(option) => option || ''}
                  value={country ?? null}
                  slotProps={{
                    paper: {
                      sx: {
                        '& .MuiAutocomplete-listbox': {
                          maxHeight: 300,
                          overflowY: 'auto',
                          '&::-webkit-scrollbar': {
                            width: 8,
                          },
                          '&::-webkit-scrollbar-track': {
                            backgroundColor: '#f1f1f1',
                            borderRadius: 8,
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#888',
                            borderRadius: 8,
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: '#555',
                          },
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#888 #fff00',
                        },
                      },
                    },
                  }}
                  renderOption={(props, option) => {
                    const { ...optionProps } = props;
                    return (
                      <Box {...optionProps} sx={{ display: 'flex', gap: 1 }}>
                        <Iconify icon={`emojione:flag-for-${option.toLowerCase()}`} width={20} />
                        <Typography variant="subtitle2">{option}</Typography>
                      </Box>
                    );
                  }}
                />
              </FormField>

              {/* Language */}
              <FormField label="Language">
                <RHFMultiSelect
                  name="audienceLanguage"
                  placeholder="Select Language"
                  options={LANGUAGE_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                  chip
                />
              </FormField>

              {/* Creator's Interest */}
              <FormField label="Creator's Interest">
                <RHFMultiSelect
                  name="audienceCreatorPersona"
                  placeholder="Select Creator's Interest"
                  options={CREATOR_PERSONA_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                  chip
                />
              </FormField>

              {/* User Persona */}
              <FormField label="User Persona">
                <RHFTextField name="audienceUserPersona" multiline placeholder="User Persona" size="medium" />
              </FormField>
            </Stack>
          </Grid>

          {/* SECONDARY AUDIENCE SECTION */}
          <Grid item xs={12} md={6}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 15,
                mb: 1,
                color: (theme) => (theme.palette.mode === 'light' ? '#000' : '#fff'),
              }}
            >
              Secondary Audience (optional)
            </Typography>
            <Stack spacing={2}>
              {/* Gender */}
              <FormField label="Gender" required={false}>
                <RHFMultiSelect
                  name="secondaryAudienceGender"
                  placeholder="Select Gender"
                  options={GENDER_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                  chip
                />
              </FormField>

              {/* Age */}
              <FormField label="Age" required={false}>
                <RHFMultiSelect
                  name="secondaryAudienceAge"
                  placeholder="Select Age"
                  options={AGE_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                  chip
                />
              </FormField>

              {/* Country */}
              <FormField label="Country" required={false}>
                <RHFAutocomplete
                  name="secondaryCountry"
                  placeholder="Select country"
                  options={Object.keys(countriesCities)}
                  getOptionLabel={(option) => option || ''}
                  value={secondaryCountry ?? null}
                  slotProps={{
                    paper: {
                      sx: {
                        '& .MuiAutocomplete-listbox': {
                          maxHeight: 300,
                          overflowY: 'auto',
                          '&::-webkit-scrollbar': {
                            width: 8,
                          },
                          '&::-webkit-scrollbar-track': {
                            backgroundColor: '#f1f1f1',
                            borderRadius: 8,
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#888',
                            borderRadius: 8,
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: '#555',
                          },
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#888 #fff00',
                        },
                      },
                    },
                  }}
                  renderOption={(props, option) => {
                    const { ...optionProps } = props;
                    return (
                      <Box {...optionProps} sx={{ display: 'flex', gap: 1 }}>
                        <Iconify icon={`emojione:flag-for-${option.toLowerCase()}`} width={20} />
                        <Typography variant="subtitle2">{option}</Typography>
                      </Box>
                    );
                  }}
                />
              </FormField>

              {/* Language */}
              <FormField label="Language" required={false}>
                <RHFMultiSelect
                  name="secondaryAudienceLanguage"
                  placeholder="Select Language"
                  options={LANGUAGE_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                  chip
                />
              </FormField>

              {/* Interests */}
              <FormField label="Interests" required={false}>
                <RHFMultiSelect
                  name="secondaryAudienceCreatorPersona"
                  placeholder="Select interests"
                  options={CREATOR_PERSONA_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                  chip
                />
              </FormField>

              {/* User Persona */}
              <FormField label="User Persona" required={false}>
                <RHFTextField
                  name="secondaryAudienceUserPersona"
                  placeholder="User Persona"
                  multiline
                  size="medium"
                />
              </FormField>
            </Stack>
          </Grid>
        </Grid>

        {/* Geographic Focus */}
        <Box mt={3} sx={{ justifyContent: 'center' }}>
          <FormField label="Geographic Focus">
            <Stack spacing={1} direction="row">
              <RHFSelectV2
                name="geographicFocus"
                placeholder="Select Geographic Focus"
                multiple={false}
              >
                {filteredGeographicFocusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </RHFSelectV2>
              {geographicFocus === 'others' && (
                <RHFTextField
                  name="geographicFocusOthers"
                  placeholder="Geographic Focus"
                />
              )}
            </Stack>
          </FormField>
        </Box>

        {/* Submit Button */}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!isDirty}
            size='large'
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
            Save Target Audience
          </LoadingButton>
        </Stack>
      </Box>
    </FormProvider>
  );
};

UpdateAudience.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

export default memo(UpdateAudience);
