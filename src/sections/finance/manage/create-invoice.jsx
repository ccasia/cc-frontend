import React from 'react';

import { Container } from '@mui/material';
import { useParams } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';

// import InvoiceNewEditForm from 'src/sections/invoice/view/invoice-new-edit-form';
import InvoiceNewEditForm from 'src/sections/invoice/invoice-new-edit-form';

import { useGetPitchById } from 'src/hooks/use-get-pitch-by-id';

function CreateInvoice() {
  const settings = useSettingsContext();
  const { id } = useParams();
  const data = useGetPitchById(id);
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Invoice"
        links={[
          { name: 'Dashboard', href: paths.dashboard.finance.root },
          {
            name: 'Invoice',
            href: paths.dashboard.finance.invoice,
          },
          {
            name: 'New Invoice',
            href: paths.dashboard.finance.creatorInvoice,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <InvoiceNewEditForm id={id} creators={data}  />
    </Container>
  );
}

export default CreateInvoice;
