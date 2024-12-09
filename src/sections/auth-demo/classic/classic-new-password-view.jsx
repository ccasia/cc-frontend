import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Box, FormLabel, ListItemText } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { SentIcon } from 'src/assets/icons';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function ClassicNewPasswordView() {
  const params = useSearchParams();
  const token = params.get('token');
  const router = useRouter();
  // const [isExpired, setIsExpired] = useState(false);

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
    console.log(data);
    try {
      const res = await axiosInstance.patch(endpoints.users.changePassword, { ...data, token });
      enqueueSnackbar(res?.data?.message);
      router.push(paths.auth.jwt.login);
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
        <FormLabel required>Password</FormLabel>
        <Controller
          name="password"
          control={methods.control}
          render={({ field }) => (
            <RHFTextField
              {...field}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: '#FFF', // Replace with your desired color
                },
              }}
              placeholder="Password"
              type={password.value ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={password.onToggle} edge="end">
                      <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
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
        <FormLabel required>Confirm Password</FormLabel>
        <RHFTextField
          name="confirmPassword"
          placeholder="Confirm New Password"
          type={password.value ? 'text' : 'password'}
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: '#FFF', // Replace with your desired color
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
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
        }}
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Submit
      </LoadingButton>
    </Stack>
  );

  const renderHead = (
    <>
      <SentIcon sx={{ height: 96 }} />

      <Stack spacing={1} sx={{ mt: 3, mb: 5 }}>
        <Typography variant="h3">Request sent successfully!</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          We&apos;ve sent a 6-digit confirmation email to your email.
          <br />
          Please enter the code in below box to verify your email.
        </Typography>
      </Stack>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          p: 3,
          bgcolor: '#F4F4F4',
          borderRadius: 2,
        }}
      >
        <ListItemText
          primary=" Set a new password 🔓"
          secondary="Choose a new password for your account."
          primaryTypographyProps={{
            variant: 'h3',
            fontWeight: 'bold',
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          }}
          secondaryTypographyProps={{
            variant: 'body2',
            fontSize: 13,
            color: 'text.secondary',
            lineHeight: 1.2,
          }}
          sx={{
            mb: 3,
          }}
        />

        <Box
          sx={{
            mt: 3,
          }}
        >
          {renderForm}
        </Box>
      </Box>
    </FormProvider>
  );
}
