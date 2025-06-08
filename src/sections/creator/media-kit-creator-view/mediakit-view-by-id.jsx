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
  useTheme,
  Container,
  IconButton,
  Typography,
  ListItemText,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { grey } from 'src/theme/palette';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import { formatNumber } from '../media-kit/view-instagram';
import MediaKitSocial from '../media-kit/view/media-kit-social-view';

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
        <Container
          maxWidth="xl"
          // maxWidth={settings.themeStretch ? false : 'lg'}
          // sx={
          //   isFullScreen
          //     ? {
          //         ...styleFullScreen,
          //       }
          //     : {
          //         borderRadius: 1,
          //         position: 'relative',
          //         boxShadow:
          //           theme.palette.mode === 'light'
          //             ? 'rgba(9, 30, 66, 0.25) 0px 1px 1px, rgba(9, 30, 66, 0.13) 0px 0px 2px 2px;'
          //             : 'rgba(255, 255, 255, 0.10) 0px 1px 1px, rgba(255, 255, 255, 0.08) 0px 0px 2px 2px',
          //         p: 2,
          //       }
          // }
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Avatar
              sx={{
                width: 100,
                height: 100,
              }}
              src={data?.user?.photoURL}
            />
          </Stack>

          <Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: theme.typography.fontSecondaryFamily,
                  fontWeight: 100,
                }}
              >
                {data?.user?.name}
              </Typography>
              {/* <Iconify icon="material-symbols:verified" color="info.main" width={20} /> */}
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

          <Typography variant="subtitle2" my={1}>
            {data?.user?.creator?.mediaKit?.about}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} mb={2} flexWrap="wrap">
            {data?.user?.creator?.interests.map((interest) => (
              <Label
                key={interest?.id}
                sx={{
                  border: 1,
                  borderColor: '#EBEBEB',
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  bgcolor: 'white',
                }}
              >
                {interest.name.toUpperCase()}
              </Label>
            ))}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="stretch"
            spacing={2}
            flexWrap={{ xs: 'wrap', md: 'nowrap' }}
            sx={{
              borderTop: 1,
              borderBottom: 1,
              borderColor: '#EBEBEB',
              py: 2,
            }}
          >
            <Box
              sx={{
                width: 1,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: 0,
                  height: '80%',
                  width: '2px',
                  backgroundColor: '#EBEBEB',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    bgcolor: '#8A5AFE',
                    width: 60,
                    height: 60,
                  }}
                >
                  <Iconify icon="ic:sharp-people-alt" width={30} />
                </Avatar>
                <ListItemText
                  primary="FOLLOWERS"
                  secondary={
                    socialMediaAnalytics.followers
                      ? formatNumber(socialMediaAnalytics.followers)
                      : 'No data'
                  }
                  primaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                    fontWeight: 600,
                  }}
                  secondaryTypographyProps={{
                    variant: 'h3',
                    color: 'black',
                    key: currentTab,
                    component: m.div,
                    initial: { scale: 0.5 },
                    animate: { scale: 1 },
                    transition: {
                      duration: 1,
                      type: 'spring',
                    },
                    lineHeight: 1,
                  }}
                />
              </Stack>
            </Box>
            <Box
              sx={{
                width: 1,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: 0,
                  height: '80%',
                  width: '2px',
                  backgroundColor: '#EBEBEB',
                },
              }}
            >
              {/* <Stack direction="row" alignItems="center" spacing={1}>
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
          </Stack> */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    bgcolor: '#026D54',
                    width: 60,
                    height: 60,
                  }}
                >
                  <Iconify icon="mage:chart-up-fill" width={30} />
                </Avatar>
                <ListItemText
                  primary="ENGAGEMENT RATE"
                  secondary={
                    socialMediaAnalytics.engagement_rate
                      ? `${Number(socialMediaAnalytics.engagement_rate)?.toFixed(2)}%`
                      : 'No data'
                  }
                  primaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                    fontWeight: 600,
                  }}
                  secondaryTypographyProps={{
                    variant: 'h3',
                    color: 'black',
                    key: currentTab,
                    component: m.div,
                    initial: { scale: 0.5 },
                    animate: { scale: 1 },
                    transition: {
                      duration: 1,
                      type: 'spring',
                    },
                    lineHeight: 1,
                  }}
                />
              </Stack>
            </Box>
            <Box
              sx={{
                width: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    bgcolor: '#FF3500',
                    width: 60,
                    height: 60,
                  }}
                >
                  <Iconify icon="hugeicons:play-list-favourite-02" width={30} />
                </Avatar>
                <ListItemText
                  primary="AVERAGE LIKES"
                  secondary={
                    socialMediaAnalytics.averageLikes
                      ? formatNumber(socialMediaAnalytics.averageLikes)
                      : 'No data'
                  }
                  primaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                    fontWeight: 600,
                  }}
                  secondaryTypographyProps={{
                    variant: 'h3',
                    color: 'black',
                    key: currentTab,
                    component: m.div,
                    initial: { scale: 0.5 },
                    animate: { scale: 1 },
                    transition: {
                      duration: 1,
                      type: 'spring',
                    },
                    lineHeight: 1,
                  }}
                />
              </Stack>
            </Box>
          </Stack>

          {/* <Divider sx={{ my: 3 }} /> */}

          <Typography fontWeight={400} fontFamily="Instrument Serif" fontSize="40px" mt={3}>
            Top Content
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} my={2} color="text.secondary">
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:instagram" width={20} />}
              sx={{
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                ...(currentTab === 'instagram' && {
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                  boxShadow: 'none',
                }),
              }}
              onClick={() => setCurrentTab('instagram')}
            >
              Instagram
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="ic:baseline-tiktok" width={20} />}
              sx={{
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                ...(currentTab === 'tiktok' && {
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                  boxShadow: 'none',
                }),
              }}
              onClick={() => setCurrentTab('tiktok')}
            >
              Tiktok
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:partnership" width={20} />}
              sx={{
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                ...(currentTab === 'partnerships' && {
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                  boxShadow: 'none',
                }),
              }}
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
    </Dialog>
  );
};

export default MediaKitCreator;

MediaKitCreator.propTypes = {
  creatorId: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
