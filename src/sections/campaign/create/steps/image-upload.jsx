import React, { memo, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { Box, Typography } from '@mui/material';

import { RHFUpload } from 'src/components/hook-form';

const CampaignImageUpload = () => {
  const { setValue, watch } = useFormContext();

  const values = watch();

  const handleDropMultiFile = useCallback(
    (acceptedFiles) => {
      const files = values.campaignImages || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('campaignImages', [...files, ...newFiles]);
    },
    [setValue, values.campaignImages]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        gap: 3,
        p: 3,
      }}
    >
      <Typography variant="h4">Upload Campaign Images</Typography>
      <RHFUpload
        multiple
        thumbnail
        name="campaignImages"
        maxSize={3145728}
        onDrop={handleDropMultiFile}
        onRemove={(inputFile) =>
          setValue(
            'campaignImages',
            values.campaignImages && values.campaignImages?.filter((file) => file !== inputFile),
            { shouldValidate: true }
          )
        }
        onRemoveAll={() => setValue('campaignImages', [], { shouldValidate: true })}
      />
    </Box>
  );
};

export default memo(CampaignImageUpload);
