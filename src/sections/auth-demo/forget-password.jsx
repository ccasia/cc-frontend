import React from 'react';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import { LoadingButton } from '@mui/lab';
import { Box, Stack, Button, FormLabel, Typography, ListItemText } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const ForgetPassword = () => {
  const router = useRouter();
  const successfull = useBoolean();

  const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
  });

  const defaultValues = {
    email: '',
  };

  const methods = useForm({
    resolver: yupResolver(ForgotPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.auth.forgetPassword, data);
      enqueueSnackbar(res?.data?.message);
      successfull.onTrue();
    } catch (error) {
      enqueueSnackbar(error, {
        variant: 'error',
      });
      successfull.onFalse();
    }
  });

  const renderForm = (
    <Stack spacing={3} alignItems="center">
      <Stack width={1}>
        <FormLabel
          required
          sx={{
            fontWeight: 600,
          }}
        >
          Email
        </FormLabel>
        <RHFTextField name="email" placeholder="Email" sx={{ bgcolor: '#FFF', borderRadius: 1 }} />
      </Stack>

      <LoadingButton
        fullWidth
        sx={{
          ...(isDirty && {
            background: '#1340FF',
            boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
          }),
          ...(!isDirty && {
            background:
              'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
          }),
          pointerEvents: !isDirty && 'none',
        }}
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Submit
      </LoadingButton>

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
    <Stack spacing={1} sx={{ mb: 2 }}>
      <Typography
        variant="h3"
        fontWeight="bold"
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
        }}
      >
        Forget your password ? 😢
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Enter your email below and we’ll send you a link to reset your password.
      </Typography>
    </Stack>
  );

  const renderResetLinkSent = (
    <Box
      sx={{
        p: 2,
        bgcolor: '#F4F4F4',
        borderRadius: 2,
      }}
    >
      <ListItemText
        primary="Reset link sent 🛫"
        secondary="Please check your inbox to reset your password. If you didn’t receive your email, please check your junk mail."
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

      <Button
        fullWidth
        sx={{
          background: '#1340FF',
          boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
          color: 'white',
          '&:hover': {
            background: '#1340FF',
          },
        }}
        size="large"
        onClick={() => router.push(paths.auth.jwt.login)}
      >
        Continue to login
      </Button>
    </Box>
  );

  return !successfull.value ? (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          p: 3,
          bgcolor: '#F4F4F4',
          borderRadius: 2,
        }}
      >
        {renderHead}

        {renderForm}
      </Box>
    </FormProvider>
  ) : (
    renderResetLinkSent
  );
};

export default ForgetPassword;
