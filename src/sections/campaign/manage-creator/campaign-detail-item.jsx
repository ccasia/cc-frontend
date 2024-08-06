import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';

import CampaignInfo from './campaign-info';
import CampaignAdmin from './campaign-admin';
import CampaignMyTasks from './campaign-myTask';

const CampaignDetailItem = ({ campaign }) => {
  const [currentTab, setCurrentTab] = useState('tasks');

  // const renderTabs = (
  //   <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} variant="scrollable">
  //     <Tab value="tasks" label="My Tasks" />
  //     <Tab value="info" label="Campaign Info" />
  //     {/* <Tab value="brief" label="Campaign Brief" /> */}
  //     <Tab value="admin" label="Campaign Admin" />
  //   </Tabs>
  // );

  return (
    <Stack overflow="scroll" gap={2}>
      {/* {renderGallery} */}
      <ToggleButtonGroup
        sx={{ mt: 2 }}
        value={currentTab}
        color="info"
        exclusive
        onChange={(e, val) => setCurrentTab(val)}
        aria-label="Platform"
        fullWidth
      >
        <ToggleButton value="tasks">My Tasks</ToggleButton>
        <ToggleButton value="info">Campaign Info</ToggleButton>
        <ToggleButton value="admin">Campaign Admin</ToggleButton>
      </ToggleButtonGroup>
      {/* {renderTabs} */}
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
