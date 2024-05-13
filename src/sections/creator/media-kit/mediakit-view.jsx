import React, { useState } from 'react';

import { Tab, Card, Tabs, Container } from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import MediaKitCover from './mediakit-cover';
import MediaKitSocial from './media-kit-social/view';

const MediaKit = () => {
  const settings = useSettingsContext();
  // const theme = useTheme();

  // const [currentTab, setCurrentTab] = useState('social');
  const [currentTab, setCurrentTab] = useState('instagram');

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        border: (theme) => `dashed 1px ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      {/* <ProfileCover /> */}
      <Card
        sx={{
          mb: 3,
          border: 'none',
          boxShadow: 'none',
          bgcolor: 'transparent',
        }}
      >
        <MediaKitCover />

        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          variant="fullWidth"
          sx={{
            border: (theme) => `dashed 1px ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
            [`& .Mui-selected`]: {
              bgcolor: (theme) => theme.palette.background.paper,
              borderRadius: 1.5,
            },
          }}
          TabIndicatorProps={{
            sx: {
              display: 'none',
            },
          }}
        >
          <Tab
            value="instagram"
            label="Instagram"
            icon={<Iconify icon="skill-icons:instagram" />}
          />
          <Tab value="tiktok" label="Tiktok" icon={<Iconify icon="logos:tiktok-icon" />} />
          <Tab value="partnership" label="Partnerships" />
        </Tabs>

        <MediaKitSocial currentTab={currentTab} />
      </Card>

      {/* <Box
        sx={{
          mt: 5,
          width: 1,
          height: 320,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
          border: (theme) => `dashed 1px ${theme.palette.divider}`,
          position: 'relative',
        }}
      >
        <Typography
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          Social
        </Typography>
      </Box> */}
    </Container>
  );
};

export default MediaKit;
