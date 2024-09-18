import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  IconButton, 
  useTheme, 
  Container, 
  Tabs, 
  Tab,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Slide,
  Box,
  Card,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import useSWR from 'swr';
import Iconify from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';
import { useSettingsContext } from 'src/components/settings';
import MediaKitCover from './mediakit-cover';
import MediaKitSetting from './media-kit-setting';
import MediaKitSocial from './media-kit-social/view-by-id';
import axiosInstance, { endpoints } from 'src/utils/axios';

const fetcher = (url) => axiosInstance.get(url).then(res => res.data);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MediaKitCreator = ({ creatorId, open, onClose }) => {
  const settings = useSettingsContext();
  const theme = useTheme();
  const { user } = useAuthContext();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [currentTab, setCurrentTab] = useState('instagram');
  const [openSetting, setOpenSetting] = useState(false);
  
  const { data: creatorData, error } = useSWR(
    creatorId ? endpoints.creators.getCreatorFullInfo(creatorId) : null,
    fetcher
  );

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

  if (!creatorId) return null;
  if (error) return <div>Error loading creator data</div>;
  if (!creatorData) return <div>Loading...</div>;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Media Kit
          </Typography>
          {/* <Button color="inherit" onClick={() => setOpenSetting(true)}>
            Settings
          </Button> */}
        </Toolbar>
      </AppBar>
      <DialogContent>
        <Container maxWidth={settings.themeStretch ? false : 'lg'}>
          <MediaKitCover user={creatorData} />
          
          <Tabs
            value={currentTab}
            onChange={(e, val) => setCurrentTab(val)}
            variant="fullWidth"
            sx={{
              mt: 2,
              mb: 2,
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
        </Container>
      </DialogContent>
      
      {/* <MediaKitSetting open={openSetting} handleClose={() => setOpenSetting(false)} user={creatorData} /> */}
    </Dialog>
  );
};

export default MediaKitCreator;
