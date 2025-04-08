import React, { memo, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { Box } from '@mui/material';

import { RHFUpload } from 'src/components/hook-form';

const CampaignImageUpload = () => {
  const { setValue, watch } = useFormContext();

  const images = watch('campaignImages');

  console.log(images);

  const handleDropMultiFile = useCallback(
    (acceptedFiles) => {
      const files = images || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('campaignImages', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, images]
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
      <RHFUpload
        multiple
        thumbnail
        type="file"
        name="campaignImages"
        maxSize={3145728}
        onDrop={handleDropMultiFile}
        onRemove={(inputFile) =>
          setValue(
            'campaignImages',
            images && images?.filter((file) => file !== inputFile),
            { shouldValidate: true }
          )
        }
        onRemoveAll={() => setValue('campaignImages', [], { shouldValidate: true })}
      />
    </Box>
  );
};

export default memo(CampaignImageUpload);
