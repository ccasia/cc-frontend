import React from 'react';

import { Box, Container, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';

import Image from 'src/components/image';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

const Invoice = () => {
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="List Creators"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Invoices' }]}
        sx={{
          mb: 3,
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          left: '60%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Image src="/assets/development.svg" width={500} />

        <Typography textAlign="center" variant="h5" mt={2}>
          In Development
        </Typography>
      </Box>
    </Container>
  );
};

export default Invoice;
