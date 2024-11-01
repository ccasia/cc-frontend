import React from 'react';
import * as Yup from 'yup';
import useSound from 'use-sound';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import { LoadingButton } from '@mui/lab';
import { Box, Stack, Avatar, Typography, IconButton, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import Image from 'src/components/image/image';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

import error from '../../../public/sounds/error.mp3';

const Login = () => {
  const password = useBoolean();
  const [play] = useSound(error, {
    interrupt: true,
  });

  const { login } = useAuthContext();
  //   const [error, setError] = useState();
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
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await login(data.email, data.password, { admin: false });
      if (res?.user?.role === 'creator') {
        router.push(paths.dashboard.campaign.view);
      }
      enqueueSnackbar('Successfully login');
    } catch (err) {
      play();
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
          background: 'linear-gradient(180deg, #138EFF 0%, #1340FF 100%)',
        }}
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Login
      </LoadingButton>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2">New user?</Typography>

        <Link
          component={RouterLink}
          href={paths.auth.jwt.register}
          variant="body2"
          color="rgba(19, 64, 255, 1)"
        >
          Create an account
        </Link>
      </Stack>
    </Stack>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          p: 3,
        }}
      >
        <Box
          component="div"
          sx={{
            position: 'relative',
            mb: 3,
            width: 55,
            height: 55,
            borderRadius: 10,
          }}
        >
          <Image
            src="/assets/icons/auth/Vector.svg"
            alt="Background Image"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'inherit',
            }}
          />
          <Avatar
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 40,
              height: 40,
            }}
            src="/assets/icons/auth/test.svg"
          />
        </Box>

        <Typography variant="h3" fontWeight="bold">
          Welcome Back 👾
        </Typography>
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
