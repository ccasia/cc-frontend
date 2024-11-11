import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Stack, Button } from '@mui/material';

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
      <Stack gap={2}>
        <Stack direction="row" spacing={2.5} sx={{ mt: 2 }}>
          {[
            { value: 'tasks', label: 'Activity' },
            { value: 'info', label: 'Campaign Details' },
            { value: 'logistics', label: 'Logistics' },
            { value: 'admin', label: 'Campaign Admin' },
          ].map((tab) => (
            <Button
              key={tab.value}
              disableRipple
              size="large"
              onClick={() => setCurrentTab(tab.value)}
              sx={{
                px: 0.5,
                py: 0.5,
                pb: 1,
                minWidth: 'fit-content',
                color: currentTab === tab.value ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: currentTab === tab.value ? 1 : 0.5,
                  },
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  bgcolor: '#1340ff',
                  width: currentTab === tab.value ? '100%' : '0%',
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>

        {/* Horizontal Line */}
        <Box
          sx={{
            width: '100%',
            height: '1px',
            bgcolor: 'divider',
            mt: -2.2, // Adjust to position the line closer to the buttons
          }}
        />

        <Box mt={3}>
          {currentTab === 'tasks' && (
            <CampaignMyTasks campaign={campaign} openLogisticTab={openLogisticTab} />
          )}
          {currentTab === 'info' && <CampaignInfo campaign={campaign} />}
          {currentTab === 'admin' && <CampaignAdmin campaign={campaign} />}
          {currentTab === 'logistics' && <CampaignLogistics campaign={campaign} />}
        </Box>
      </Stack>
    </Stack>
  );
};

export default CampaignDetailItem;

CampaignDetailItem.propTypes = {
  campaign: PropTypes.object,
};
