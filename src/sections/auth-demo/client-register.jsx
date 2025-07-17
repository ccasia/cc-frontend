import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';



const ClientRegister = () => {
  const password = useBoolean();
  const { registerClient } = useAuthContext();
  const router = useRouter();

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleOpenTerms = () => {
    const a = document.createElement('a');
    a.href = `https://cultcreativeasia.com/my/terms-and-conditions`;
    a.target = '_blank';
    a.click();
  };

  const handleOpenPrivacy = () => {
    const a = document.createElement('a');
    a.href = `https://cultcreativeasia.com/my/privacy-policy`;
    a.target = '_blank';
    a.click();
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

  const defaultValues = {
    name: '',
    email: '',
    password: '',
  };

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValid },
    watch,
  } = methods;

  useEffect(() => {
    watch();
  }, [watch]);

  const curPassword = watch('password');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const result = await registerClient({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Store the email for the verification page
      sessionStorage.setItem('verificationEmail', result.email);
      sessionStorage.setItem('userType', 'client');

      enqueueSnackbar('Registration successful! Please check your email to verify your account.', { 
        variant: 'success' 
      });

      router.push(paths.auth.verify);
    } catch (err) {
      console.error('Registration error:', err.message);

      if (err.message === 'Email already exists') {
        methods.setError('email', {
          type: 'manual',
          message: 'Email already registered. Please try again.',
        });
      } else if (err.message === 'Invalid name format') {
        methods.setError('name', {
          type: 'manual',
          message: 'Invalid name format. Please try again.',
        });
      } else if (err.message === 'Password requirements not met') {
        methods.setError('password', {
          type: 'manual',
          message: 'Password does not meet requirements. Please try again.',
        });
      } else {
        methods.setError('password', {
          type: 'manual',
          message: 'An error occurred. Please try again.',
        });
      }
    }
  });

  const criteria = [
    { label: 'At least 8 characters', test: curPassword.length >= 8 },
    { label: 'At least 1 number (0 - 9)', test: /[0-9]/.test(curPassword) },
    { label: 'At least 1 special character (! - $)', test: /[@$!%*?&#]/.test(curPassword) },
    {
      label: 'At least 1 upper case and 1 lower case letter',
      test: /[A-Z]/.test(curPassword) && /[a-z]/.test(curPassword),
    },
  ];

  const renderPasswordValidations = (
    <Stack sx={{ ml: 2 }}>
      {criteria.map((rule, index) => {
        const hasValue = {
          'At least 8 characters': curPassword.length > 0,
          'At least 1 number (0 - 9)': /[0-9]/.test(curPassword),
          'At least 1 special character (! - $)': /[@$!%*?&#]/.test(curPassword),
          'At least 1 upper case and 1 lower case letter':
            /[A-Z]/.test(curPassword) || /[a-z]/.test(curPassword),
        };

        const textColor = '#636366';
        let dotColor = '#919191';

        if (rule.test) {
          dotColor = 'success.main';
        } else if (hasValue[rule.label]) {
          dotColor = '#F4A931';
        }

        return (
          <Stack key={index} direction="row" alignItems="center" spacing={0.5}>
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
              sx={{
                fontSize: '12px',
                fontWeight: 400,
                color: textColor,
              }}
            >
              {rule.label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );

  const renderHead = (
    <Stack direction="row" spacing={0.5} my={1.5}>
      <Typography variant="body2">Already have an account?</Typography>
      <Link
        href={paths.auth.jwt.login}
        component={RouterLink}
        variant="subtitle2"
        color="rgba(19, 64, 255, 1)"
      >
        Login
      </Link>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      <Typography
        variant="body2"
        color="#636366"
        fontWeight={500}
        sx={{ fontSize: '13px', mb: -2, textAlign: 'left' }}
      >
        Company Name{' '}
        <Box component="span" sx={{ color: 'error.main' }}>
          *
        </Box>
      </Typography>
      <Box>
        <RHFTextField
          name="name"
          placeholder="Company Name"
          InputLabelProps={{ shrink: false }}
          FormHelperTextProps={{ sx: { display: 'none' } }}
          sx={{
            '&.MuiTextField-root': {
              bgcolor: 'white',
              borderRadius: 1,
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#B0B0B0',
                fontSize: '16px',
                opacity: 1,
              },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: '#F04438',
            mt: 0.5,
            ml: 0.5,
            display: 'block',
            fontSize: '12px',
            textAlign: 'left',
          }}
        >
          {methods.formState.errors.name?.message}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        color="#636366"
        fontWeight={500}
        sx={{ fontSize: '13px', mb: -2, textAlign: 'left' }}
      >
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
          sx={{
            '&.MuiTextField-root': {
              bgcolor: 'white',
              borderRadius: 1,
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#B0B0B0',
                fontSize: '16px',
                opacity: 1,
              },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: '#F04438',
            mt: 0.5,
            ml: 0.5,
            display: 'block',
            fontSize: '12px',
            textAlign: 'left',
          }}
        >
          {methods.formState.errors.email?.message}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        color="#636366"
        fontWeight={500}
        sx={{ fontSize: '13px', mb: -2, textAlign: 'left' }}
      >
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
              sx={{
                '&.MuiTextField-root': {
                  bgcolor: 'white',
                  borderRadius: 1,
                  '& .MuiInputLabel-root': {
                    display: 'none',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#B0B0B0',
                    fontSize: '16px',
                    opacity: 1,
                  },
                },
              }}
              {...field}
              type={password.value ? 'text' : 'password'}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={(e) => {
                field.onBlur(e);
                if (!field.value) {
                  setIsPasswordFocused(false);
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <IconButton onClick={password.onToggle} edge="end">
                      <Box
                        component="img"
                        src={`/assets/icons/components/${
                          password.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'
                        }`}
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

        <Typography
          variant="caption"
          sx={{
            color: '#F04438',
            mt: 0.5,
            ml: 0.5,
            display: 'block',
            textAlign: 'left',
          }}
        >
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
      
      {/* Social Logins */}
      {/* <Divider textAlign="center" sx={{ color: 'text.secondary', fontSize: 14 }}>
        More login options
      </Divider> */}

      {/* <Stack direction="row" justifyContent="center" spacing={2}>
        {socialLogins.map((item) => (
          <LoadingButton
            key={item.platform}
            fullWidth
            size="large"
            variant="outlined"
            loading={isSubmitting}
            sx={{
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
              bgcolor: '#1340FF',
              color: 'whitesmoke',
              width: 80,
              py: 1,
              '&:hover': {
                bgcolor: '#1340FF',
              },
            }}
            disabled={item.platform === 'facebook'}
          >
            <Iconify icon={item.icon} width={25} />
          </LoadingButton>
        ))}
      </Stack> */}
    </Stack>
  );

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 2.5,
        textAlign: 'center',
        typography: 'caption',
        color: '#8E8E93',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
      }}
    >
      By signing up, I agree to
      <Link
        component="button"
        underline="always"
        color="text.primary"
        onClick={handleOpenTerms}
        type="button"
        sx={{
          verticalAlign: 'baseline',
          fontSize: '13px',
          lineHeight: 1,
          p: 0,
          color: '#231F20',
        }}
      >
        Terms of Service
      </Link>
      and
      <Link
        component="button"
        underline="always"
        color="text.primary"
        onClick={handleOpenPrivacy}
        type="button"
        sx={{
          verticalAlign: 'baseline',
          fontSize: '13px',
          lineHeight: 1,
          p: 0,
          color: '#231F20',
        }}
      >
        Privacy Policy.
      </Link>
    </Typography>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          p: 3,
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          width: { xs: '100%', sm: 470 },
          maxWidth: { xs: '100%', sm: 470 },
          mx: 'auto',
        }}
      >
        <Typography
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: '40px',
            fontWeight: 400,
            mb: -0.5,
          }}
        >
          Join The Cult 👽
        </Typography>

        {renderHead}

        <Box
          sx={{
            mt: 3,
            textAlign: 'center',
          }}
        >
          {renderForm}
          {renderTerms}
        </Box>
      </Box>
    </FormProvider>
  );
};

export default ClientRegister;