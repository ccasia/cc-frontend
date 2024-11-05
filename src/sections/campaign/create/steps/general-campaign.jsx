import React, { memo } from 'react';

import { Box, MenuItem } from '@mui/material';

import { interestsLists } from 'src/contants/interestLists';

import { RHFSelect, RHFTextField, RHFMultiSelect } from 'src/components/hook-form';

const GeneralCampaign = () => {
  console.log('test');
  return (
    <Box
      gap={2}
      display="grid"
      mt={4}
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
      }}
    >
      <RHFTextField name="campaignTitle" label="Campaign Title" />

      <RHFTextField
        name="campaignDescription"
        label="let us know more about the campaign"
        multiline
      />

      <RHFSelect name="campaignObjectives" label="Campaign Objectives">
        <MenuItem value="I'm launching a new product">I&apos;m launching a new product</MenuItem>
        <MenuItem value="I'm launching a new service">I&apos;m launching a new service</MenuItem>
        <MenuItem value="I want to drive brand awareness">I want to drive brand awareness</MenuItem>
        <MenuItem value="Want to drive product awareness">Want to drive product awareness</MenuItem>
      </RHFSelect>

      <RHFMultiSelect
        name="campaignIndustries"
        label="Industries"
        checkbox
        chip
        options={interestsLists.map((item) => ({
          value: item.toLowerCase(),
          label: item,
        }))}
      />

      <RHFTextField name="brandTone" label="Brand Tone" multiline />
      <RHFTextField name="productName" label="Product/Service Name" multiline />
    </Box>
  );
};

export default memo(GeneralCampaign);
