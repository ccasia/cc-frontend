import { useFormContext } from 'react-hook-form';
import React, { useMemo, useEffect } from 'react';

import { Box, MenuItem } from '@mui/material';

import { RHFSelect } from 'src/components/hook-form';

const CampaignType = () => {
  const { watch, setValue } = useFormContext();

  const timelines = watch('timeline');

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

  return (
    <Box sx={{ mb: 2 }}>
      <RHFSelect
        name="campaignType"
        label="Campaign Type"
        helperText="The campaign type may affect the campaign timeline and creator submissions."
      >
        <MenuItem value="normal">Normal</MenuItem>
        <MenuItem value="ugc">UGC</MenuItem>
        {/* <MenuItem value="seeded" disabled>
          Seeded
        </MenuItem> */}
      </RHFSelect>
    </Box>
  );
};

export default CampaignType;
