import { useParams } from 'react-router';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Card, Stack, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

const VerifyConfirmation = () => {
  const { token } = useParams();

  const { verify, verifyClient } = useAuthContext();
  const loading = useBoolean();
  const success = useBoolean();
  const router = useRouter();
  const tokenExpired = useBoolean();
  
  // Get user type from sessionStorage
  const userType = sessionStorage.getItem('userType') || 'creator';

  // const path = paths.dashboard.overview;

  const checkTokenVerification = useCallback(async () => {
    try {
      // Use the appropriate verify function based on user type
      if (userType === 'client') {
        await verifyClient(token);
      } else {
        await verify(token);
      }
      
      // Clear verification data after successful verification
      sessionStorage.removeItem('verificationEmail');
      sessionStorage.removeItem('userType');
      
      router.push(paths.dashboard.overview.root);
    } catch (error) {
      tokenExpired.onTrue();
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  }, [token, verify, verifyClient, router, tokenExpired, userType]);

  useEffect(() => {
    checkTokenVerification();
  }, [checkTokenVerification]);

  const onSubmit = async () => {
    try {
      loading.onTrue();
      
      // Use the appropriate resend endpoint based on user type
      const endpoint = userType === 'client' 
        ? endpoints.auth.resendVerificationLinkClient 
        : endpoints.auth.resendVerificationLink;
      
      const res = await axiosInstance.post(endpoint, { token });
      enqueueSnackbar(res?.data?.message);
      success.onTrue();
      setTimeout(() => {
        router.push(paths.auth.jwt.login);
      }, 4000);
    } catch (error) {
      success.onFalse();
      enqueueSnackbar(error?.message);
    } finally {
      loading.onFalse();
    }
  };

  const renderContent = (
    <Stack
      sx={{
        width: 1,
        mx: 'auto',
        maxWidth: 480,
        px: { xs: 2, md: 6 },
      }}
    >
      <Box
        component="img"
        src="/logo/newlogo.svg"
        sx={{
          width: 50,
          height: 50,
          mt: { xs: 2, md: 8 },
          mb: { xs: 10, md: 8 },
          mx: 'auto',
        }}
      />
      <Card
        sx={{
          boxShadow: { md: 'none' },
          overflow: { md: 'unset' },
          bgcolor: { md: 'background.default' },
          mt: 5,
        }}
      />
    </Stack>
  );

  return (
    <Box
      sx={{
        background: `url(/background/register.jpg) no-repeat fixed center`,
        backgroundSize: 'cover',
        height: '100vh',
      }}
    >
      {renderContent}
      {tokenExpired.value && (
        <Box
          sx={{
            px: 3,
          }}
        >
          <Card
            sx={{
              p: 4,
              bgcolor: '#F4F4F4',
              maxWidth: 470,
              width: 1,
              mx: 'auto',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontWeight: 200,
              }}
            >
              Verification link expired 🙁
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                lineHeight: '-1px',
                color: 'text.secondary',
              }}
            >
              Your email verification link has expired. For security purposes, verification links
              are only valid for a limited time. Please request a new verification link to complete
              your email verification.
            </Typography>

            <LoadingButton
              variant="outlined"
              sx={{
                mt: 3,
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                bgcolor: '#1340FF',
                color: 'whitesmoke',
                py: 1.2,
                '&:hover': {
                  bgcolor: '#1340FF',
                },
                pointerEvents: success.value && 'none',
              }}
              fullWidth
              loading={loading.value}
              onClick={onSubmit}
            >
              {success.value ? 'Verification link send' : 'Resend new verification link'}
            </LoadingButton>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default VerifyConfirmation;
