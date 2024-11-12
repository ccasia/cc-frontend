import { useMemo } from 'react';
import PropTypes from 'prop-types';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';

import InvoiceDetail from 'src/sections/creator/invoice/invoice-details';

// ----------------------------------------------------------------------

export default function InvoiceDetailsView({ id, invoice }) {
  const settings = useSettingsContext();
  const { user } = useAuthContext();

  const renderPathDashboard = useMemo(() => {
    if (user?.role.includes('admin') && user?.admin?.role?.name.includes('Finance')) {
      return paths.dashboard.finance.root;
    }

    return paths.dashboard.root;
  }, [user]);

  const renderPathInvoice = useMemo(() => {
    if (user?.role.includes('admin') && user?.admin?.role?.name.includes('Finance')) {
      return paths.dashboard.finance.invoice;
    }

    return paths.dashboard.creator.invoiceCreator;
  }, [user]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {/* <CustomBreadcrumbs
        heading={data?.invoiceNumber}
        links={[
          {
            name: 'Dashboard',
            href: renderPathDashboard,
          },
          {
            name: 'Invoice',
            href: renderPathInvoice,
          },
          { name: data?.invoiceNumber },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      /> */}

      <InvoiceDetail invoiceId={invoice?.id} />
      {/* <InvoiceDetails invoice={data} /> */}
    </Container>
  );
}

InvoiceDetailsView.propTypes = {
  id: PropTypes.string,
  invoice: PropTypes.object,
};
