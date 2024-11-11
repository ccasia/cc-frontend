import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetInvoicesByCampId from 'src/hooks/use-get-invoices-by-campId';
import useGetContacts from 'src/hooks/use-get-xeroContacts';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import InvoiceListView from 'src/sections/invoice/view/invoice-list-view';
import { useXero } from 'src/hooks/zustands/useXero';

function CreatorSelection() {
  const settings = useSettingsContext();
  const { id } = useParams();
  const data = useGetInvoicesByCampId(id);
  const { setContacts } = useXero();
  const contacts = useGetContacts();
  
  useEffect(() => {
    setContacts(contacts.contacts);
  }, []);

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
