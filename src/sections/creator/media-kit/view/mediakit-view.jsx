import useSWR from 'swr';
import { m } from 'framer-motion';
import React, { useMemo, useState, useEffect } from 'react';

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
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';
import { useSocialMediaData } from 'src/utils/store';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import MediaKitSetting from '../media-kit-setting';
import MediaKitSocial from './media-kit-social-view';

const MediaKitCreator = () => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const setTiktok = useSocialMediaData((state) => state.setTiktok);
  const setInstagram = useSocialMediaData((state) => state.setInstagram);
  const tiktok = useSocialMediaData((state) => state.tiktok);
  const instagram = useSocialMediaData((state) => state.instagram);

  const { data: socialData, isLoading } = useSWR(
    endpoints.creators.social.tiktok(user.id),
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false,
    }
  );

  const { data: instaData, isLoading: instaLoading } = useSWR(
    endpoints.creators.social.instagram(user.id),
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false,
    }
  );

  useEffect(() => {
    setTiktok(socialData);
  }, [socialData, setTiktok]);

  useEffect(() => {
    setInstagram(instaData);
  }, [instaData, setInstagram]);

  const [currentTab, setCurrentTab] = useState('tiktok');

  const [openSetting, setOpenSetting] = useState(false);

  // Function to get existing social media data
  // const { data, isLoading } = useGetSocialMedia();

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: instagram?.user?.followers_count || 0,
        engagement_rate: instagram?.user?.followers_count || 0,
        averageLikes: instagram?.user?.followers_count || 0,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: tiktok?.user?.data?.user?.follower_count || 0,
        engagement_rate: tiktok?.user?.data?.user?.follower_count || 0,
        averageLikes: tiktok?.user?.data?.user?.follower_count || 0,
      };
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [currentTab, tiktok, instagram]);

  const handleClose = () => {
    setOpenSetting(!openSetting);
  };

  if (isLoading || instaLoading) {
    return (
      <Box position="absolute" top="50%" left="50%">
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
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
          {/* <Button
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
          </Button> */}
          <Button
            startIcon={<Iconify icon="solar:settings-linear" />}
            // startIcon={<Iconify icon="lucide:edit" />}
            variant="outlined"
            sx={{
              color: 'black',
            }}
            onClick={() => {
              setOpenSetting(true);
            }}
          >
            Settings
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
            {user?.creator?.mediaKit?.displayName ?? user?.name}
          </Typography>
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
        {/* Followers */}
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
                // socialMediaAnalytics.followers
                //   ? formatNumber(socialMediaAnalytics.followers)
                //   : 'No data'
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

        {/* Engagement rate */}
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
                bgcolor: '#026D54',
                width: 60,
                height: 60,
              }}
            >
              <Iconify icon="mage:chart-up-fill" width={30} />
            </Avatar>
            <ListItemText
              primary="ENGAGEMENT RATE"
              secondary={socialMediaAnalytics.followers}
              // secondary={
              //   socialMediaAnalytics.engagement_rate
              //     ? `${Number(socialMediaAnalytics.engagement_rate).toFixed(2)}%`
              //     : 0
              // }
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

        {/* Average likes */}
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
                socialMediaAnalytics.followers
                // tiktok?.user?.data?.user?.likes_count || 0
                // socialMediaAnalytics.averageLikes
                //   ? formatNumber(socialMediaAnalytics.averageLikes)
                //   : 'No data'
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

      {/* Bottom View */}

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

      <MediaKitSocial currentTab={currentTab} isLoading={isLoading} />
      <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} />
    </Container>
  );
};

export default MediaKitCreator;
