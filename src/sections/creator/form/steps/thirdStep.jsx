import React from 'react';
import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';
import { formatIncompletePhoneNumber } from 'libphonenumber-js';

import { Stack, MenuItem, FormLabel, TextField, ListItemText } from '@mui/material';

import { countries } from 'src/assets/data';

import { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';

const ThirdStep = ({ item }) => {
  const { watch, control } = useFormContext();

  const nationality = watch('Nationality');
  const pronounce = watch('pronounce');

  const handlePhoneChange = (event, onChange) => {
    const formattedNumber = formatIncompletePhoneNumber(
      event.target.value,
      countries.find((country) => country.label === nationality).code
    ); // Replace 'MY' with your country code

    onChange(formattedNumber);
  };

  return (
    <>
      <ListItemText
        sx={{
          mt: 2,
          textAlign: 'center',
        }}
        primary={item.title}
        secondary={item.description}
        primaryTypographyProps={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          variant: 'h3',
          fontWeight: 400,
        }}
        secondaryTypographyProps={{
          variant: 'subtitle2',
        }}
      />

      <Stack
        gap={4}
        sx={{
          width: { sm: 400 },
          mx: 'auto',
          my: 5,
        }}
      >
        <Stack spacing={1}>
          <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
            Employment Status
          </FormLabel>
          <RHFSelect name="employment" label="Select Status" multiple={false}>
            <MenuItem value="fulltime">I have a full-time job</MenuItem>
            <MenuItem value="freelance">I&apos;m a freelancer</MenuItem>
            <MenuItem value="part_time">I only work part-time</MenuItem>
            <MenuItem value="student">I&apos;m a student</MenuItem>
            <MenuItem value="in_between">I&apos;m in between jobs/transitioning </MenuItem>
            <MenuItem value="unemployed">I&apos;m unemployed</MenuItem>
            <MenuItem value="others">Others </MenuItem>
          </RHFSelect>
        </Stack>

        <Stack spacing={1}>
          <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
            Phone Number
          </FormLabel>

          <Controller
            name="phone"
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

          {/* <RHFTextField
            name="phone"
            type="number"
            placeholder="Phone Number"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  +
                  {countries.filter((country) => country.label === nationality).map((e) => e.phone)}
                </InputAdornment>
              ),
            }}
          /> */}
        </Stack>

        <Stack spacing={1}>
          <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
            Pronouns
          </FormLabel>
          <RHFSelect name="pronounce" label="Pronouns" multiple={false}>
            <MenuItem value="he/him">He/Him</MenuItem>
            <MenuItem value="she/her">She/Her</MenuItem>
            <MenuItem value="they/them">They/Them</MenuItem>
            <MenuItem value="others">Others</MenuItem>
          </RHFSelect>
          {pronounce === 'others' && <RHFTextField name="otherPronounce" label="Pronounce" />}
        </Stack>

        <Stack spacing={1}>
          <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
            Birth Date
          </FormLabel>
          <RHFDatePicker name="birthDate" label="Birth Date" />
        </Stack>
      </Stack>
    </>
  );
};

export default ThirdStep;

ThirdStep.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};
