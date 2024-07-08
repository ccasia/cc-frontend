import React, { useState } from 'react';
import { useTheme } from '@emotion/react';

import { Box, Tab, Tabs, Container, useMediaQuery } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useGetTimelineType } from 'src/hooks/use-get-timelinetype';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import Timeline from './timeline';

const CampaignSetting = () => {
  // eslint-disable-next-line no-unused-vars
  const [tab, setTabs] = useState('timeline');
  const settings = useSettingsContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { timelineType } = useGetTimelineType();

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

      <Box
        sx={{
          border: `solid 2px ${theme.palette.background.paper}`,
          borderRadius: 2,
          mt: 3,
          p: 3,
          position: 'relative',
        }}
      >
        {/* Left Sections */}
        <Box display="flex" flexDirection={isSmallScreen ? 'column' : 'row'} minHeight={300}>
          <Tabs
            value={tab}
            orientation={isSmallScreen ? 'horizontal' : 'vertical'}
            sx={{
              borderRight: {
                md: 1,
              },
              borderColor: {
                md: 'divider',
              },
              '& .MuiTab-root': {
                pr: 2,
                width: '100%',
                borderRadius: 1.5,
              },
            }}
            onChange={handleChange}
          >
            <Tab value="timeline" label="Default Timeline" />
            {/* <Tab value="reminder" label="Default Reminder" /> */}
          </Tabs>

          <Box sx={{ padding: 3, width: '100%' }}>
            {tab === 'timeline' && (
              <Timeline timelineType={timelineType} isSmallScreen={isSmallScreen} />
            )}
            {/* {tab === 'reminder' && <h1>Reminder</h1>} */}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default CampaignSetting;
