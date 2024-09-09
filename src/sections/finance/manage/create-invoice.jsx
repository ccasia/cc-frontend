import React from 'react';
import { useParams } from 'react-router-dom';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useGetPitchById } from 'src/hooks/use-get-pitch-by-id';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

// import InvoiceNewEditForm from 'src/sections/invoice/view/invoice-new-edit-form';
import InvoiceNewEditForm from 'src/sections/invoice/invoice-new-edit-form';

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
            name: 'Edit Invoice',
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
