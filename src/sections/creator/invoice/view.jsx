import React from 'react';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetInvoicesByCreator from 'src/hooks/use-get-invoices-creator';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import AppNewInvoice from 'src/sections/invoice/invoice-creator-list';

const Invoice = () => {
  const settings = useSettingsContext();
  const invoice = useGetInvoicesByCreator();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="List Creators"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Invoices' }]}
        sx={{
          mb: 3,
        }}
      />

      <AppNewInvoice invoice={invoice?.invoices} />
    </Container>
  );
};

export default Invoice;
