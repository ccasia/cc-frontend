import React from 'react';

import { Box, Container, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetCampaignsFinance from 'src/hooks/use-get-campaign-finance';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CampaignLists from 'src/sections/campaign/discover/admin/campaign-list';

function CampaignPage() {
  const settings = useSettingsContext();
  const { campaigns, isLoading } = useGetCampaignsFinance();

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
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {/* Test */}
      {!isLoading ? (
        <CampaignLists campaigns={campaigns} />
      ) : (
        // </Stack>
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: (theme) => theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}
    </Container>
  );
}

export default CampaignPage;
