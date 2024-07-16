import React, { useMemo, useState } from 'react';

import { Tab, Box, Tabs, Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetCampaignByCreatorId } from 'src/hooks/use-get-campaign-based-on-creator-id';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CampaignItem from '../campaign-item';

const ManageCampaignView = () => {
  const [currentTab, setCurrentTab] = useState('myCampaign');
  const router = useRouter();
  const { data, isLoading } = useGetCampaignByCreatorId();

  const filteredData = useMemo(() => data?.campaigns, [data]);

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={(e, val) => setCurrentTab(val)}
      sx={{
        mt: 2,
      }}
    >
      <Tab value="myCampaign" label="My Campaigns" />
      <Tab value="applied" label="I've Applied" />
    </Tabs>
  );

  const handleClick = (id) => {
    router.push(paths.dashboard.campaign.creator.detail(id));
  };

  return (
    <Container>
      <CustomBreadcrumbs
        heading="Campaigns"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          { name: 'Lists' },
        ]}
      />
      {renderTabs}
      <Box
        gap={3}
        display="grid"
        mt={2}
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        {!isLoading &&
          filteredData.map((campaign) => (
            <CampaignItem
              key={campaign?.id}
              campaign={campaign}
              onClick={() => handleClick(campaign?.id)}
            />
          ))}
      </Box>
    </Container>
  );
};

export default ManageCampaignView;

// ManageCampaignView.propTypes = {};
