import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { Box, Stack, Button } from '@mui/material';

// import Image from 'src/components/image';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';

import CampaignInfo from './campaign-info';
import CampaignMyTasks from './campaign-myTask';
import CampaignLogistics from './campaign-logistics';
import CampaignV4Activity from './v4/campaign-v4-activity';

const CampaignDetailItem = ({ campaign }) => {
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(() => {
    if (location.state?.tab) {
      return location.state.tab;
    }
    // Default to appropriate tab based on submission version
    return campaign?.submissionVersion === 'v4' ? 'tasks-v4' : 'tasks';
  });
  const { user } = useAuthContext();

  const isCampaignDone = campaign?.shortlisted?.find(
    (item) => item.userId === user?.id
  )?.isCampaignDone;

  const openLogisticTab = () => {
    setCurrentTab('logistics');
  };

  // Handle cases where campaign data loads after component mount
  useEffect(() => {
    if (!location.state?.tab && campaign?.submissionVersion) {
      const defaultTab = campaign.submissionVersion === 'v4' ? 'tasks-v4' : 'tasks';
      setCurrentTab(defaultTab);
    }
  }, [campaign?.submissionVersion, location.state?.tab]);

  return (
    <Stack gap={2} sx={{ overflowX: 'hidden', width: '100%' }}>
      <Stack gap={2}>
        <Box sx={{ 
          overflowX: 'auto', 
          overflowY: 'hidden',
          mt: 2,
          '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar on webkit browsers
          scrollbarWidth: 'none', // Hide scrollbar on Firefox
        }}>
          <Stack direction="row" spacing={2.5} sx={{ 
            minWidth: 'max-content', // Ensure tabs don't wrap
            px: 2, // Add padding to prevent edge cutoff
          }}>
            {[
              ...(campaign?.submissionVersion === 'v4' 
                ? [{ value: 'tasks-v4', label: 'Submissions' }] 
                : [{ value: 'tasks', label: 'Activity' }]
              ),
              { value: 'info', label: 'Campaign Details' },
              { value: 'logistics', label: 'Logistics' },
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
        </Box>
        {/* Horizontal Line */}
        <Box
          sx={{
            width: '100%',
            height: '1px',
            bgcolor: 'divider',
            mt: -2.2,
          }}
        />
        {isCampaignDone && (
          <Label color="success" sx={{ height: 40 }}>
            🎉 Congratulations! {campaign?.name} is done!
          </Label>
        )}

        <Box mt={3} sx={{ overflowX: 'hidden', width: '100%' }}>
          {currentTab === 'tasks' && (
            <CampaignMyTasks
              campaign={campaign}
              openLogisticTab={openLogisticTab}
              setCurrentTab={setCurrentTab}
            />
          )}
          {currentTab === 'tasks-v4' && (
            <CampaignV4Activity campaign={campaign} />
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
