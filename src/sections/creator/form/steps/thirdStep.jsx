import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import { Stack, Select, MenuItem, FormLabel, ListItemText, Box } from '@mui/material';

import { countries } from 'src/assets/data';
import { primaryFont } from 'src/theme/typography';

import { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';

// Add error icon component
const ErrorIcon = () => (
  <Box
    component="img"
    src="/assets/icons/components/ic_fillpaymenterror.svg"
    sx={{
      width: 20,
      height: 20,
      ml: 1,
      flexShrink: 0,
    }}
  />
);

const ThirdStep = ({ item, setCountryCode, countryCode }) => {
  const { watch, formState: { errors } } = useFormContext();

  // const nationality = watch('Nationality');
  const pronounce = watch('pronounce');

  // const handlePhoneChange = (event, onChange) => {
  //   const formattedNumber = formatIncompletePhoneNumber(
  //     event.target.value,
  //     countries.find((country) => country.label === nationality).code
  //   ); // Replace 'MY' with your country code

  //   onChange(formattedNumber);
  // };

  const handleChangeCountryCode = (val) => {
    setCountryCode(val);
  };

  return (
    <>
      <ListItemText
        sx={{
          mt: 4,
          textAlign: 'center',
        }}
        primary={item.title}
        secondary={item.description}
        primaryTypographyProps={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: { xs: '28px', sm: '40px' },
          fontWeight: 400,
          color: '#231F20',
        }}
        secondaryTypographyProps={{
          fontFamily: 'InterDisplay',
          fontSize: { xs: '14px', sm: '16px' },
          fontWeight: 400,
          color: '#636366',
          mt: 1,
        }}
      />

      <Stack
        gap={4}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 400 },
          mx: 'auto',
          my: { xs: 4, sm: 5 },
          px: { xs: 1, sm: 0 },
        }}
      >

        {/* Employment Status - no longer needed in onboarding form */}
        {/* <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: '#231F20', fontFamily: primaryFont, fontSize: '14px' }}
          >
            Employment Status
          </FormLabel>
          <RHFSelect name="employment" multiple={false}>
            <MenuItem value="fulltime">I have a full-time job</MenuItem>
            <MenuItem value="freelance">I&apos;m a freelancer</MenuItem>
            <MenuItem value="part_time">I only work part-time</MenuItem>
            <MenuItem value="student">I&apos;m a student</MenuItem>
            <MenuItem value="in_between">I&apos;m in between jobs/transitioning </MenuItem>
            <MenuItem value="unemployed">I&apos;m unemployed</MenuItem>
            <MenuItem value="others">Others </MenuItem>
          </RHFSelect>
        </Stack> */}

        <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: '#231F20', fontFamily: primaryFont, fontSize: '14px' }}
          >
            Phone Number
          </FormLabel>

          <Stack direction="row" alignItems="center">
            <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
              <Select
                sx={{
                  bgcolor: 'white',
                  borderRadius: 1,
                  width: { xs: 80, sm: 90 },
                  height: { xs: 52, sm: 56 },
                  '& .MuiSelect-select': {
                    p: { xs: '8px 8px', sm: '14px 12px' },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  '&.MuiInputBase-root': {
                    fontFamily: 'monospace',
                  }
                }}
                value={countryCode}
                onChange={(e) => handleChangeCountryCode(e.target.value)}
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      '& .MuiMenuItem-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        fontFamily: 'monospace',
                        py: 1,
                        display: 'flex',
                        justifyContent: 'center',
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled sx={{ fontFamily: 'inherit', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Code
                </MenuItem>
                {[...new Set(countries.map((c) => c.phone).filter(Boolean))]
                  .sort((a, b) => {
                    const phoneA = parseInt(a.replace(/-/g, ''), 10);
                    const phoneB = parseInt(b.replace(/-/g, ''), 10);
                    return phoneA - phoneB;
                  })
                  .map((val, index) => (
                    <MenuItem key={index} value={val}>
                      +{val}
                    </MenuItem>
                  ))}
              </Select>

              <RHFTextField
                name="phone"
                placeholder="Phone Number"
                InputLabelProps={{ shrink: false }}
                type="number"
                sx={{
                  width: '100%',
                  '&.MuiTextField-root': {
                    bgcolor: 'white',
                    borderRadius: 1,
                    '& .MuiInputLabel-root': {
                      display: 'none',
                    },
                    '& .MuiInputBase-input': {
                      p: { xs: '13px 14px', sm: '16.5px 14px' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#B0B0B0',
                      fontSize: { xs: '14px', sm: '16px' },
                      opacity: 1,
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  },
                }}
              />
            </Stack>
            {errors.phone && <ErrorIcon />}
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
            Pronouns
          </FormLabel>
          <Stack direction="row" alignItems="center">
            <RHFSelect name="pronounce" multiple={false} sx={{ flex: 1 }}>
              <MenuItem value="he/him">He/Him</MenuItem>
              <MenuItem value="she/her">She/Her</MenuItem>
              <MenuItem value="they/them">They/Them</MenuItem>
              <MenuItem value="others">Others</MenuItem>
            </RHFSelect>
            {errors.pronounce && <ErrorIcon />}
          </Stack>
          {pronounce === 'others' && (
            <Stack direction="row" alignItems="center">
              <RHFTextField name="otherPronounce" label="Pronounce" sx={{ flex: 1 }} />
              {errors.otherPronounce && <ErrorIcon />}
            </Stack>
          )}
        </Stack>

        <Stack spacing={1}>
          <FormLabel required sx={{ fontWeight: 600, color: 'black' }}>
            Birth Date
          </FormLabel>
          <Stack direction="row" alignItems="center">
            <RHFDatePicker name="birthDate" sx={{ flex: 1 }} />
            {errors.birthDate && <ErrorIcon />}
          </Stack>
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
  setCountryCode: PropTypes.func,
  countryCode: PropTypes.string,
};
