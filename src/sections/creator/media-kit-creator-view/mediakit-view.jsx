import * as yup from 'yup';
import { m } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  Divider,
  useTheme,
  Container,
  Typography,
  ListItemText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { grey } from 'src/theme/palette';
import { useAuthContext } from 'src/auth/hooks';
import { useGetSocialMedia, fetchSocialMediaData } from 'src/api/socialMedia';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import MediaKitSetting from './media-kit-setting';
import MediaKitSocial from './media-kit-social/view';
import { formatNumber } from './media-kit-social/media-kit-social-content/view-instagram';

const MediaKitCreator = () => {
  const settings = useSettingsContext();
  const theme = useTheme();
  const { user } = useAuthContext();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTab, setCurrentTab] = useState('instagram');
  const [openSetting, setOpenSetting] = useState(false);
  const dialog = useBoolean();

  // Function to get existing social media data
  const { data, isLoading } = useGetSocialMedia();

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: data?.instagram?.data?.followers,
        engagement_rate: data?.instagram?.data?.engagement_rate,
        averageLikes: data?.instagram?.data?.user_performance?.avg_likes_per_post,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: data?.tiktok?.data?.followers,
        engagement_rate: data?.tiktok?.data?.engagement_rate,
        averageLikes: data?.tiktok?.data?.user_performance?.avg_likes_per_post,
      };
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [currentTab, data]);

  const loading = useBoolean();

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
    bgcolor: theme.palette.mode === 'dark' ? grey[900] : grey[200],
  };

  const fetchNewSocialMediaData = async () => {
    loading.onTrue();
    try {
      await fetchSocialMediaData();
      enqueueSnackbar('Data is updated');
    } catch (error) {
      enqueueSnackbar('Failed to fetch data', {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  };

  const checkSocialMediaUsername = useCallback(() => {
    if (!user?.creator?.tiktok || !user?.creator?.instagram) {
      return true;
    }
    return false;
  }, [user]);

  const schema = yup.object().shape({
    instagram: yup.string().required('Instagram username is required.'),
    tiktok: yup.string().required('Tiktok username is required.'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      instagram: user?.creator?.instagram || '',
      tiktok: user?.creator?.tiktok || '',
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = handleSubmit(async (value) => {
    try {
      const res = await axiosInstance.patch(endpoints.creators.updateCreator, {
        ...value,
        id: user.id,
      });
      enqueueSnackbar(res?.data?.message);
      dialog.onFalse();
      reset();
      fetchNewSocialMediaData();
    } catch (error) {
      enqueueSnackbar(error?.message);
    }
  });

  return (
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
      <Stack direction="row" alignItems="start" justifyContent="space-between">
        <Avatar
          sx={{
            width: 100,
            height: 100,
          }}
          src={user?.photoURL}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Button
            size="small"
            variant="contained"
            sx={{
              boxShadow: 2,
            }}
            startIcon={<Iconify icon="material-symbols:refresh" />}
            onClick={() => {
              const res = checkSocialMediaUsername();
              if (res) {
                dialog.onTrue();
              } else {
                fetchNewSocialMediaData();
              }
            }}
          >
            {loading.value ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            startIcon={<Iconify icon="lucide:edit" />}
            variant="outlined"
            sx={{
              boxShadow: 2,
            }}
            onClick={() => {
              setOpenSetting(true);
            }}
          >
            Edit Profile
          </Button>
        </Box>
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
            {user?.name}
          </Typography>
          <Iconify icon="material-symbols:verified" color="info.main" width={20} />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {user?.creator?.pronounce}
          </Typography>
          <Iconify icon="mdi:dot" color="text.secondary" />
          <Typography variant="body2" color="text.secondary">
            {user?.country}
          </Typography>
          <Iconify icon="mdi:dot" color="text.secondary" />
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Stack>
      </Stack>

      <Typography variant="subtitle2" my={1}>
        {user?.creator?.mediaKit?.about}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} mb={2} flexWrap="wrap">
        {user?.creator?.interests.map((interest) => (
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
                  ? `${Number(socialMediaAnalytics.engagement_rate).toFixed(2)}%`
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

      <Divider sx={{ my: 3 }} />

      <Typography fontWeight={400} fontFamily="Instrument Serif" fontSize="40px">
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

      <MediaKitSocial currentTab={currentTab} data={data} isLoading={isLoading} />
      <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} />
    </Container>
  );
};

export default MediaKitCreator;
