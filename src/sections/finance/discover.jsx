import React from 'react';
import { Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';

function FianaceDiscover() {
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Fianace"
        links={[
          { name: 'Dashboard', href: paths.dashboard.finance.root },
          {
            name: 'Fianace',
            href: paths.dashboard.finance.root,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />
    </Container>
  );
}

export default FianaceDiscover;
