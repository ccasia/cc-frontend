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
        <Typography variant="body2" color="#636366" fontWeight={500} sx={{ fontSize: '13px', mb: -2, textAlign: 'left', mt: 1 }}>
          Email <Box component="span" sx={{ color: 'error.main' }}>*</Box>
        </Typography>
        <RHFTextField name="email" placeholder="Email" sx={{ bgcolor: '#FFF', borderRadius: 1, mt: 3 }} />
      </Stack>

      <LoadingButton
        fullWidth
        sx={{
          background: isDirty
            ? '#1340FF'
            : 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
          pointerEvents: !isDirty && 'none',
          fontSize: '17px',
          borderRadius: '12px',
          borderBottom: isDirty ? '3px solid #0c2aa6' : '3px solid #91a2e5',
          transition: 'none',
          mt: -0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '48px',
          lineHeight: 1,
          py: 0,
          '& .MuiButton-startIcon, & .MuiButton-endIcon': {
            margin: 0,
          },
        }}
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Submit
      </LoadingButton>

      <Box sx={{ width: '100%', height: '1px', bgcolor: '#E5E5EA', my: -1 }} />

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" width="100%" mb={1}>
        <Typography variant="body2" color="#636366" sx={{ fontSize: '16px' }}>
          Remember your password?
        </Typography>
        
        <Button
          component={RouterLink}
          href={paths.auth.jwt.login}
          sx={{
            background: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '14px',
            border: '1px solid #E7E7E7',
            borderBottom: '3px solid #E7E7E7',
            transition: 'none',
            color: '#231F20',
            width: '77px',
            height: '44px',
            minWidth: '77px',
            padding: 0,
            '&:hover': {
              background: '#F2F2F2',
            },
          }}
          size="medium"
        >
          Login
        </Button>
      </Stack>
    </Stack>
  );

  const renderHead = (
    <Stack spacing={1} sx={{ mb: 2, mt: -1 }}>
      <Typography
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontWeight: 500,
          fontSize: '40px',
        }}
      >
        Forgot your password? 🥲
      </Typography>

      <Typography variant="body2" sx={{ color: '#636366', fontSize: '16px' }}>
        Enter your email below and we&apos;ll send you a link to reset your password.
      </Typography>
    </Stack>
  );

  const renderResetLinkSent = (
    <Box
      sx={{
        p: 4,
        bgcolor: '#F4F4F4',
        borderRadius: 2,
        width: { xs: 320, sm: 470 },
        minHeight: { xs: '200px', sm: '236px' },
      }}
    >
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography
          fontSize="40px"
          fontWeight="500"
          fontFamily={(theme) => theme.typography.fontSecondaryFamily}
        >
          Reset link sent 🛫
        </Typography>
        <Typography
          variant="body2"
          fontSize="16px"
          color="#636366"
          lineHeight={1.2}
        >
          Please check your inbox to reset your password. If you didn&apos;t receive your email, please check your junk mail.
        </Typography>
      </Stack>

      <Button
        fullWidth
        sx={{
          background: '#1340FF',
          fontSize: '17px',
          borderRadius: '12px',
          borderBottom: '3px solid #0c2aa6',
          transition: 'none',
          mt: -0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '48px',
          lineHeight: 1,
          py: 0,
          color: '#FFFFFF',
          '&:hover': {
            background: '#484c5c',
          },
          '& .MuiButton-startIcon, & .MuiButton-endIcon': {
            margin: 0,
          },
        }}
        size="large"
        onClick={() => router.push(paths.auth.jwt.login)}
      >
        Continue to Login
      </Button>
    </Box>
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
      {!successfull.value ? (
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Box
            sx={{
              p: 4,
              bgcolor: '#F4F4F4',
              borderRadius: 2,
              width: { xs: 320, sm: 470 },
            }}
          >
            {renderHead}
            {renderForm}
          </Box>
        </FormProvider>
      ) : (
        renderResetLinkSent
      )}
    </Box>
  );
};

export default ForgetPassword;
