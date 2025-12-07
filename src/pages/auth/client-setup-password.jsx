import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import LoadingButton from '@mui/lab/LoadingButton';
import { 
  Box, 
  Link,
  Alert,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import FormProvider, { RHFTextField } from 'src/components/hook-form';


export default function ClientSetupPassword() {
  const password = useBoolean();
  const confirmPassword = useBoolean();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token');

  const verifyToken = useCallback(async () => {
    try {
      const response = await fetch(`/api/auth/verify-client-invite?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setEmail(data.user.email);
        setName(data.user.name);
        setTokenValid(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid or expired invitation link');
      }
    } catch (err) {
      setError('Error verifying invitation');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError('No invitation token provided');
    }
  }, [token, verifyToken]);

  const PasswordSchema = Yup.object().shape({
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/[0-9]/, 'At least 1 number (0 - 9)')
      .matches(/[!@#$%^&*(),.?":{}|<>]/, 'At least 1 special character (! - $)')
      .matches(/[A-Z]/, 'At least 1 upper case letter')
      .matches(/[a-z]/, 'At least 1 lower case letter')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const defaultValues = {
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    resolver: yupResolver(PasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValid },
    watch,
  } = methods;

  const curPassword = watch('password') || '';

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await fetch('/api/auth/setup-client-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword
        }),
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error setting up password');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  });

  const renderHead = (
    <Stack direction="row" spacing={0.5} my={1.5}>
      <Typography variant="body2">Create your password to access your client account!</Typography>
    </Stack>
  );

  const criteria = [
    { label: 'At least 8 characters', test: curPassword.length >= 8 },
    { label: 'At least 1 number (0 - 9)', test: /[0-9]/.test(curPassword) },
    { label: 'At least 1 special character (! - $)', test: /[@$!%*?&#]/.test(curPassword) },
    {
      label: 'At least 1 upper case and 1 lower case letter',
      test: /[A-Z]/.test(curPassword) && /[a-z]/.test(curPassword),
    },
  ];

  const renderPasswordRequirements = (
    <Box sx={{ mt: 1, ml: 0.5 }}>
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
    </Box>
  );

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 2.5,
        textAlign: 'center',
        typography: 'caption',
        color: 'text.secondary',
      }}
    >
      {'By signing up, I agree to the '}
      <Link underline="always" color="text.primary">
        Terms of Service
      </Link>
      {' and '}
      <Link underline="always" color="text.primary">
        Privacy Policy
      </Link>
      .
    </Typography>
  );

  const renderForm = (
    <Stack spacing={2.5}>
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
          type={password.value ? 'text' : 'password'}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={(e) => {
            if (!curPassword) {
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
          {methods.formState.errors.password?.message}
        </Typography>

        {isPasswordFocused && renderPasswordRequirements}
      </Box>

      <Typography
        variant="body2"
        color="#636366"
        fontWeight={500}
        sx={{ fontSize: '13px', mb: -2, textAlign: 'left' }}
      >
        Confirm Password{' '}
        <Box component="span" sx={{ color: 'error.main' }}>
          *
        </Box>
      </Typography>
      <Box>
        <RHFTextField
          name="confirmPassword"
          placeholder="Confirm Password"
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
          type={confirmPassword.value ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ mr: 1 }}>
                <IconButton onClick={confirmPassword.onToggle} edge="end">
                  <Box
                    component="img"
                    src={`/assets/icons/components/${
                      confirmPassword.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'
                    }`}
                    sx={{ width: 24, height: 24 }}
                  />
                </IconButton>
              </InputAdornment>
            ),
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
          {methods.formState.errors.confirmPassword?.message}
        </Typography>
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
        Create Account
      </LoadingButton>
    </Stack>
  );

  if (!tokenValid && !error) {
    return null; // Let the background show while verifying
  }

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box sx={{
        p: 3,
        bgcolor: '#F4F4F4',
        borderRadius: 2,
        width: { xs: '100%', sm: 470 },
        maxWidth: { xs: '100%', sm: 470 },
        mx: 'auto',
      }}>
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {tokenValid && (
          <>
            {renderForm}
            {renderTerms}
          </>
        )}
      </Box>
    </FormProvider>
  );
}