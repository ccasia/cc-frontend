import { useMemo } from 'react';
import PropTypes from 'prop-types';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import InvoiceDetails from '../invoice-details';

// ----------------------------------------------------------------------

export default function InvoiceDetailsView({ id, data }) {
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
      <CustomBreadcrumbs
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
      />

      <InvoiceDetails invoice={data} />
    </Container>
  );
}

InvoiceDetailsView.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
};
