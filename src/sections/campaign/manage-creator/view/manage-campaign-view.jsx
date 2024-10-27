import React, { useState } from 'react';

import { Box, Button, Container, InputBase } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import ActiveCampaignView from '../active-campaign-view';
import AppliedCampaignView from '../applied-campaign-view';
import CompletedCampaignView from '../completed-campaign-view';

const ManageCampaignView = () => {
  const [currentTab, setCurrentTab] = useState('myCampaign');
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { user } = useAuthContext();

  const renderTabs = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
        mb: 3,
        mt: 4,
        p: 2,
        width: '100%',
        minHeight: { xs: 'auto', sm: 72 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: { xs: 2, sm: 0 },
        }}
      >
        {['myCampaign', 'applied', 'completed'].map((tab) => (
          <Button
            key={tab}
            size="large"
            variant={currentTab === tab ? 'contained' : 'text'}
            onClick={() => setCurrentTab(tab)}
            sx={{
              mb: { xs: 1, sm: 0 },
              mr: { sm: 1 },
              fontWeight: 'bold',
              bgcolor: currentTab === tab ? 'common.black' : 'transparent',
              color: currentTab === tab ? 'common.white' : 'text.secondary',
              '&:hover': {
                bgcolor: currentTab === tab ? 'common.black' : 'transparent',
              },
              borderRadius: 1.5,
              height: 42,
              minWidth: 60,
            }}
          >
            {tab === 'myCampaign'
              ? 'Active Campaigns'
              : tab === 'applied'
                ? 'My Applications'
                : 'Completed Campaigns'}
          </Button>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            height: 42,
            width: { xs: '100%', sm: 250 },
          }}
        >
          <Iconify
            icon="eva:search-fill"
            sx={{ width: 20, height: 20, ml: 1, mr: 1, color: 'text.disabled' }}
          />
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            sx={{ flex: 1 }}
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Campaigns"
        links={[
          { name: 'Dashboard', href: paths.root },
          { name: 'Campaign', href: paths.dashboard.campaign.creator.manage },
          { name: 'Lists' },
        ]}
      />
      {renderTabs}

      {currentTab === 'myCampaign' && <ActiveCampaignView searchQuery={query} />}
      {currentTab === 'applied' && <AppliedCampaignView searchQuery={query} />}
      {currentTab === 'completed' && <CompletedCampaignView searchQuery={query} />}
    </Container>
  );
};

export default ManageCampaignView;

// ManageCampaignView.propTypes = {};
