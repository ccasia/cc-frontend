import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Box,
  Grid,
  Stack,
  MenuItem,
  FormLabel,
  Typography,
} from '@mui/material';

import { langList } from 'src/contants/language';
import { countriesCities } from 'src/contants/countries';
import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';
import { RHFSelectV2, RHFTextField, RHFMultiSelect, RHFAutocomplete } from 'src/components/hook-form';

import { CustomRHFMultiSelect } from './custom-rhf-multi-select';


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

const LOCATION_OPTIONS = [
  { value: 'KlangValley', label: 'Klang Valley' },
  { value: 'Selangor', label: 'Selangor' },
  { value: 'KualaLumpur', label: 'Kuala Lumpur' },
  { value: 'MainCities', label: 'Main cities in Malaysia' },
  { value: 'EastMalaysia', label: 'East Malaysia' },
  { value: 'Others', label: 'Others' },
];

const CREATOR_PERSONA_OPTIONS = interestsLists.map((item) => ({
  value: item.toLowerCase(),
  label: item,
}));

const GEOGRAPHIC_FOCUS_OPTIONS = [
  { value: 'SEARegion', label: 'SEA Region' },
  { value: 'global', label: 'Global' },
];

const CampaignTargetAudience = () => {
  const { watch } = useFormContext();

  const country = watch('country');
  const secondaryCountry = watch('secondaryCountry');

  return (
    <Box sx={{ maxWidth: '816px', mx: 'auto', mb: 20 }}>
      <Box sx={{ mt: 4 }}>
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
                <CustomRHFMultiSelect
                  name="audienceGender"
                  placeholder="Select Gender"
                  options={GENDER_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                />
              </FormField>

              {/* Age */}
              <FormField label="Age">
                <CustomRHFMultiSelect
                  name="audienceAge"
                  placeholder="Select Age"
                  options={AGE_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
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

              {/* City/Area - conditional on Malaysia */}
              {country?.toLowerCase() === 'malaysia' && (
                <FormField label="Geo Location">
                  <RHFMultiSelect
                    name="audienceLocation"
                    placeholder="Select Geo Location"
                    checkbox
                    chip
                    options={LOCATION_OPTIONS}
                    rules={{
                      required: 'At least one option',
                      validate: (value) => value && value.length > 0 ? true : 'At least one option',
                    }}
                  />
                </FormField>
              )}

              {/* Other Location */}
              {watch('audienceLocation')?.includes('Others') && (
                <RHFTextField
                  name="othersAudienceLocation"
                  label="Specify Other Location"
                  variant="outlined"
                />
              )}

              {/* Language */}
              <FormField label="Language">
                <CustomRHFMultiSelect
                  name="audienceLanguage"
                  placeholder="Select Language"
                  options={LANGUAGE_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                />
              </FormField>

              {/* Interests */}
              <FormField label="Creator's Interest">
                <CustomRHFMultiSelect
                  name="audienceCreatorPersona"
                  placeholder="Select Creator's Interest"
                  options={CREATOR_PERSONA_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                />
              </FormField>

              {/* User Persona */}
              <FormField label="User Persona">
                <RHFTextField
                  name="audienceUserPersona"
                  placeholder="User Persona"
                  size="medium"
                />
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
              Secondary Audience (if any)
            </Typography>
            <Stack spacing={2}>
              {/* Gender */}
              <FormField label="Gender" required={false}>
                <CustomRHFMultiSelect
                  name="secondaryAudienceGender"
                  placeholder="Select Gender"
                  options={GENDER_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                />
              </FormField>

              {/* Age */}
              <FormField label="Age" required={false}>
                <CustomRHFMultiSelect
                  name="secondaryAudienceAge"
                  placeholder="Select Age"
                  options={AGE_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
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

              {/* City/Area - conditional on Malaysia */}
              {secondaryCountry?.toLowerCase() === 'malaysia' && (
                <FormField label="City/Area" required={false}>
                  <RHFMultiSelect
                    name="secondaryAudienceLocation"
                    placeholder="Select city"
                    checkbox
                    chip
                    options={LOCATION_OPTIONS}
                  />
                </FormField>
              )}

              {/* Other Location */}
              {watch('secondaryAudienceLocation')?.includes('Others') && (
                <RHFTextField
                  name="secondaryOthersAudienceLocation"
                  label="Specify Other Location"
                  variant="outlined"
                />
              )}

              {/* Language */}
              <FormField label="Language" required={false}>
                <CustomRHFMultiSelect
                  name="secondaryAudienceLanguage"
                  placeholder="Select Language"
                  options={LANGUAGE_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                />
              </FormField>

              {/* Interests */}
              <FormField label="Interests" required={false}>
                <CustomRHFMultiSelect
                  name="secondaryAudienceCreatorPersona"
                  placeholder="Select interests"
                  options={CREATOR_PERSONA_OPTIONS}
                  size="small"
                  checkbox
                  sx={{
                    '& .MuiOutlinedInput-root': { minHeight: '50px' },
                  }}
                />
              </FormField>

              {/* User Persona */}
              <FormField label="User Persona" required={false}>
                <RHFTextField
                  name="secondaryAudienceUserPersona"
                  placeholder="User Persona"
                  size="medium"
                />
              </FormField>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Geographic Focus */}
      <Box sx={{ mt: 2, width: { xs: '100%', sm: 500 }, justifySelf: 'center' }}>
        <FormField label="Geographic Focus">
          <RHFSelectV2
            name="geographicFocus"
            placeholder="Select Geographic Focus"
            multiple={false}
          >
            {GEOGRAPHIC_FOCUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </RHFSelectV2>
        </FormField>
      </Box>
    </Box>
  );
};

export default memo(CampaignTargetAudience);
