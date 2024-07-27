import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Tab, Tabs, Stack } from '@mui/material';

import Image from 'src/components/image';

import CampaignInfo from './campaign-info';
import CampaignAdmin from './campaign-admin';
import CampaignMyTasks from './campaign-myTask';

const CampaignDetailItem = ({ campaign }) => {
  const [currentTab, setCurrentTab] = useState('info');

  const renderGallery = (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
      gap={1}
      mt={2}
    >
      <Image
        src={campaign?.campaignBrief?.images[0]}
        alt="test"
        ratio="1/1"
        sx={{ borderRadius: 2, cursor: 'pointer' }}
      />
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
        {campaign?.campaignBrief?.images.map((elem, index) => (
          <Image
            key={index}
            src={elem}
            alt="test"
            ratio="1/1"
            sx={{ borderRadius: 2, cursor: 'pointer' }}
          />
        ))}
      </Box>
    </Box>
  );

  const renderTabs = (
    <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} variant="scrollable">
      <Tab value="tasks" label="My Tasks" />
      <Tab value="info" label="Campaign Info" />
      {/* <Tab value="brief" label="Campaign Brief" /> */}
      <Tab value="admin" label="Campaign Admin" />
    </Tabs>
  );

  return (
    <Stack overflow="scroll" gap={2}>
      {renderGallery}
      {renderTabs}
      <Box mt={3}>
        {currentTab === 'tasks' && <CampaignMyTasks campaign={campaign} />}
        {currentTab === 'info' && <CampaignInfo campaign={campaign} />}
        {currentTab === 'admin' && <CampaignAdmin campaign={campaign} />}
      </Box>
    </Stack>
  );
};

export default CampaignDetailItem;

CampaignDetailItem.propTypes = {
  campaign: PropTypes.object,
};
