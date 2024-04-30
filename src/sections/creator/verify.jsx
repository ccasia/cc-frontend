/* eslint-disable react/prop-types */
import React from 'react';
import { Navigate } from 'react-router';

import { Box, Button, Container, IconButton, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useCreator } from 'src/hooks/zustands/useCreator';

import Iconify from 'src/components/iconify';

const Verify = () => {
  const { email } = useCreator();

  return (
    <>
      {email ? (
        <Container
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100vh',
            padding: '20px 0',
          }}
        >
          <Typography variant="h3">Cult Creative</Typography>

          <Box
            sx={{
              display: 'inline-block',
            }}
          >
            <IconButton aria-label="delete" size="small" disabled>
              <Iconify icon="ic:baseline-email" width={40} />
            </IconButton>
            <Typography variant="h4" gutterBottom>
              Check your email
            </Typography>
            <Typography variant="p" gutterBottom>
              We sent a sign in link to {email}
            </Typography>
          </Box>

          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Typography>Don&apos;t see it ?</Typography>
            <Button>Resend email</Button>
          </Box>
        </Container>
      ) : (
        <Navigate to={paths.auth.jwt.login} />
      )}
    </>
  );
};

export default Verify;
