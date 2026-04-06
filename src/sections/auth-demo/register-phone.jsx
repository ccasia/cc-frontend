/* eslint-disable react/prop-types */
import * as Yup from 'yup';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import toast from 'react-hot-toast';
import 'react-phone-number-input/style.css';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  colors,
  Select,
  Divider,
  MenuItem,
  TextField,
  Typography,
  FormHelperText,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import FormProvider from 'src/components/hook-form';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

const PhoneNumberSchema = Yup.object().shape({
  phoneNumber: Yup.string()
    .required('Phone number is required')
    .test('is-valid-phone', 'Please enter a valid phone number', (value) =>
      value ? isValidPhoneNumber(value) : false
    ),
});

const StackMotion = m(Stack);

// Wraps MUI TextField so react-phone-number-input can forward its ref to the input element
const MuiPhoneInput = forwardRef(({ value, onChange, ...rest }, ref) => (
  <TextField
    {...rest}
    inputRef={ref}
    value={value ?? ''}
    onChange={onChange}
    fullWidth
    size="small"
  />
));

MuiPhoneInput.displayName = 'MuiPhoneInput';

// react-phone-number-input calls onChange(countryCode) directly, not via a DOM event
const CountrySelect = ({ value, onChange, options, iconComponent: FlagIcon }) => (
  <Select
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value || undefined)}
    displayEmpty
    size="small"
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

const PhoneNumberInput = ({ onBack }) => {
  const router = useRouter();

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(PhoneNumberSchema),
    defaultValues: { phoneNumber: '' },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmitPhone = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post('/api/auth/sendVerificationCode', data);
      console.log(res.data);
      // localStorage.setItem('signedPayload', res.data);
      toast.success('Successfully sent!');
      router.push(paths.auth.jwt.code);
    } catch (error) {
      toast.error(error?.message || 'Failed to send.');
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmitPhone}>
      <StackMotion
        key="phone"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ type: 'spring', duration: 0.2 }}
        gap={1.5}
      >
        <Typography variant="h4" sx={{ alignSelf: 'start', textAlign: 'start' }}>
          Enter your phone 📱
          <br />
          <Typography variant="subtitle2" sx={{ color: colors.grey[500] }}>
            We&apos;ll send a verification code to confirm it&apos;s you.
          </Typography>
        </Typography>

        <Stack gap={1.5}>
          <Controller
            name="phoneNumber"
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

          <LoadingButton
            loading={isSubmitting}
            variant="contained"
            sx={{ mt: 1.5 }}
            type="submit"
            size="large"
          >
            Send code
          </LoadingButton>

          <Button
            // startIcon={<Iconify icon="mingcute:back-fill" />}
            onClick={onBack}
            // variant="outlined"
          >
            Sign up with email
          </Button>
        </Stack>
      </StackMotion>
    </FormProvider>
  );
};

export default PhoneNumberInput;

PhoneNumberInput.propTypes = {
  onBack: PropTypes.func,
};
