import useSWR from 'swr';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// eslint-disable-next-line import/no-unresolved
import {
  Tab,
  Box,
  Tabs,
  Slide,
  Dialog,
  AppBar,
  Toolbar,
  useTheme,
  Container,
  IconButton,
  Typography,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { grey } from 'src/theme/palette';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';

import MediaKitCover from './mediakit-cover';
import MediaKitSocial from './media-kit-social/view-by-id';

const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const MediaKitCreator = ({ creatorId, open, onClose }) => {
  const settings = useSettingsContext();
  const theme = useTheme();
  // const { user } = useAuthContext();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [currentTab, setCurrentTab] = useState('instagram');
  const [openSetting, setOpenSetting] = useState(false);

  const {
    data: creatorData,
    error,
    isLoading,
  } = useSWR(creatorId ? endpoints.creators.getCreatorFullInfo(creatorId) : null, fetcher);

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

  // if (!creatorId) return null;
  // if (error) return <div>Error loading creator data</div>;
  // if (isLoading) return <div>Loading...</div>;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.mode === 'dark' ? grey[900] : grey[200],
          position: 'relative',
        },
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {!creatorData ? (
            <EmptyContent title="Media Kit Data not found." />
          ) : (
            <>
              <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                  <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                    {/* <CloseIcon /> */}
                    <Iconify icon="ic:round-close" />
                  </IconButton>
                  <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                    Media Kit
                  </Typography>
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
                          settings.themeMode === 'dark'
                            ? theme.palette.grey[800]
                            : theme.palette.grey[300],
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
                    <Tab
                      value="tiktok"
                      label="Tiktok"
                      icon={<Iconify icon="logos:tiktok-icon" />}
                    />
                    <Tab value="partnership" label="Partnerships" />
                  </Tabs>

                  <MediaKitSocial currentTab={currentTab} creator={creatorData} />
                </Container>
              </DialogContent>
            </>
          )}
        </>
      )}
    </Dialog>
  );
};

export default MediaKitCreator;

MediaKitCreator.propTypes = {
  creatorId: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
