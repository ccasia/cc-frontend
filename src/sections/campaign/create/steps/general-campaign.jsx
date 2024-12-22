import React, { memo } from 'react';

import { Box, Stack, MenuItem, FormLabel } from '@mui/material';

import { interestsLists } from 'src/contants/interestLists';

import { RHFSelect, RHFTextField } from 'src/components/hook-form';

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

const GeneralCampaign = () => (
  <Box
    gap={2}
    display="grid"
    mt={4}
    gridTemplateColumns={{
      xs: 'repeat(1, 1fr)',
      sm: 'repeat(1, 1fr)',
    }}
  >
    <FormField label="Campaign Title">
      <RHFTextField name="campaignTitle" placeholder="Campaign Title" />
    </FormField>

    <FormField label="Campaign Info">
      <RHFTextField
        name="campaignDescription"
        placeholder="Explain more about the campaign..."
        multiline
        rows={4}
      />
    </FormField>

    <FormField label="Brand Tone">
      <RHFTextField name="brandTone" placeholder="Brand Tone" multiline />
    </FormField>

    <FormField label="Product/Service Name">
      <RHFTextField name="productName" placeholder="Product/Service Name" multiline />
    </FormField>

    <FormField label="Campaign Objectives">
      <RHFSelect name="campaignObjectives" label="Campaign Objective">
        <MenuItem value="I'm launching a new product">I&apos;m launching a new product</MenuItem>
        <MenuItem value="I'm launching a new service">I&apos;m launching a new service</MenuItem>
        <MenuItem value="I want to drive brand awareness">I want to drive brand awareness</MenuItem>
        <MenuItem value="Want to drive product awareness">Want to drive product awareness</MenuItem>
      </RHFSelect>
    </FormField>

    <FormField label="Industry">
      <RHFSelect name="campaignIndustries" label="Industry">
        {interestsLists.map((item, index) => (
          <MenuItem key={index} value={item}>
            {item}
          </MenuItem>
        ))}
      </RHFSelect>
    </FormField>
  </Box>
);

export default memo(GeneralCampaign);
