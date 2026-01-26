import React, { useState } from 'react';
import { useTheme } from '@emotion/react';

import { Box, Tab, Tabs, useMediaQuery } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';
import { useGetTimelineType } from 'src/hooks/use-get-timelinetype';

import Timeline from 'src/sections/campaign/settings/timeline';
import AgreementTemplates from 'src/sections/campaign/settings/agreements/agreement-template';

const CampaignSettingsTab = () => {
  const [tab, setTabs] = useState('timeline');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { timelineType } = useGetTimelineType();
  const lgUp = useResponsive('up', 'md');

  const handleChange = (event, newValue) => {
    setTabs(newValue);
  };

  return (
    <Box
      display="flex"
      flexDirection={isSmallScreen ? 'column' : 'row'}
      alignItems="stretch"
      justifyContent="stretch"
      height={lgUp && 600}
      sx={{ border: 1, p: 0.5, borderRadius: 2, borderColor: '#EBEBEB' }}
    >
      <Tabs
        value={tab}
        orientation={isSmallScreen ? 'horizontal' : 'vertical'}
        sx={{
          borderRadius: 2,
          m: 1,
          '&.MuiTabs-root': {
            bgcolor: '#F4F4F4',
            p: 1,
          },
          '& .MuiTabs-indicator': {
            position: 'absolute',
            bgcolor: '#FFF',
            border: 1,
            height: 1,
            width: 1,
            borderRadius: 1.5,
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            borderColor: '#E7E7E7',
          },
        }}
        onChange={handleChange}
      >
        <Tab
          value="timeline"
          label="Default Timeline"
          sx={{
            width: 1,
            '&.Mui-selected': {
              borderRadius: 2,
              fontWeight: 600,
              zIndex: 100,
            },
            '&:not(:last-of-type)': {
              mr: 0,
            },
          }}
        />
        <Tab
          value="templates"
          label="Agreement Templates"
          sx={{
            width: 1,
            '&.Mui-selected': {
              borderRadius: 2,
              fontWeight: 600,
              zIndex: 100,
            },
            '&:not(:last-of-type)': {
              mr: 0,
            },
          }}
        />
      </Tabs>

      <Box sx={{ p: 1, py: 2, width: 1, overflow: 'hidden' }}>
        {tab === 'timeline' && <Timeline timelineType={timelineType} isSmallScreen={isSmallScreen} />}
        {tab === 'templates' && <AgreementTemplates />}
      </Box>
    </Box>
  );
};

export default CampaignSettingsTab;
