import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';

// import Image from 'src/components/image';

import CampaignInfo from './campaign-info';
import CampaignAdmin from './campaign-admin';
import CampaignMyTasks from './campaign-myTask';
import CampaignLogistics from './campaign-logistics';

const CampaignDetailItem = ({ campaign }) => {
  const [currentTab, setCurrentTab] = useState('tasks');

  const openLogisticTab = () => {
    setCurrentTab('logistics');
  };

  return (
    <Stack overflow="auto" gap={2}>
      {/* {renderGallery} */}
      <ToggleButtonGroup
        size="small"
        sx={{ mt: 2 }}
        value={currentTab}
        color="info"
        exclusive
        onChange={(e, val) => setCurrentTab(val)}
        aria-label="Platform"
        fullWidth
      >
        <ToggleButton value="tasks">My Tasks</ToggleButton>
        <ToggleButton value="logistics">Logistics</ToggleButton>
        <ToggleButton value="info">Campaign Brief</ToggleButton>
        <ToggleButton value="admin">Campaign Admin</ToggleButton>
      </ToggleButtonGroup>

      <Box mt={3}>
        {currentTab === 'tasks' && (
          <CampaignMyTasks campaign={campaign} openLogisticTab={openLogisticTab} />
        )}
        {currentTab === 'info' && <CampaignInfo campaign={campaign} />}
        {currentTab === 'admin' && <CampaignAdmin campaign={campaign} />}
        {currentTab === 'logistics' && <CampaignLogistics campaign={campaign} />}
      </Box>
    </Stack>
  );
};

export default CampaignDetailItem;

CampaignDetailItem.propTypes = {
  campaign: PropTypes.object,
};
