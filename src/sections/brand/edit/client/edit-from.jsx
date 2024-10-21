import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

import { Box, Stack, Button, Typography } from '@mui/material';

import { RHFTextField, RHFUploadAvatar } from 'src/components/hook-form';

const CompanyEditForm = ({ company, fieldsArray, methods }) => {
  const { fields, append } = fieldsArray;

  const { setValue } = methods;

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('companyLogo', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  return (
    <Stack spacing={5} mt={2}>
      <RHFUploadAvatar name="companyLogo" onDrop={handleDrop} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
          },
          // mt: 2,
          gap: 4,
        }}
      >
        <RHFTextField name="companyName" label="Company name" />
        <RHFTextField name="companyEmail" label="Company email" />
        <RHFTextField name="companyPhone" label="Company phone" />
        <RHFTextField name="companyAddress" label="Company address" />
        <RHFTextField name="companyWebsite" label="Company webiste" />
        <RHFTextField name="companyAbout" label="Company about" />
        <RHFTextField name="companyRegistrationNumber" label="Company registration number" />
      </Box>

      <Typography variant="h5">Objectives</Typography>

      <Stack spacing={2}>
        {fields.map((elem, index) => (
          <RHFTextField
            name={`companyObjectives[${index}].value`}
            label={`Objective ${index + 1}`}
          />
        ))}

        <Button
          fullWidth
          variant="contained"
          // onClick={() => permissionLength < 5 && setPermissionLength((prev) => prev + 1)}
          onClick={() => append({ value: '' })}
          sx={{
            my: 2,
          }}
        >
          +
        </Button>
      </Stack>
    </Stack>
  );
};

export default CompanyEditForm;

CompanyEditForm.propTypes = {
  company: PropTypes.object,
  fieldsArray: PropTypes.object,
  methods: PropTypes.func,
};
