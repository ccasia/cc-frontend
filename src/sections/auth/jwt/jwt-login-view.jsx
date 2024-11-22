import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box } from '@mui/material';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function JwtLoginView() {
  const { login } = useAuthContext();

  const router = useRouter();

  const searchParams = useSearchParams();

  const [token, setToken] = useState();
  const [isTokenValid, setIsTokenValid] = useState();
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get('returnTo');

  const password = useBoolean();

  const LoginSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string().required('Password is required'),
  });

  // Remove for production
  // const defaultValues = {
  //   email: 'super@cultcreativeasia.com',
  //   password: 'super123_',
  // };

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login?.(data.email, data.password, { admin: true });
      enqueueSnackbar('Welcome!');
      router.push(returnTo || PATH_AFTER_LOGIN);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
      reset();
      // setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

  // This effect is to check for expiration token
  useEffect(() => {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const searchParam = new URLSearchParams(url.search);
    const tokenParam = searchParam.get('token');
    setToken(tokenParam);

    const checkTokenValidity = async () => {
      try {
        await axiosInstance.get(`${endpoints.auth.checkTokenValidity}/${tokenParam}`);
        setIsTokenValid(true);
      } catch (error) {
        setIsTokenValid(false);
      }
    };

    if (tokenParam) {
      checkTokenValidity();
    }
  }, []);

  const sendNewToken = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(endpoints.auth.resendToken, { token });
      enqueueSnackbar(res.data.message);
      router.push(paths.auth.jwt.adminLogin);
    } catch (error) {
      enqueueSnackbar(error, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // const renderForm = (
  //   <Stack spacing={2.5}>
  //     <RHFTextField name="email" label="Email address" placeholder="hello@cultcreative.asia" />

  //     <RHFTextField
  //       name="password"
  //       label="Password"
  //       type={password.value ? 'text' : 'password'}
  //       InputProps={{
  //         endAdornment: (
  //           <InputAdornment position="end">
  //             <IconButton onClick={password.onToggle} edge="end">
  //               <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
  //             </IconButton>
  //           </InputAdornment>
  //         ),
  //       }}
  //     />

  //     <Link variant="body2" color="inherit" underline="always" sx={{ alignSelf: 'flex-end' }}>
  //       Forgot password?
  //     </Link>

  //     <LoadingButton
  //       fullWidth
  //       color="inherit"
  //       size="large"
  //       type="submit"
  //       variant="contained"
  //       loading={isSubmitting}
  //     >
  //       Login
  //     </LoadingButton>

  //     {isTokenValid && (
  //       <LoadingButton
  //         fullWidth
  //         color="error"
  //         size="medium"
  //         variant="outlined"
  //         onClick={sendNewToken}
  //         loading={loading}
  //       >
  //         Resend Token
  //       </LoadingButton>
  //     )}
  //   </Stack>
  // );

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
      >
        Login
      </LoadingButton>

      {isTokenValid && (
        <LoadingButton
          fullWidth
          color="error"
          size="medium"
          variant="outlined"
          onClick={sendNewToken}
          loading={loading}
        >
          Resend Token
        </LoadingButton>
      )}
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
          fontWeight="bold"
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          }}
        >
          Login 👾
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
}
