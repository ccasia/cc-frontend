import React from 'react';
import { useParams } from 'react-router-dom';

import { Button, Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import InvoiceListView from 'src/sections/invoice/view/invoice-list-view';

function CreatorSelection() {
  const settings = useSettingsContext();
  // campiagn id
  const { id } = useParams();
  const data = useGetInvoicesByCampId(id);
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
            name: 'Creator List',
            href: paths.dashboard.finance.creatorInvoice,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
        // action={
        //   <Button
        //     component={RouterLink}
        //     href={paths.dashboard.finance.createInvoice(id)}
        //     variant="contained"
        //     startIcon={<Iconify icon="mingcute:add-line" />}
        //   >
        //     New Invoice
        //   </Button>
        // }
      />

      <InvoiceListView invoices={data} campId={id} />
    </Container>
  );
}

export default CreatorSelection;
