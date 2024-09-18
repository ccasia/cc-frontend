import React, { useState, useEffect } from 'react';

import { Tab, Box, Card, Tabs, useTheme, Container } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import MediaKitCover from './mediakit-cover';
import MediaKitSetting from './media-kit-setting';
import MediaKitSocial from './media-kit-social/view-by-id';
  
import axiosInstance, { endpoints } from 'src/utils/axios';

const MediaKitCreator = ({ creatorId }) => {
  const settings = useSettingsContext();
  const theme = useTheme();
  const { user } = useAuthContext();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [currentTab, setCurrentTab] = useState('instagram');
  const [openSetting, setOpenSetting] = useState(false);
  const [creatorData, setCreatorData] = useState(null);

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
    bgcolor: theme.palette.background.paper,
  };

  console.log(creatorId);

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        const response = await axiosInstance.get(endpoints.creators.getCreatorFullInfo(creatorId));
        setCreatorData(response.data);
      } catch (error) {
        console.error('Error fetching creator data:', error);
      }
    };
  
    if (creatorId) {
      fetchCreatorData();
    }
  }, [creatorId]);

  console.log(creatorData);

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'lg'}
      sx={
        isFullScreen
          ? {
              ...styleFullScreen,
            }
          : {
              border: `dashed 1px ${theme.palette.divider}`,
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
            color: theme.palette.grey[400],
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
            color: theme.palette.grey[400],
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
        <MediaKitCover user={creatorData} />

        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          variant="fullWidth"
          sx={{
            border: `dashed 1px ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
            [`& .Mui-selected`]: {
              bgcolor:
                settings.themeMode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
              borderRadius: 1.5,
              border: 1,
              borderColor: theme.palette.divider,
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

        <MediaKitSocial currentTab={currentTab} creator={creatorData}/>
      </Card>

      <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} />
    </Container>
  );
};

export default MediaKitCreator;
