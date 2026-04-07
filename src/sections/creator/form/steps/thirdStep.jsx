import PropTypes from 'prop-types';
import React, { forwardRef } from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { Controller, useFormContext } from 'react-hook-form';

import {
  Box,
  Stack,
  Select,
  colors,
  Divider,
  MenuItem,
  FormLabel,
  TextField,
  Typography,
  ListItemText,
  FormHelperText,
} from '@mui/material';

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

// eslint-disable-next-line react/prop-types
const MuiPhoneInput = forwardRef(({ value, onChange, ...rest }, ref) => (
  <TextField
    {...rest}
    inputRef={ref}
    value={value ?? ''}
    onChange={onChange}
    fullWidth
    size="large"
  />
));

MuiPhoneInput.displayName = 'MuiPhoneInput';

// react-phone-number-input calls onChange(countryCode) directly, not via a DOM event
const CountrySelect = ({ value, onChange, options, iconComponent: FlagIcon }) => (
  <Select
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value || undefined)}
    displayEmpty
    size="large"
    sx={{ mr: 1 }}
    renderValue={(selected) =>
      selected ? (
        <Box sx={{ display: 'flex', alignItems: 'center', borderRadius: 1 }}>
          <FlagIcon country={selected} label={selected} />
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: colors.grey[500] }}>
          --
        </Typography>
      )
    }
  >
    {options.map((option, index) =>
      option.divider ? (
        // eslint-disable-next-line react/no-array-index-key
        <Divider key={`divider-${index}`} />
      ) : (
        <MenuItem key={option.value ?? 'international'} value={option.value ?? ''}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {option.value && <FlagIcon country={option.value} label={option.label} />}
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        </MenuItem>
      )
    )}
  </Select>
);

CountrySelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array,
  iconComponent: PropTypes.elementType,
};

const ThirdStep = ({ item, setCountryCode, countryCode }) => {
  const {
    watch,
    formState: { errors },
  } = useFormContext();

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
          mt: 3,
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
        gap={2}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 400 },
          mx: 'auto',
          my: { xs: 2, sm: 5 },
          px: { xs: 1, sm: 0 },
        }}
      >
        <Stack spacing={1}>
          <FormLabel
            required
            sx={{ fontWeight: 600, color: '#231F20', fontFamily: primaryFont, fontSize: '14px' }}
          >
            Phone Number
          </FormLabel>

          <Controller
            name="phone"
            render={({ field }) => (
              <Box>
                <PhoneInput
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? '')}
                  onBlur={field.onBlur}
                  defaultCountry="MY"
                  inputComponent={MuiPhoneInput}
                  countrySelectComponent={CountrySelect}
                  placeholder="Eg. 60192399123"
                />
                {errors.phoneNumber && (
                  <FormHelperText error sx={{ mx: 1.5 }}>
                    {errors.phoneNumber.message}
                  </FormHelperText>
                )}
              </Box>
            )}
          />
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
