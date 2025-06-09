import React, { useState } from 'react';
import { useTheme } from '@emotion/react';

import { Box, Tab, Tabs, Button, Container, Typography, useMediaQuery } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';
import { useGetTimelineType } from 'src/hooks/use-get-timelinetype';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import Timeline from './timeline';
import AgreementTemplates from './agreements/agreement-template';

const CampaignSetting = () => {
  // eslint-disable-next-line no-unused-vars
  const [tab, setTabs] = useState('timeline');
  const settings = useSettingsContext();
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { timelineType } = useGetTimelineType();
  const lgUp = useResponsive('up', 'md');

  const handleChange = (event, newValue) => {
    setTabs(newValue);
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          onClick={() => router.push(paths.dashboard.campaign.view)}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
          sx={{
            color: '#636366',
            bgcolor: 'transparent',
            border: 'none',
            px: 0,
            py: 0.5,
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            minHeight: 'auto',
            '&:hover': {
              bgcolor: 'transparent',
              color: '#1340ff',
              '& .MuiButton-startIcon': {
                transform: 'translateX(-2px)',
              },
            },
            '& .MuiButton-startIcon': {
              marginRight: 0.5,
              transition: 'transform 0.2s ease',
            },
            transition: 'color 0.2s ease',
          }}
        >
          Back to Campaigns
        </Button>
      </Box>

      <Typography
        variant="h2"
        sx={{
          mb: 3,
          fontFamily: 'fontSecondaryFamily',
          fontWeight: 'normal',
        }}
      >
        Campaign Settings ⚙️
      </Typography>

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
