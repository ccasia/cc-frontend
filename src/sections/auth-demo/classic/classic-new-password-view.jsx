import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect, useCallback } from 'react';

import { Box } from '@mui/material';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function ClassicNewPasswordView() {
  const params = useSearchParams();
  const token = params.get('token');
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const checkToken = useCallback(async () => {
    if (token) {
      try {
        const res = await axiosInstance.get(endpoints.auth.checkToken(token));
        enqueueSnackbar(res?.data?.message);
      } catch (error) {
        if (error?.message.includes('expired')) {
          enqueueSnackbar('Link Expired', {
            variant: 'error',
          });
        } else {
          enqueueSnackbar(error?.message, {
            variant: 'error',
          });
        }
        router.push(paths.auth.jwt.forgetPassword);
      }
    } else {
      router.push(paths.auth.jwt.login);
    }
  }, [token, router]);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  const password = useBoolean();

  const NewPasswordSchema = Yup.object().shape({
    password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[@$!%*?&#]/, 'Password must contain at least one special character'),
    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('password')], 'Passwords must match'),
  });

  const defaultValues = {
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(NewPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty, isValid },
    control,
    watch,
  } = methods;

  const curPassword = watch('password');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.users.changePassword, { ...data, token });
      enqueueSnackbar(res?.data?.message);
      setIsSuccess(true);
    } catch (error) {
      if (error?.message.includes('expired')) {
        enqueueSnackbar('Link Expired', {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(error?.message, {
          variant: 'error',
        });
      }
    }
  });

  const criteria = [
    { label: 'At least 8 characters', test: curPassword.length >= 8 },
    { label: 'Contains an uppercase letter', test: /[A-Z]/.test(curPassword) },
    { label: 'Contains a lowercase letter', test: /[a-z]/.test(curPassword) },
    { label: 'Contains a number', test: /[0-9]/.test(curPassword) },
    {
      label: 'Contains a special character (@, $, !, %, *, ?, &, #)',
      test: /[@$!%*?&#]/.test(curPassword),
    },
  ];

  const renderPasswordValidations = (
    <Stack>
      {criteria.map((rule, index) => (
        <Stack key={index} direction="row" alignItems="center" spacing={1}>
          <Iconify icon="ic:round-check" color={rule.test ? 'success.main' : 'gray'} />
          <Typography
            variant="caption"
            sx={{
              color: rule.test ? 'success.main' : 'text.secondary',
            }}
          >
            {rule.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );

  const renderForm = (
    <Stack spacing={3} alignItems="center">
      <Stack width={1}>
        <Typography variant="body2" color="#636366" fontWeight={500} sx={{ fontSize: '13px', mb: 0.5 }}>
          Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
        </Typography>
        <Controller
          name="password"
          control={methods.control}
          render={({ field }) => (
            <RHFTextField
              {...field}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: '#FFF',
                },
              }}
              placeholder="Password"
              type={password.value ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={password.onToggle}>
                      <Box 
                        component="img" 
                        src={`/assets/icons/components/${password.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'}`} 
                        sx={{ width: 24, height: 24 }} 
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          {renderPasswordValidations}
        </Stack>
      </Stack>

      <Stack width={1}>
        <Typography variant="body2" color="#636366" fontWeight={500} sx={{ fontSize: '13px', mb: 0.5 }}>
          Confirm Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
        </Typography>
        <RHFTextField
          name="confirmPassword"
          placeholder="Confirm New Password"
          type={password.value ? 'text' : 'password'}
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: '#FFF', 
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle}>
                  <Box 
                    component="img" 
                    src={`/assets/icons/components/${password.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'}`} 
                    sx={{ width: 24, height: 24 }} 
                  />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <LoadingButton
        fullWidth
        sx={{
          ...(isDirty &&
            isValid && {
              background: '#1340FF',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
            }),
          ...((!isDirty || !isValid) && {
            background:
              'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
          }),
          pointerEvents: (!isDirty || !isValid) && 'none',
          fontSize: '17px',
          borderRadius: '12px',
          borderBottom: isDirty && isValid ? '3px solid #0c2aa6' : '3px solid #91a2e5',
          transition: 'none',
        }}
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Change Password
      </LoadingButton>
    </Stack>
  );

  const renderSuccess = (
    <Stack spacing={3} alignItems="flex-start">
      <Typography
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontWeight: 500,
          fontSize: '40px',
        }}
      >
        Reset password success ✅
      </Typography>

      <Typography variant="body2" sx={{ color: '#636366', fontSize: '16px', mt: -2 }}>
        Your password has been successfully updated!
        <br />
        You can now proceed to login.
      </Typography>

      <LoadingButton
        fullWidth
        onClick={() => router.push(paths.auth.jwt.login)}
        sx={{
          background: '#1340FF',
          boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
          fontSize: '17px',
          borderRadius: '12px',
          borderBottom: '2px solid #0c2aa6',
          transition: 'none',
        }}
        size="large"
        variant="contained"
      >
        Continue to Login
      </LoadingButton>
    </Stack>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Box
          sx={{
            p: 4,
            bgcolor: '#F4F4F4',
            borderRadius: 2,
            width: { xs: 320, sm: 470 },
            height: isSuccess ? 'auto' : 'auto',
            minHeight: isSuccess ? 'auto' : '520px',
            maxWidth: '470px',
          }}
        >
          {!isSuccess ? (
            <>
              <Stack spacing={1} sx={{ mb: 2, mt: -1 }}>
                <Typography
                  sx={{
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    fontWeight: 500,
                    fontSize: '40px',
                  }}
                >
                  Set a new password 🔓
                </Typography>
                <Typography variant="body2" sx={{ color: '#636366', fontSize: '16px', mt: -1}}>
                  Choose a new password for your account.
                </Typography>
              </Stack>

              <Box sx={{ mt: 3 }}>
                {renderForm}
              </Box>
            </>
          ) : (
            renderSuccess
          )}
        </Box>
      </FormProvider>
    </Box>
  );
}
