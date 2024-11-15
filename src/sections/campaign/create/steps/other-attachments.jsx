import React, { useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Box, Stack, Button, Typography, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFUpload, RHFTextField } from 'src/components/hook-form';

const OtherAttachments = () => {
  const { setValue, watch, control } = useFormContext();
  const values = watch();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'referencesLinks',
  });

  const handleDropMultiFile = useCallback(
    (acceptedFiles) => {
      const files = values.otherAttachments || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('otherAttachments', [...files, ...newFiles]);
    },
    [setValue, values.otherAttachments]
  );

  return (
    <>
      <RHFUpload
        name="otherAttachments"
        multiple
        type="otherAttachment"
        onDrop={handleDropMultiFile}
        onRemove={(inputFile) =>
          setValue(
            'otherAttachments',
            values.otherAttachments &&
              values.otherAttachments?.filter((file) => file !== inputFile),
            { shouldValidate: true }
          )
        }
        onRemoveAll={() => setValue('otherAttachments', [], { shouldValidate: true })}
      />

      <Box mt={3}>
        <Typography variant="h5">References</Typography>
        {fields.map((field, index) => (
          <Stack direction="row" alignItems="center" spacing={1} my={2}>
            <RHFTextField
              key={field.id}
              name={`referencesLinks.${index}.value`}
              placeholder={`Reference link ${index + 1}`}
            />
            {index !== 0 && (
              <IconButton color="error" onClick={() => remove(index)}>
                <Iconify icon="mdi:trash-outline" />
              </IconButton>
            )}
          </Stack>
        ))}
        <Button onClick={() => append()} fullWidth sx={{ mt: 2 }} variant="outlined">
          Add more link
        </Button>
      </Box>
    </>
  );
};

export default OtherAttachments;
