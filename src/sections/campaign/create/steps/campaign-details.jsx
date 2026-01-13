import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Box, Grid, Stack, Button, FormLabel, Typography, IconButton } from '@mui/material';

import { langList } from 'src/contants/language';
import { countriesCities } from 'src/contants/countries';

import Iconify from 'src/components/iconify';
import { RHFTextField, RHFMultiSelect, RHFAutocomplete } from 'src/components/hook-form';

import { interestsList } from 'src/sections/creator/form/creatorForm';

const videoAngle = [
  'Product Demo/Review',
  'Service Demo/Review',
  'Testimonial',
  'Story Telling',
  'Organic (soft sell)',
  'Point Of View (experience with product/service)',
  'Walkthrough',
  'Problem vs Solution',
  'Trends',
  'Up to cult creative to decide',
];

const FormField = ({ label, children, required = true }) => (
  <Stack spacing={0.5}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
        fontSize: '0.875rem', // Smaller font size for labels
        mb: 0.5,
        '& .MuiFormLabel-asterisk': {
          color: '#FF3500', // Change this to your desired color
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

const BoxStyle = {
  border: 1,
  borderColor: (theme) => theme.palette.divider,
  borderRadius: 2,
  p: 3,
  mt: -1,
  mb: 3,
  width: '100%',
  '& .header': {
    borderBottom: 1,
    borderColor: (theme) => theme.palette.divider,
    mx: -3,
    mt: -1,
    mb: 2,
    pb: 1.5,
    pt: -3,
    px: 1.8,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
};

const CampaignDetails = () => {
  const { control, watch } = useFormContext();

  const audienceGeoLocation = watch('audienceLocation');
  const country = watch('country'); // Now an array of countries

  const {
    append: doAppend,
    fields: doFields,
    remove: doRemove,
  } = useFieldArray({
    name: 'campaignDo',
    control,
  });

  const {
    append: dontAppend,
    fields: dontFields,
    remove: dontRemove,
  } = useFieldArray({
    name: 'campaignDont',
    control,
  });

  return (
    <Stack spacing={3} sx={{ maxWidth: '800px', mx: 'auto' }}>
      <Box
        rowGap={2}
        columnGap={3}
        display="grid"
        mt={4}
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
        }}
      >
        {/* Left grid - Target Audience */}
        <Stack spacing={2}>
          <FormField label="Audience Gender">
            <RHFMultiSelect
              name="audienceGender"
              placeholder="Select Gender"
              chip
              checkbox
              // chip
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'nonbinary', label: 'Non-Binary' },
              ]}
            />
          </FormField>

          <FormField label="Audience Country">
            <RHFAutocomplete
              name="country"
              placeholder="Select countries"
              multiple
              disableCloseOnSelect
              options={Object.keys(countriesCities)}
              getOptionLabel={(option) => option}
              slotProps={{
                paper: {
                  sx: {
                    '& .MuiAutocomplete-listbox': {
                      maxHeight: 300, // force scroll
                      overflowY: 'auto',
                      /* Scrollbar customization */
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
                      /* Firefox */
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#888 #fff00',
                    },
                  },
                },
              }}
              renderOption={(props, option) => {
                // eslint-disable-next-line react/prop-types
                const { key, ...optionProps } = props;

                return (
                  <Box key={key} {...optionProps} sx={{ display: 'flex', gap: 1 }}>
                    <Iconify icon={`emojione:flag-for-${option.toLowerCase()}`} width={20} />
                    <Typography variant="subtitle2">{option}</Typography>
                  </Box>
                );
              }}
            />
          </FormField>

          {country?.some((c) => c?.toLowerCase() === 'malaysia') && (
            <FormField label="Audience City/Area">
              <RHFMultiSelect
                name="audienceLocation"
                placeholder="Select city"
                checkbox
                chip
                options={[
                  { value: 'KlangValley', label: 'Klang Valley' },
                  { value: 'Selangor', label: 'Selangor' },
                  { value: 'KualaLumpur', label: 'Kuala Lumpur' },
                  { value: 'MainCities', label: 'Main cities in Malaysia' },
                  { value: 'EastMalaysia', label: 'East Malaysia' },
                  { value: 'Others', label: 'Others' },
                ]}
              />
            </FormField>
          )}

          {audienceGeoLocation?.includes('Others') && (
            <RHFTextField
              name="othersAudienceLocation"
              label="Specify Other Location"
              variant="outlined"
            />
          )}

          <FormField label="Audience Age">
            <RHFMultiSelect
              name="audienceAge"
              checkbox
              chip
              options={[
                { value: '18-25', label: '18-25' },
                { value: '26-34', label: '26-34' },
                { value: '35-40', label: '35-40' },
                { value: '>40', label: '>40' },
              ]}
              placeholder="Select Age"
            />
          </FormField>

          <FormField label="Audience Language">
            <RHFMultiSelect
              name="audienceLanguage"
              placeholder="Select Language"
              checkbox
              chip
              options={langList.sort().map((lang) => ({ value: lang, label: lang }))}
            />
          </FormField>
        </Stack>

        {/* Right grid - Target Audience */}
        <Stack spacing={2}>
          <FormField label="User Persona">
            <RHFTextField
              name="audienceUserPersona"
              placeholder="Let us know who you want your campaign to reach!"
              multiline
              rows={3}
            />
          </FormField>
          <FormField label="Audience Creator Persona">
            <RHFMultiSelect
              name="audienceCreatorPersona"
              placeholder="Select creator persona"
              checkbox
              chip
              options={interestsList.map((item) => ({
                value: item.toLowerCase(),
                label: item,
              }))}
            />
          </FormField>
          <FormField label="Social Media Platform">
            <RHFMultiSelect
              name="socialMediaPlatform"
              placeholder="Select Platform"
              checkbox
              chip
              options={[
                { value: 'instagram', label: 'Instagram' },
                { value: 'tiktok', label: 'TikTok' },
              ]}
            />
          </FormField>
          <FormField label="Video Angle">
            <RHFMultiSelect
              name="videoAngle"
              placeholder="Select Angle"
              checkbox
              chip
              options={videoAngle.map((angle) => ({ value: angle, label: angle }))}
            />
          </FormField>
        </Stack>

        {audienceGeoLocation === 'Others' && <Box flexGrow={1} />}
      </Box>

      {/* Dos and Donts */}
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={5}>
        <Typography
          sx={{
            fontSize: 40,
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          }}
        >
          Dos and Don&apos;ts
        </Typography>
        <Typography variant="caption" fontWeight={700} mt={1} color="text.secondary">
          OPTIONAL
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="mdi:checkbox-outline"
                color="#026D54"
                sx={{
                  width: 20,
                  height: 20,
                }}
              />

              <Typography
                variant="body2"
                sx={{
                  // color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                }}
              >
                CAMPAIGN DO&apos;S
              </Typography>
            </Box>
            <Stack direction="column" spacing={1.5}>
              {doFields.map((item, index) => (
                <Stack key={item.id} direction="row" alignItems="center">
                  <RHFTextField name={`campaignDo[${index}].value`} label={`No. ${index + 1}`} />
                  {index !== 0 && (
                    <IconButton color="error" onClick={() => doRemove(index)}>
                      <Iconify icon="ic:outline-delete" color="error.main" />
                    </IconButton>
                  )}
                </Stack>
              ))}

              <Button
                variant="contained"
                style={{
                  color: '#231F20',
                  backgroundColor: '#fff',
                  border: '1px solid #E7E7E7',
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                }}
                onClick={() => doAppend({ value: '' })}
              >
                Add Do
              </Button>
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="charm:square-cross"
                color="error.main"
                sx={{
                  width: 20,
                  height: 20,
                }}
              />

              <Typography
                variant="body2"
                sx={{
                  color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN DONT&apos;S
              </Typography>
            </Box>
            <Stack direction="column" spacing={1.5}>
              {dontFields.map((item, index) => (
                <Stack key={item.id} direction="row" alignItems="center">
                  <RHFTextField name={`campaignDont[${index}].value`} label={`No. ${index + 1}`} />
                  {index !== 0 && (
                    <IconButton color="error" onClick={() => dontRemove(index)}>
                      <Iconify icon="ic:outline-delete" color="error.main" />
                    </IconButton>
                  )}
                </Stack>
              ))}

              <Button
                variant="contained"
                style={{
                  color: '#231F20',
                  backgroundColor: '#fff',
                  border: '1px solid #E7E7E7',
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                }}
                onClick={() => dontAppend({ value: '' })}
              >
                Add Don&apos;t
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default memo(CampaignDetails);