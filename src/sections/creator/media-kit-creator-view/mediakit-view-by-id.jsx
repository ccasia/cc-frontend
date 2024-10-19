import useSWR from 'swr';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

// eslint-disable-next-line import/no-unresolved
import {
  Box,
  Slide,
  Stack,
  Dialog,
  AppBar,
  Avatar,
  Button,
  Toolbar,
  Divider,
  useTheme,
  Container,
  IconButton,
  Typography,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { grey } from 'src/theme/palette';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import AvatarIcon from 'src/components/avatar-icon/avatar-icon';

import MediaKitSocial from './media-kit-social/view';
import { formatNumber } from './media-kit-social/media-kit-social-content/view-instagram';

const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const MediaKitCreator = ({ creatorId, open, onClose }) => {
  const settings = useSettingsContext();
  const theme = useTheme();
  // const { user } = useAuthContext();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [currentTab, setCurrentTab] = useState('instagram');
  const [openSetting, setOpenSetting] = useState(false);

  const { data, isLoading } = useSWR(
    creatorId ? endpoints.creators.getCreatorFullInfo(creatorId) : null,
    fetcher
  );

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: data?.user?.creator?.socialMediaData?.instagram?.data?.followers,
        engagement_rate: data?.user?.creator?.socialMediaData?.instagram?.data?.engagement_rate,
        averageLikes:
          data?.user?.creator?.socialMediaData?.instagram?.data?.user_performance
            ?.avg_likes_per_post,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: data?.user?.creator?.socialMediaData?.tiktok?.data?.followers,
        engagement_rate: data?.user?.creator?.socialMediaData?.tiktok?.data?.engagement_rate,
        averageLikes:
          data?.user?.creator?.socialMediaData?.tiktok?.data?.user_performance?.avg_likes_per_post,
      };
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [currentTab, data]);

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
        {/* <Container maxWidth={settings.themeStretch ? false : 'lg'}>
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

          <MediaKitSocial currentTab={currentTab} creator={creatorData} />
        </Container> */}
        <Container
          maxWidth={settings.themeStretch ? false : 'lg'}
          sx={
            isFullScreen
              ? {
                  ...styleFullScreen,
                }
              : {
                  borderRadius: 1,
                  position: 'relative',
                  boxShadow:
                    theme.palette.mode === 'light'
                      ? 'rgba(9, 30, 66, 0.25) 0px 1px 1px, rgba(9, 30, 66, 0.13) 0px 0px 2px 2px;'
                      : 'rgba(255, 255, 255, 0.10) 0px 1px 1px, rgba(255, 255, 255, 0.08) 0px 0px 2px 2px',
                  p: 2,
                }
          }
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Avatar
              sx={{
                width: 100,
                height: 100,
              }}
              src={data?.user?.photoURL}
            />
            <Button
              startIcon={<Iconify icon="lucide:edit" />}
              variant="outlined"
              sx={{
                boxShadow: 1,
              }}
              onClick={() => {
                setOpenSetting(true);
              }}
            >
              Edit Profile
            </Button>
          </Stack>

          <Stack my={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h3" fontWeight="bold">
                {data?.user?.name}
              </Typography>
              <Iconify icon="material-symbols:verified" color="info.main" width={20} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {data?.user?.creator?.pronounce}
              </Typography>
              <Iconify icon="mdi:dot" color="text.secondary" />
              <Typography variant="body2" color="text.secondary">
                {data?.user?.country}
              </Typography>
              <Iconify icon="mdi:dot" color="text.secondary" />
              <Typography variant="body2" color="text.secondary">
                {data?.user?.email}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} my={2.5}>
            {data?.user?.creator?.interests.map((interest) => (
              <Label key={interest?.id}>{interest.name.toUpperCase()}</Label>
            ))}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="stretch"
            spacing={2}
            flexWrap={{ xs: 'wrap', md: 'nowrap' }}
          >
            <Box
              sx={{
                boxShadow: 5,
                p: 2,
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <AvatarIcon icon="ic:sharp-people-alt" />
                <Stack>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    FOLLOWERS
                  </Typography>
                  <Typography
                    variant="h3"
                    key={currentTab}
                    component={m.div}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 1,
                      type: 'spring',
                    }}
                  >
                    {socialMediaAnalytics.followers
                      ? formatNumber(socialMediaAnalytics.followers)
                      : 'No data'}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <Box
              sx={{
                boxShadow: 5,
                p: 2,
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <AvatarIcon icon="solar:chart-bold" />
                <Stack>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    ENGAGEMENT RATE
                  </Typography>
                  <Typography
                    variant="h3"
                    key={currentTab}
                    component={m.div}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 1,
                      type: 'spring',
                    }}
                  >
                    {socialMediaAnalytics.engagement_rate
                      ? `${Number(socialMediaAnalytics.engagement_rate).toFixed(2)}%`
                      : 'No data'}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <Box
              sx={{
                boxShadow: 5,
                p: 2,
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <AvatarIcon icon="raphael:fave" />

                <Stack>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    AVERAGE LIKES
                  </Typography>
                  <Typography
                    variant="h3"
                    key={currentTab}
                    component={m.div}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 1,
                      type: 'spring',
                    }}
                  >
                    {socialMediaAnalytics.averageLikes
                      ? formatNumber(socialMediaAnalytics.averageLikes)
                      : 'No data'}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" color="text.secondary" fontWeight={800}>
            Top Content
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} my={2} color="text.secondary">
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:instagram" width={20} />}
              sx={
                currentTab === 'instagram' && {
                  border: 2,
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                }
              }
              onClick={() => setCurrentTab('instagram')}
            >
              Instagram
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="ic:baseline-tiktok" width={20} />}
              sx={
                currentTab === 'tiktok' && {
                  border: 2,
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                }
              }
              onClick={() => setCurrentTab('tiktok')}
            >
              Tiktok
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:partnership" width={20} />}
              sx={
                currentTab === 'partnerships' && {
                  border: 2,
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                }
              }
              onClick={() => setCurrentTab('partnerships')}
            >
              Partnerships
            </Button>
          </Stack>

          <MediaKitSocial
            currentTab={currentTab}
            data={data?.user?.creator?.socialMediaData}
            isLoading={isLoading}
          />
        </Container>
      </DialogContent>

      {/* {isLoading ? (
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
        // <>
        //   {!creatorData ? (
        //     <EmptyContent title="Media Kit Data not found." />
        //   ) : (
        //     <>
        //       <AppBar sx={{ position: 'relative' }}>
        //         <Toolbar>
        //           <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
        //             <Iconify icon="ic:round-close" />
        //           </IconButton>
        //           <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
        //             Media Kit
        //           </Typography>
        //         </Toolbar>
        //       </AppBar>
        //       <DialogContent>
        //         <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        //           <MediaKitCover user={creatorData} />

        //           <Tabs
        //             value={currentTab}
        //             onChange={(e, val) => setCurrentTab(val)}
        //             variant="fullWidth"
        //             sx={{
        //               mt: 2,
        //               mb: 2,
        //               border: `dashed 1px ${theme.palette.divider}`,
        //               borderRadius: 2,
        //               p: 2,
        //               [`& .Mui-selected`]: {
        //                 bgcolor:
        //                   settings.themeMode === 'dark'
        //                     ? theme.palette.grey[800]
        //                     : theme.palette.grey[300],
        //                 borderRadius: 1.5,
        //                 border: 1,
        //                 borderColor: theme.palette.divider,
        //               },
        //             }}
        //             TabIndicatorProps={{
        //               sx: {
        //                 display: 'none',
        //               },
        //             }}
        //           >
        //             <Tab
        //               value="instagram"
        //               label="Instagram"
        //               icon={<Iconify icon="skill-icons:instagram" />}
        //             />
        //             <Tab
        //               value="tiktok"
        //               label="Tiktok"
        //               icon={<Iconify icon="logos:tiktok-icon" />}
        //             />
        //             <Tab value="partnership" label="Partnerships" />
        //           </Tabs>

        //           <MediaKitSocial currentTab={currentTab} creator={creatorData} />
        //         </Container>
        //       </DialogContent>
        //     </>
        //   )}
        // </>
      )} */}
    </Dialog>
  );
};

export default MediaKitCreator;

MediaKitCreator.propTypes = {
  creatorId: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
