import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Box, Stack, Button, useTheme, useMediaQuery } from '@mui/material';

// import Image from 'src/components/image';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';

import CampaignInfo from './campaign-info';
import CampaignMyTasks from './campaign-myTask';
import CampaignLogistics from './campaign-logistics';
import CampaignMyTasksMobile from './campaign-myTask-mobile';

const CampaignDetailItem = ({ campaign }) => {
  const location = useLocation();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(location.state?.tab || 'tasks');
  const { user } = useAuthContext();

  // Mobile detection - using same breakpoint as other mobile components
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isCampaignDone = campaign?.shortlisted?.find(
    (item) => item.userId === user?.id
  )?.isCampaignDone;

  const openLogisticTab = () => {
    setCurrentTab('logistics');
  };

  return (
    <Stack overflow="auto" gap={2}>
      <Stack gap={2}>
        {/* Modern Tab Container */}
        <Box
          sx={{
            mt: { xs: 1, sm: 2 },
            mb: 1,
          }}
        >
          <Box
            sx={{
              border: '1px solid #e7e7e7',
              borderRadius: { xs: 1, sm: 1 },
              p: { xs: 0.75, sm: 1 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: { xs: 'stretch', sm: 'flex-start' },
              gap: { xs: 0.75, sm: 1 },
              bgcolor: 'background.paper',
            }}
          >
            {/* Tab Buttons */}
            <Stack
              direction="row"
              spacing={{ xs: 0.75, sm: 1 }}
              sx={{
                flex: { xs: 'none', sm: '0 0 auto' },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {[
                { value: 'tasks', label: 'Activity' },
                { value: 'info', label: 'Campaign Details' },
                { value: 'logistics', label: 'Logistics' },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  onClick={() => setCurrentTab(tab.value)}
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.75, sm: 1 },
                    minHeight: { xs: '36px', sm: '38px' },
                    height: { xs: '36px', sm: '38px' },
                    minWidth: 'fit-content',
                    flex: { xs: 1, sm: 'none' },
                    color: currentTab === tab.value ? '#ffffff' : '#666666',
                    bgcolor: currentTab === tab.value ? '#1340ff' : 'transparent',
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    fontWeight: 600,
                    borderRadius: 0.75,
                    textTransform: 'none',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '1px',
                      left: '1px',
                      right: '1px',
                      bottom: '1px',
                      borderRadius: 0.75,
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor: currentTab === tab.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
                    },
                    '&:hover': {
                      bgcolor: currentTab === tab.value ? '#1340ff' : 'transparent',
                      color: currentTab === tab.value ? '#ffffff' : '#1340ff',
                      transform: 'scale(0.98)',
                    },
                    '&:focus': {
                      outline: 'none',
                    },
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>

        {isCampaignDone && (
          <Label color="success" sx={{ height: 40 }}>
            🎉 Congratulations! {campaign?.name} is done!
          </Label>
        )}

        <Box mt={{ xs: 0.5, sm: 1 }}>
          {currentTab === 'tasks' && (
            <>
              {isMobile ? (
                <CampaignMyTasksMobile
                  campaign={campaign}
                />
              ) : (
                <CampaignMyTasks
                  campaign={campaign}
                  openLogisticTab={openLogisticTab}
                  setCurrentTab={setCurrentTab}
                />
              )}
            </>
          )}
          {currentTab === 'info' && <CampaignInfo campaign={campaign} />}
          {/* {currentTab === 'admin' && <CampaignAdmin campaign={campaign} />} */}
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
