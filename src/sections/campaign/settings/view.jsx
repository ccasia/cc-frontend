import React, { useState } from 'react';
import { useTheme } from '@emotion/react';

import { Box, Tab, Tabs, Container, useMediaQuery } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useResponsive } from 'src/hooks/use-responsive';
import { useGetTimelineType } from 'src/hooks/use-get-timelinetype';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import Timeline from './timeline';
import AgreementTemplates from './agreements/agreement-template';

const CampaignSetting = () => {
  // eslint-disable-next-line no-unused-vars
  const [tab, setTabs] = useState('timeline');
  const settings = useSettingsContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { timelineType } = useGetTimelineType();
  const lgUp = useResponsive('up', 'md');

  const handleChange = (event, newValue) => {
    setTabs(newValue);
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Campaign Settings"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Campaign', href: paths.dashboard.campaign.view },
          { name: 'Settings' },
        ]}
      />

      {/* Left Sections */}
      <Box
        display="flex"
        flexDirection={isSmallScreen ? 'column' : 'row'}
        alignItems="stretch"
        justifyContent="stretch"
        height={lgUp && 600}
        sx={{ border: 1, p: 0.5, borderRadius: 2, borderColor: '#EBEBEB', mt: 3 }}
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
          {tab === 'timeline' && (
            <Timeline timelineType={timelineType} isSmallScreen={isSmallScreen} />
          )}
          {tab === 'templates' && <AgreementTemplates />}
        </Box>
      </Box>
    </Container>
  );
};

export default CampaignSetting;
