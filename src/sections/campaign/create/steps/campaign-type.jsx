import { useFormContext } from 'react-hook-form';
import React, { useMemo, useEffect } from 'react';

import { Box, MenuItem } from '@mui/material';

import { RHFSelect, RHFMultiSelect } from 'src/components/hook-form';

// normal = UGC with posting link
// UGC = UGC without posting link

const DELIVERABLE_OPTIONS = [
  { value: 'UGC_VIDEOS', label: 'UGC Videos', disabled: true },
  { value: 'PHOTOS', label: 'Photos' },
  { value: 'RAW_FOOTAGES', label: 'Raw Footages' },
  { value: 'ADS', label: 'Ads' },
];


const CampaignType = () => {
  const { watch, setValue } = useFormContext();

  const timelines = watch('timeline');
  const deliverables = watch('deliverables');

  const isPostingExist = useMemo(
    () =>
      timelines?.length &&
      timelines?.some((timeline) => timeline?.timeline_type?.name === 'Posting'),
    [timelines]
  );

  useEffect(() => {
    if (isPostingExist) {
      setValue('campaignType', 'normal');
    }
  }, [isPostingExist, setValue]);

  useEffect(() => {
    if (deliverables && !deliverables.includes('ugc_videos')) {
      setValue('deliverables', [...(deliverables || []), 'ugc_videos']);
    }
  }, [deliverables, setValue]);

  useEffect(() => {
    setValue('deliverables', ['ugc_videos']);
  }, [setValue]);

  const handleDeliverablesChange = (newValue) => {
    if (!newValue.includes('UGC_VIDEOS')) {
      setValue('deliverables', [...newValue, 'UGC_VIDEOS']);
    } else {
      setValue('deliverables', newValue);
    }
    
    // Set the boolean flags based on selected deliverables
    setValue('rawFootage', newValue.includes('RAW_FOOTAGES'));
    setValue('photos', newValue.includes('PHOTOS'));
    setValue('ads', newValue.includes('ADS'));
  };



  return (
    <Box sx={{ mb: 2, py: 2 }}>
      <RHFSelect
        name="campaignType"
        label="Campaign Type"
        helperText="The campaign type may affect the campaign timeline and creator submissions."
      >
        <MenuItem value="normal">UGC ( With Posting )</MenuItem>
        <MenuItem value="ugc">UGC ( No Posting )</MenuItem>
        {/* <MenuItem value="seeded" disabled>
          Seeded
        </MenuItem> */}
      </RHFSelect>

      <RHFMultiSelect
        name="deliverables"
        label="Deliverables"
        options={DELIVERABLE_OPTIONS}
        helperText="Select the types of deliverables required for this campaign. UGC Videos is required for all campaigns."
        onChange={handleDeliverablesChange}
        checkbox
        chip
        sx={{ mt: 3 }}
      />
    </Box>
  );
};

export default CampaignType;
