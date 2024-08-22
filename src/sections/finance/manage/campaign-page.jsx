import React from 'react';

import { Stack, Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetCampaignsFinance from 'src/hooks/use-get-campaign-finance';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignLists from 'src/sections/campaign/discover/admin/campaign-list';

function CampaignPage() {
  const settings = useSettingsContext();
  const { campaigns } = useGetCampaignsFinance();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Invoice"
        links={[
          { name: 'Dashboard', href: paths.dashboard.finance.root },
          {
            name: 'invoice',
            href: paths.dashboard.finance.invoice,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <CampaignLists campaigns={campaigns} />
      </Stack>
    </Container>
  );
}

export default CampaignPage;
