import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { formatIncompletePhoneNumber } from 'libphonenumber-js';

import { Box, Stack, TextField } from '@mui/material';

// import { Box, Stack, Button, TextField, Typography } from '@mui/material';

import { RHFTextField, RHFUploadAvatar } from 'src/components/hook-form';

const CompanyEditForm = ({ company, fieldsArray, methods }) => {
  const { control } = fieldsArray;

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

  const handlePhoneChange = (event, onChange) => {
    const formattedNumber = formatIncompletePhoneNumber(event.target.value, 'MY');
    onChange(formattedNumber);
  };

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
        <Controller
          name="companyPhone"
          control={control}
          defaultValue=""
          rules={{ required: 'Phone number is required' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              placeholder="Phone Number"
              variant="outlined"
              fullWidth
              error={!!fieldState.error}
              helperText={fieldState.error ? fieldState.error.message : ''}
              onChange={(event) => handlePhoneChange(event, field.onChange)}
            />
          )}
        />
        <RHFTextField name="companyAddress" label="Company address" />
        <RHFTextField name="companyWebsite" label="Company webiste" />
        <RHFTextField name="companyAbout" label="Company about" />
        <RHFTextField name="companyRegistrationNumber" label="Company registration number" />
      </Box>

      {/* <Typography variant="h5">Objectives</Typography>

      <Stack spacing={2}>
        {fields.map((elem, index) => (
          <Stack key={elem.id} direction="row" alignItems="center" spacing={1}>
            <RHFTextField
              name={`companyObjectives[${index}].value`}
              label={`Objective ${index + 1}`}
            />
            <IconButton color="error" onClick={() => remove(index)}>
              <Iconify icon="ic:outline-delete" />
            </IconButton>
          </Stack>
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
      </Stack> */}
    </Stack>
  );
};

export default CompanyEditForm;

CompanyEditForm.propTypes = {
  company: PropTypes.object,
  fieldsArray: PropTypes.object,
  methods: PropTypes.func,
};
