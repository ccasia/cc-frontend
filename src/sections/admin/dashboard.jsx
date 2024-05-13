import React from 'react';

import { Box, Grid, alpha, Container } from '@mui/material';

import { useSettingsContext } from 'src/components/settings';

const DashboardAdmin = () => {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Grid container columnSpacing={5}>
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
    </Container>
  );
};

export default DashboardAdmin;
