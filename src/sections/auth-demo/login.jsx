import React from 'react';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import { LoadingButton } from '@mui/lab';
import { Box, Stack, Typography, IconButton, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

// import error from '../../../public/sounds/error.mp3';

const Login = () => {
  const password = useBoolean();
  // const [play] = useSound(error, {
  //   interrupt: true,
  // });

  const { login } = useAuthContext();
  const router = useRouter();

  const LoginSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string().required('Password is required'),
  });

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await login(data.email, data.password, { admin: false });
      if (res?.user?.role === 'creator') {
        router.push(paths.dashboard.overview.root);
      }
      enqueueSnackbar('Successfully login');
    } catch (err) {
      // play();
      enqueueSnackbar(err.message, {
        variant: 'error',
      });
    }
  });

  const renderForm = (
    <Stack spacing={2.5}>
      <RHFTextField name="email" label="Email address" />

      <RHFTextField
        name="password"
        label="Password"
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

      <Link
        component={RouterLink}
        href={paths.auth.jwt.forgetPassword}
        variant="body2"
        color="text.secondary"
        underline="always"
        sx={{ alignSelf: 'flex-start' }}
      >
        Forgot your password?
      </Link>

      <LoadingButton
        fullWidth
        sx={{
          background: isDirty
            ? '#1340FF'
            : 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
          pointerEvents: !isDirty && 'none',
        }}
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        // disabled={!isDirty}
      >
        Login
      </LoadingButton>
    </Stack>
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
        <Typography
          variant="h3"
          // fontWeight="bold"
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontWeight: 400,
          }}
        >
          Login 👾
        </Typography>

        <Stack direction="row" spacing={0.5} my={2}>
          <Typography variant="body2">New user?</Typography>

          <Link
            component={RouterLink}
            href={paths.auth.jwt.register}
            variant="body2"
            color="#1340FF"
            fontWeight={600}
          >
            Create an account
          </Link>
        </Stack>

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
};

export default Login;
