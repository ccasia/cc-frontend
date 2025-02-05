import React, { memo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Box, Grid, Chip, Stack, Button, FormLabel, Typography, IconButton } from '@mui/material';

import { langList } from 'src/contants/language';
import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';
import { RHFTextField, RHFMultiSelect, RHFAutocomplete } from 'src/components/hook-form';

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

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children }) => (
  <Stack spacing={1}>
    <FormLabel
      required
      sx={{
        fontWeight: 600,
        color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
      }}
    >
      {label}
    </FormLabel>
    {children}
  </Stack>
);

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
    <Stack spacing={3}>
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

          <FormField label="Audience City/Area">
            <RHFMultiSelect
              name="audienceLocation"
              placeholder="Select city "
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

          {audienceGeoLocation?.includes('Others') && (
            <RHFTextField
              name="othersAudienceLocation"
              label="Specify Other Location"
              variant="outlined"
            />
          )}

          <FormField label="Audience Creator Persona">
            <RHFMultiSelect
              name="audienceCreatorPersona"
              placeholder="Select audience creator persona"
              checkbox
              chip
              options={interestsLists.map((item) => ({
                value: item.toLowerCase(),
                label: item,
              }))}
            />
          </FormField>
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
            <RHFAutocomplete
              multiple
              disableCloseOnSelect
              name="audienceLanguage"
              placeholder="Select Language"
              options={langList.sort()}
              getOptionLabel={(option) => option || ''}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      variant="outlined"
                      sx={{
                        border: 1,
                        borderColor: '#EBEBEB',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        py: 2,
                      }}
                      label={option}
                      key={key}
                      {...tagProps}
                    />
                  );
                })
              }
            />
          </FormField>
        </Stack>

        <Stack spacing={3}>
          <FormField label="Creator Persona">
            <RHFTextField
              name="audienceUserPersona"
              placeholder=" let us know who you want your campaign to reach!"
              multiline
              rows={3}
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

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={5}>
        <Typography
          // variant="h5"
          sx={{
            fontSize: 40,
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          }}
        >
          Dos and Don&apos;ts
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ( optional )
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="mdi:checkbox-outline"
                color="success.main"
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
            <Stack direction="column" spacing={2}>
              {doFields.map((item, index) => (
                <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                  <RHFTextField
                    name={`campaignDo[${index}].value`}
                    label={`Campaign Do's ${index + 1}`}
                  />
                  {index !== 0 && (
                    <IconButton color="error" onClick={() => doRemove(index)}>
                      <Iconify icon="ic:outline-delete" color="error.main" />
                    </IconButton>
                  )}
                </Stack>
              ))}

              <Button variant="contained" onClick={() => doAppend({ value: '' })}>
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
            <Stack direction="column" spacing={2}>
              {dontFields.map((item, index) => (
                <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                  <RHFTextField
                    name={`campaignDont[${index}].value`}
                    label={`Campaign Dont's ${index + 1}`}
                  />
                  {index !== 0 && (
                    <IconButton color="error" onClick={() => dontRemove(index)}>
                      <Iconify icon="ic:outline-delete" color="error.main" />
                    </IconButton>
                  )}
                </Stack>
              ))}

              <Button variant="contained" onClick={() => dontAppend({ value: '' })}>
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
