import React, { useState } from 'react';

import { Tab, Box, Card, Tabs, Container } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import MediaKitCover from './mediakit-cover';
import MediaKitSetting from './media-kit-setting';
import MediaKitSocial from './media-kit-social/view';

const MediaKitCreator = () => {
  const settings = useSettingsContext();

  const { user } = useAuthContext();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [currentTab, setCurrentTab] = useState('instagram');
  const [openSetting, setOpenSetting] = useState(false);

  const handleClose = () => {
    setOpenSetting(!openSetting);
  };

  const toggle = () => {
    setIsFullScreen(!isFullScreen);
  };

  const styleFullScreen = {
    minWidth: '100vw',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10000,
    bgcolor: (theme) => theme.palette.background.paper,
  };

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'lg'}
      sx={
        isFullScreen
          ? {
              ...styleFullScreen,
            }
          : {
              border: (theme) => `dashed 1px ${theme.palette.divider}`,
              borderRadius: 2,
              position: 'relative',
            }
      }
    >
      <Box
        component="div"
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          cursor: 'pointer',
          zIndex: 1000,
          '&:hover': {
            color: (theme) => theme.palette.grey[400],
          },
        }}
        onClick={toggle}
      >
        {isFullScreen ? (
          <Iconify icon="akar-icons:reduce" />
        ) : (
          <Iconify icon="akar-icons:enlarge" />
        )}
      </Box>
      <Box
        component="div"
        onClick={() => setOpenSetting(true)}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          cursor: 'pointer',
          zIndex: 1000,
          '&:hover': {
            color: (theme) => theme.palette.grey[400],
          },
        }}
      >
        {!isFullScreen && <Iconify icon="uil:setting" />}
      </Box>
      <Card
        sx={{
          mb: 3,
          border: 'none',
          boxShadow: 'none',
          bgcolor: 'transparent',
        }}
      >
        <MediaKitCover user={user} />

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
      <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} />
    </Container>
  );
};

export default MediaKitCreator;
