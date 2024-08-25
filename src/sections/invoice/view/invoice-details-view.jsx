import PropTypes from 'prop-types';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import InvoiceDetails from '../invoice-details';

// ----------------------------------------------------------------------

export default function InvoiceDetailsView({ id , data }) {
  const settings = useSettingsContext();


  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={data?.invoiceNumber}
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.finance.root,
          },
          {
            name: 'Invoice',
            href: paths.dashboard.finance.root,
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
