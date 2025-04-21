/* eslint-disable react/prop-types */
import React from 'react';
import { Navigate } from 'react-router';
import { Box, Button, Typography, Stack } from '@mui/material';
import { paths } from 'src/routes/paths';
import { useCreator } from 'src/hooks/zustands/useCreator';
import { useRouter } from 'src/routes/hooks';
import { enqueueSnackbar } from 'notistack';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { useBoolean } from 'src/hooks/use-boolean';

const Verify = () => {
  const { email } = useCreator();
  const router = useRouter();
  const loading = useBoolean();

  const handleBackToLogin = () => {
    router.push(paths.auth.jwt.login);
  };

  return (
    <>
      {email ? (
        <Box
          sx={{
            position: 'relative',
            height: '100vh',
            width: 1,
            overflow: 'auto',
            '&::before': {
              content: '""',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
                url('/background/signup.jpeg') no-repeat fixed center
              `,
              backgroundSize: 'cover',
              zIndex: -1,
            },
          }}
        >
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `url('/background/grain.png') repeat`,
              backgroundSize: 'cover',
              zIndex: 0,
            }}
          />
          <Stack
            sx={{
              width: 1,
              mx: 'auto',
              maxWidth: 480,
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pt: { xs: 12, md: 16 },
              position: 'relative',
            }}
          >
            <Box
              component="img"
              src="/logo/newlogo.svg"
              sx={{
                width: 50,
                height: 50,
                position: 'absolute',
                top: { xs: 16, md: 32 },
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />

            <Box
              sx={{
                p: 3,
                bgcolor: '#F4F4F4',
                borderRadius: 2,
                width: { xs: '100%', sm: 394 },
                maxWidth: { xs: '100%', sm: 394 },
                mx: 'auto',
                textAlign: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                sx={{
                  fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                  fontWeight: 400,
                  fontSize: '40px',
                  mb: 1,
                  textAlign: 'left',
                }}
              >
                Verify your email 👀
              </Typography>

              <Typography variant="body2" color="#636366" sx={{ fontSize: '16px', mb: 3, textAlign: 'left' }}>
                We sent a verification link to <b>{email}</b>. Please click on the link to activate your account.
              </Typography>

              <Button
                fullWidth
                sx={{
                  background: '#1340FF',
                  fontSize: '17px',
                  borderRadius: '12px',
                  borderBottom: '3px solid #0c2aa6',
                  mb: 2,
                }}
                size="large"
                variant="contained"
                onClick={handleBackToLogin}
              >
                Back to Login
              </Button>

              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'left',
                  gap: '8px',
                  color: '#231F20',
                  fontSize: '14px',
                }}
              >
                Didn&apos;t receive the link?
                
                <Button
                  variant="text"
                  disabled={loading.value}
                  sx={{
                    fontSize: '14px',
                    p: 0,
                    alignItems: 'center',
                    color: '#1340FF',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                   
                  }}
                >
                  {loading.value ? 'Sending...' : 'Send link again'}
                </Button>
              </Typography>
            </Box>
          </Stack>
        </Box>
      ) : (
        <Navigate to={paths.auth.jwt.login} />
      )}
    </>
  );
};

export default Verify;