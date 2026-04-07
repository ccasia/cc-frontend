import * as Yup from 'yup';
import { m } from 'framer-motion';
import React, { useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, IconButton, Typography, InputAdornment } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import FormProvider, { RHFTextField } from 'src/components/hook-form';

import useAuthCodeContext from './hooks/use-auth-code';

const StackMotion = m(Stack);

const labelSx = { fontSize: '13px', mb: -2, textAlign: 'left' };
const fieldSx = {
  '&.MuiTextField-root': {
    bgcolor: 'white',
    borderRadius: 1,
    '& .MuiInputLabel-root': { display: 'none' },
    '& .MuiInputBase-input::placeholder': { color: '#B0B0B0', fontSize: '16px', opacity: 1 },
  },
};
const errorSx = {
  color: '#F04438',
  mt: 0.5,
  ml: 0.5,
  display: 'block',
  fontSize: '12px',
  textAlign: 'left',
};

const RegisterSchema = Yup.object().shape({
  name: Yup.string().required('Name is required.'),
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email entered. Please try again.'),
  password: Yup.string()
    .required('Password is required.')
    .min(8, 'Password must be at least 8 characters long.')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .matches(/[0-9]/, 'Password must contain at least one number.')
    .matches(/[@$!%*?&#]/, 'Password must contain at least one special character.'),
});

const defaultValues = { name: '', email: '', password: '' };

const CredentialsInput = () => {
  const password = useBoolean();
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const { joinNow, setFormData } = useAuthCodeContext();

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting, isValid },
  } = methods;

  const curPassword = watch('password');

  const onSubmit = handleSubmit(async (data) => {
    setFormData(data);
    joinNow();
  });

  const criteria = [
    {
      label: 'At least 8 characters',
      met: curPassword.length >= 8,
      touched: curPassword.length > 0,
    },
    {
      label: 'At least 1 number (0 - 9)',
      met: /[0-9]/.test(curPassword),
      touched: /[0-9]/.test(curPassword),
    },
    {
      label: 'At least 1 special character (! - $)',
      met: /[@$!%*?&#]/.test(curPassword),
      touched: /[@$!%*?&#]/.test(curPassword),
    },
    {
      label: 'At least 1 upper case and 1 lower case letter',
      met: /[A-Z]/.test(curPassword) && /[a-z]/.test(curPassword),
      touched: /[A-Z]/.test(curPassword) || /[a-z]/.test(curPassword),
    },
  ];

  const renderPasswordValidations = (
    <Stack sx={{ ml: 2 }}>
      {criteria.map((rule) => {
        let dotColor = '#919191';
        if (rule.met) dotColor = 'success.main';
        else if (rule.touched) dotColor = '#F4A931';

        return (
          <Stack key={rule.label} direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: dotColor,
                ml: 0.5,
                mr: 1,
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: '12px', fontWeight: 400, color: '#636366' }}
            >
              {rule.label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <StackMotion
        key="normal"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{
          type: 'spring',
          // bounce: 0.5,
          duration: 0.2,
        }}
        spacing={2.5}
        sx={{
          p: 3,
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          width: { xs: 350, md: 470 },
          overflow: 'hidden',
          mx: 'auto',
        }}
      >
        <Typography variant="body2" color="#636366" fontWeight={500} sx={labelSx}>
          Name{' '}
          <Box component="span" sx={{ color: 'error.main' }}>
            *
          </Box>
        </Typography>
        <Box>
          <RHFTextField
            name="name"
            placeholder="Name"
            InputLabelProps={{ shrink: false }}
            FormHelperTextProps={{ sx: { display: 'none' } }}
            sx={fieldSx}
          />
          <Typography variant="caption" sx={errorSx}>
            {methods.formState.errors.name?.message}
          </Typography>
        </Box>

        <Typography variant="body2" color="#636366" fontWeight={500} sx={labelSx}>
          Email{' '}
          <Box component="span" sx={{ color: 'error.main' }}>
            *
          </Box>
        </Typography>
        <Box>
          <RHFTextField
            name="email"
            placeholder="Email"
            InputLabelProps={{ shrink: false }}
            FormHelperTextProps={{ sx: { display: 'none' } }}
            sx={fieldSx}
          />
          <Typography variant="caption" sx={errorSx}>
            {methods.formState.errors.email?.message}
          </Typography>
        </Box>

        <Typography variant="body2" color="#636366" fontWeight={500} sx={labelSx}>
          Password{' '}
          <Box component="span" sx={{ color: 'error.main' }}>
            *
          </Box>
        </Typography>
        <Box>
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <RHFTextField
                name="password"
                placeholder="Password"
                InputLabelProps={{ shrink: false }}
                FormHelperTextProps={{ sx: { display: 'none' } }}
                sx={fieldSx}
                {...field}
                type={password.value ? 'text' : 'password'}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={(e) => {
                  field.onBlur(e);
                  if (!field.value) setIsPasswordFocused(false);
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ mr: 1 }}>
                      <IconButton onClick={password.onToggle} edge="end">
                        <Box
                          component="img"
                          src={`/assets/icons/components/${password.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'}`}
                          sx={{ width: 24, height: 24 }}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={!!error}
              />
            )}
          />
          <Typography variant="caption" sx={errorSx}>
            {methods.formState.errors.password?.message}
          </Typography>
          {isPasswordFocused && <Box sx={{ mt: 1, ml: 0.5 }}>{renderPasswordValidations}</Box>}
        </Box>

        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          loading={isSubmitting}
          sx={{
            background: isValid
              ? '#1340FF'
              : 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
            pointerEvents: !isValid && 'none',
            fontSize: '17px',
            fontWeight: 600,
            borderRadius: '12px',
            borderBottom: isValid ? '3px solid #0c2aa6' : '3px solid #91a2e5',
            transition: 'none',
          }}
        >
          Join Now
        </LoadingButton>
      </StackMotion>
    </FormProvider>
  );
};

export default CredentialsInput;
