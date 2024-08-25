import React from 'react';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

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
    </Container>
  );
};

export default Invoice;
