import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

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
    // code: Yup.string().min(6, 'Code must be at least 6 characters').required('Code is required'),
    // email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('password')], 'Passwords must match'),
  });

  const defaultValues = {
    // code: '',
    // email: '',
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
    formState: { isSubmitting },
  } = methods;

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

  const renderForm = (
    <Stack spacing={3} alignItems="center">
      {/* <RHFTextField
        name="email"
        label="Email"
        placeholder="example@gmail.com"
        InputLabelProps={{ shrink: true }}
      /> */}

      {/* <RHFCode name="code" /> */}

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

      <RHFTextField
        name="confirmPassword"
        label="Confirm New Password"
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

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Update Password
      </LoadingButton>

      {/* <Typography variant="body2">
        {`Don’t have a code? `}
        <Link
          variant="subtitle2"
          sx={{
            cursor: 'pointer',
          }}
        >
          Resend code
        </Link>
      </Typography> */}

      <Link
        component={RouterLink}
        href={paths.auth.jwt.login}
        color="inherit"
        variant="subtitle2"
        sx={{
          alignItems: 'center',
          display: 'inline-flex',
        }}
      >
        <Iconify icon="eva:arrow-ios-back-fill" width={16} />
        Return to sign in
      </Link>
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

  // const renderExpired = (
  //   <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
  //     <Image src="/assets/expired.png" width={200} />
  //     <Box>
  //       {/* <Typography variant="h5" color="warning.main">
  //         Link Expired
  //       </Typography> */}
  //       <Button
  //         fullWidth
  //         variant="outlined"
  //         sx={{
  //           mt: 2,
  //         }}
  //       >
  //         Resend Link
  //       </Button>
  //     </Box>
  //   </Box>
  // );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      {renderHead}

      {renderForm}
    </FormProvider>
  );
}
