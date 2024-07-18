/* eslint-disable no-unused-vars */
import io from 'socket.io-client';
import React, { lazy } from 'react';

import { Box, Grid, alpha, Container } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';

const DashboardFinance = lazy(() => import('src/sections/admin/Finance/Dashboard'));

const DashboardAdmin = () => {
  const settings = useSettingsContext();

  const { user } = useAuthContext();
  const socket = io();

  const onChange = (e) => {
    socket.emit('chat', e.target.value);
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {user?.admin?.designation === 'Finance' && <DashboardFinance />}
      {user?.admin?.designation === 'CSM' && (
        <Grid container columnSpacing={5}>
          {/* {JSON.stringify(user)} */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                mt: 5,
                width: 1,
                height: 320,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                border: (theme) => `dashed 1px ${theme.palette.divider}`,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                mt: 5,
                width: 1,
                height: 320,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                border: (theme) => `dashed 1px ${theme.palette.divider}`,
              }}
            />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default DashboardAdmin;
