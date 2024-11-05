import React, { memo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Box, Grid, Stack, Button, Divider, Typography, IconButton } from '@mui/material';

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
        <Typography variant="h4">Target Audience</Typography>
        <Box flexGrow={1} />

        <RHFMultiSelect
          name="audienceGender"
          label="Audience Gender"
          checkbox
          chip
          options={[
            { value: 'female', label: 'Female' },
            { value: 'male', label: 'Male' },
            { value: 'nonbinary', label: 'Non-Binary' },
          ]}
        />

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
          label="Audience Age"
        />

        <RHFMultiSelect
          name="audienceLocation"
          label="Audience City/Area"
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

        {audienceGeoLocation?.includes('Others') && (
          <RHFTextField
            name="othersAudienceLocation"
            label="Specify Other Location"
            variant="outlined"
          />
        )}

        <RHFAutocomplete
          multiple
          disableCloseOnSelect
          name="audienceLanguage"
          label="Audience Language"
          options={langList.sort()}
          getOptionLabel={(option) => option || ''}
        />

        <RHFMultiSelect
          name="audienceCreatorPersona"
          label="Audience Creator Persona"
          checkbox
          chip
          options={interestsLists.map((item) => ({
            value: item.toLowerCase(),
            label: item,
          }))}
        />

        <RHFTextField
          name="audienceUserPersona"
          label="User Persona"
          placeholder=" let us know who you want your campaign to reach!"
        />

        {audienceGeoLocation === 'Others' && <Box flexGrow={1} />}
      </Box>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <RHFMultiSelect
        name="socialMediaPlatform"
        label="Social Media Platform"
        checkbox
        chip
        options={[
          { value: 'instagram', label: 'Instagram' },
          { value: 'tiktok', label: 'Tikok' },
        ]}
      />

      <RHFMultiSelect
        name="videoAngle"
        label="Video Angle"
        checkbox
        chip
        options={videoAngle.map((angle) => ({ value: angle, label: angle }))}
      />

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h5">Dos and Don&apos;ts</Typography>
        <Typography variant="caption" color="text.secondary">
          ( optional )
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
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
        </Grid>
        <Grid item xs={12} sm={6}>
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
        </Grid>
      </Grid>
    </Stack>
  );
};

export default memo(CampaignDetails);
