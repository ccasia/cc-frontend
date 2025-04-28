import { m } from 'framer-motion';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

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
  Chip,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { useSocialMediaData } from 'src/utils/store';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import MediaKitSetting from '../media-kit-setting';
import MediaKitSocial from './media-kit-social-view';

const MediaKitCreator = () => {
  const theme = useTheme();
  const smDown = useResponsive('down', 'sm');
  const { user } = useAuthContext();
  const setTiktok = useSocialMediaData((state) => state.setTiktok);
  const setInstagram = useSocialMediaData((state) => state.setInstagram);
  const tiktok = useSocialMediaData((state) => state.tiktok);
  const instagram = useSocialMediaData((state) => state.instagram);
  const isLoading = useBoolean();
  const instaLoading = useBoolean();

  const [currentTab, setCurrentTab] = useState('instagram');
  const [openSetting, setOpenSetting] = useState(false);

  const getInstagram = useCallback(async () => {
    try {
      instaLoading.onTrue();
      const res = await axiosInstance.get(endpoints.creators.social.instagram(user?.id));
      setInstagram(res.data);
    } catch (error) {
      return;
    } finally {
      instaLoading.onFalse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setInstagram]);

  const getTiktok = useCallback(async () => {
    try {
      isLoading.onTrue();
      const res = await axiosInstance.get(endpoints.creators.social.tiktok(user?.id));
      setTiktok(res.data);
    } catch (error) {
      return;
    } finally {
      isLoading.onFalse();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTiktok]);

  // const { data: socialData, isLoading } = useSWR(
  //   endpoints.creators.social.tiktok(user.id),
  //   fetcher,
  //   {
  //     revalidateIfStale: false,
  //     revalidateOnFocus: false,
  //     onSuccess: (data) => {
  //       setTiktok(data);
  //     },
  //   }
  // );

  // const { data: instaData, isLoading: instaLoading } = useSWR(
  //   endpoints.creators.social.instagram(user.id),
  //   fetcher,
  //   {
  //     revalidateIfStale: false,
  //     revalidateOnFocus: false,
  //     onSuccess: (data) => {
  //       setInstagram(data);
  //     },
  //   }
  // );

  const calculateEngagementRate = useCallback((totalLikes, followers) => {
    if (!(totalLikes || followers)) return null;
    return ((parseInt(totalLikes, 10) / parseInt(followers, 10)) * 100).toFixed(2);
  }, []);

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: instagram?.instagramUser?.followers_count || 0,
        engagement_rate: `${
          calculateEngagementRate(
            instagram?.instagramUser?.instagramVideo?.reduce(
              (sum, acc) => sum + parseInt(acc.like_count, 10),
              0
            ),
            instagram?.instagramUser?.followers_count
          ) || 0
        }%`,
        averageLikes: instagram?.instagramUser?.average_like || 0,
        username: instagram?.instagramUser?.username,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: tiktok?.creator?.tiktokUser?.follower_count || 0,
        engagement_rate: tiktok?.creator?.tiktokUser?.follower_count || 0,
        averageLikes: tiktok?.creator?.tiktokUser?.likes_count || 0,
      };
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [currentTab, tiktok, instagram, calculateEngagementRate]);

  const handleClose = () => {
    setOpenSetting(!openSetting);
  };

  useEffect(() => {
    getInstagram();
    getTiktok();
  }, [getInstagram, getTiktok]);

  if (isLoading.value || instaLoading.value) {
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
    <Container maxWidth="xl" sx={{ position: 'relative' }}>
      {/* Desktop View */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          top: 20,
          right: 24,
          zIndex: 10,
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#1340FF',
            color: '#FFFFFF',
            borderRadius: 1.25,
            borderBottom: '3px solid #10248c',
            '&:hover': {
              backgroundColor: '#1340FF',
              opacity: 0.9,
              borderBottom: '3px solid #10248c',
            },
            px: 3,
            fontWeight: 600,
            fontSize: 16,
            height: 44,
          }}
        >
          Share
        </Button>
      </Box>

      {/* Mobile View */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        mb={{ xs: 3, sm: 4, md: 6 }}
        mt={{ xs: 2, sm: 1.5, md: 2 }}
      >
        <Box
          component="img"
          src="/logo/cultcreativelogo.svg"
          alt="Cult Creative Logo"
          draggable="false"
          sx={{
            height: { xs: 60, sm: 100, md: 120 },
          }}
        />
        {/* Mobile Share Button */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#1340FF',
              color: '#FFFFFF',
              borderRadius: 1.25,
              borderBottom: '3px solid #10248c',
              '&:hover': {
                backgroundColor: '#1340FF',
                opacity: 0.9,
                borderBottom: '3px solid #10248c',
              },
              px: 3,
              fontWeight: 600,
              fontSize: 14,
              height: 40,
            }}
          >
            Share
          </Button>
        </Box>
      </Stack>

      {/* Creator Details */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 4, md: 15 }}
        justifyContent="space-between"
      >
        <Stack flex="1">
          <Stack direction="row" alignItems="center">
            <Typography
              sx={{
                fontFamily: 'Aileron, sans-serif',
                fontWeight: 400,
                fontSize: 40,
              }}
            >
              {user?.creator?.mediaKit?.displayName ?? user?.name}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography fontSize={16} color="#231F20">
              {user?.creator?.pronounce}
            </Typography>
            <Iconify icon="mdi:dot" color="#231F20" />
            <Typography fontSize={16} color="#231F20">
              {user?.country}
            </Typography>
            <Iconify icon="mdi:dot" color="#231F20" />
            <Typography fontSize={16} color="#231F20">
              {user?.email}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} mt={2} flexWrap="wrap">
            {user?.creator?.interests.map((interest) => (
              <Chip
                key={interest?.id}
                label={interest.name.toUpperCase()}
                sx={{
                  bgcolor: '#FFF',
                  border: 1,
                  borderColor: '#EBEBEB',
                  borderRadius: 0.8,
                  color: '#8E8E93',
                  height: '32px',
                  boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                  '& .MuiChip-label': {
                    fontWeight: 600,
                    px: 1.5,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '-3px',
                  },
                  '&:hover': { bgcolor: '#FFF' },
                }}
              />
            ))}
          </Stack>

          <Avatar
            sx={{
              mt: 2,
              width: { xs: 150, sm: 200, md: 240 },
              height: { xs: 150, sm: 200, md: 240 },
            }}
            src={user?.photoURL}
          />

          <Typography sx={{ fontSize: 14, color: '#231F20', fontWeight: 400, fontFamily: 'Aileron, sans-serif' }} my={1} mt={2} mb={2}>
            {user?.creator?.mediaKit?.about}
          </Typography>
        </Stack>

        {/* Social Media Stats */}
        <Stack flex="1" alignItems={{ xs: 'start', md: 'flex-start' }} spacing={3}>
          {/* Divider for mobile screens only */}
          <Box
            sx={{
              display: { xs: 'block', sm: 'none' },
              width: '100%',
              height: '1px',
              backgroundColor: '#E7E7E7',
              mb: 2,
            }}
          />

          {/* Total Audience Section */}
          <Stack alignItems="flex-start" sx={{ pl: { xs: 1, sm: 0 } }}>
            <Typography
              variant="h2"
              color="#231F20"
              fontFamily="Aileron, sans-serif"
              fontWeight={600}
              component={m.div}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 1,
                type: 'spring',
              }}
              lineHeight={0.5}
              mb={1}
              align="left"
              sx={{ fontSize: { xs: '3rem', md: '4rem' } }}
            >
              0 {/* Change to actual number later */}
            </Typography>
            <Box
              component="span"
              sx={{
                color: '#231F20',
                fontSize: { xs: '2rem', md: '3rem' },
                fontFamily: 'Aileron, sans-serif',
                fontWeight: 300,
                letterSpacing: '0.05em',
                textAlign: 'left',
                display: 'block',
              }}
            >
              Total Audience
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            my={2}
            color="text.secondary"
            sx={{ pl: { xs: 1, sm: 0 } }}
          >
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:instagram" width={24} />}
              sx={{
                fontSize: '1rem',
                py: 1.5,
                px: 3,
                minWidth: '140px',
                height: '48px',
                borderWidth: 2,
                borderColor: currentTab === 'instagram' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
                // boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                ...(currentTab === 'instagram' && {
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                  boxShadow: 'none',
                  borderColor: '#1340FF',
                  borderWidth: 2,
                }),
              }}
              onClick={() => setCurrentTab('instagram')}
            >
              Instagram
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="ic:baseline-tiktok" width={24} />}
              sx={{
                fontSize: '1rem',
                py: 1.5,
                px: 3,
                minWidth: '140px',
                height: '48px',
                borderWidth: 2,
                borderColor: currentTab === 'tiktok' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
                // boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                ...(currentTab === 'tiktok' && {
                  color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                  boxShadow: 'none',
                  borderColor: '#1340FF',
                  borderWidth: 2,
                }),
              }}
              onClick={() => setCurrentTab('tiktok')}
            >
              Tiktok
            </Button>
          </Stack>

          {!smDown && (
            <Stack width="100%">
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="flex-start"
                spacing={6}
                flexWrap={{ xs: 'wrap', md: 'nowrap' }}
                sx={{
                  p: 2,
                }}
              >
                <Stack spacing={2}>
                  {/* Followers */}
                  <Stack alignItems="flex-start">
                    <Typography
                      variant="h3"
                      color="#1340FF"
                      fontFamily="Instrument Serif"
                      component={m.div}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 1,
                        type: 'spring',
                      }}
                      lineHeight={1}
                      mb={1}
                      align="left"
                      sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                    >
                      {socialMediaAnalytics.followers}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#1340FF"
                      fontFamily="Aileron, sans-serif"
                      fontWeight={600}
                      align="left"
                      sx={{ fontSize: { xs: '0.9rem', md: '1.3rem' } }}
                    >
                      Followers
                    </Typography>
                  </Stack>

                  {/* Divider */}
                  <Box
                    sx={{
                      width: 140,
                      height: '1px',
                      backgroundColor: '#1340FF',
                      mt: 3,
                      mb: 2,
                    }}
                  />

                  {/* Average likes */}
                  <Stack alignItems="flex-start">
                    <Typography
                      variant="h3"
                      color="#1340FF"
                      fontFamily="Instrument Serif"
                      component={m.div}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 1,
                        type: 'spring',
                      }}
                      lineHeight={1}
                      mb={1}
                      align="left"
                      sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                    >
                      {socialMediaAnalytics.averageLikes}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#1340FF"
                      fontFamily="Aileron, sans-serif"
                      fontWeight={600}
                      align="left"
                      sx={{ fontSize: { xs: '0.9rem', md: '1.3rem' } }}
                    >
                      Avg Likes
                    </Typography>
                  </Stack>
                </Stack>

                <Stack spacing={2}>
                  {/* Average Comments */}
                  <Stack alignItems="flex-start">
                    <Typography
                      variant="h3"
                      color="#1340FF"
                      fontFamily="Instrument Serif"
                      component={m.div}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 1,
                        type: 'spring',
                      }}
                      lineHeight={1}
                      mb={1}
                      align="left"
                      sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                    >
                      0 {/* Change to actual number later */}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#1340FF"
                      fontFamily="Aileron, sans-serif"
                      fontWeight={600}
                      align="left"
                      sx={{ fontSize: { xs: '0.9rem', md: '1.3rem' } }}
                    >
                      Avg Comments
                    </Typography>
                  </Stack>

                  {/* Divider */}
                  <Box
                    sx={{
                      width: 140,
                      height: '1px',
                      backgroundColor: '#1340FF',
                      mt: 3,
                      mb: 2,
                    }}
                  />

                  {/* Total Engagement */}
                  <Stack alignItems="flex-start">
                    <Typography
                      variant="h3"
                      color="#1340FF"
                      fontFamily="Instrument Serif"
                      component={m.div}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 1,
                        type: 'spring',
                      }}
                      lineHeight={1}
                      mb={1}
                      align="left"
                      sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                    >
                      {socialMediaAnalytics.engagement_rate}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#1340FF"
                      fontFamily="Aileron, sans-serif"
                      fontWeight={600}
                      align="left"
                      sx={{ fontSize: { xs: '0.9rem', md: '1.3rem' } }}
                    >
                      Total Engagement
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>

      {smDown && (
        <Stack spacing={3} sx={{ py: 2, my: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={1}
            sx={{ width: '100%', pl: 2 }}
          >
            {/* Followers */}
            <Stack alignItems="flex-start" sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                color="#1340FF"
                fontWeight={400}
                fontFamily="Instrument Serif"
                mb={1}
                align="left"
                sx={{ fontSize: { xs: '3rem', sm: '2.5rem' } }}
              >
                {socialMediaAnalytics.followers}
              </Typography>
              <Typography
                variant="caption"
                color="#1340FF"
                fontFamily="Aileron, sans-serif"
                fontWeight={600}
                align="left"
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Followers
              </Typography>
            </Stack>

            {/* Average Comments */}
            <Stack alignItems="flex-start" sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                color="#1340FF"
                fontWeight={400}
                fontFamily="Instrument Serif"
                mb={1}
                align="left"
                sx={{ fontSize: { xs: '3rem', sm: '2.5rem' } }}
              >
                0 {/* Change to actual number later */}
              </Typography>
              <Typography
                variant="caption"
                color="#1340FF"
                fontFamily="Aileron, sans-serif"
                fontWeight={600}
                align="left"
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Avg Comments
              </Typography>
            </Stack>

            {/* Average likes */}
            <Stack alignItems="flex-start" sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                color="#1340FF"
                fontWeight={400}
                fontFamily="Instrument Serif"
                mb={1}
                align="left"
                sx={{ fontSize: { xs: '3rem', sm: '2.5rem' } }}
              >
                {socialMediaAnalytics.averageLikes}
              </Typography>
              <Typography
                variant="caption"
                color="#1340FF"
                fontFamily="Aileron, sans-serif"
                fontWeight={600}
                align="left"
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Avg Likes
              </Typography>
            </Stack>

            {/* Total Engagement */}
            <Stack alignItems="flex-start" sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                color="#1340FF"
                fontWeight={400}
                fontFamily="Instrument Serif"
                mb={1}
                align="left"
                sx={{ fontSize: { xs: '3rem', sm: '2.5rem' } }}
              >
                {socialMediaAnalytics.engagement_rate}
              </Typography>
              <Typography
                variant="caption"
                color="#1340FF"
                fontFamily="Aileron, sans-serif"
                fontWeight={600}
                align="left"
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Total Engagement
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      )}

      <Divider sx={{ my: 3 }} />
      {/* Bottom View */}

      <Typography fontWeight={600} fontFamily="Aileron, sans-serif" fontSize="24px" mb={1}>
        Top Content {/* {socialMediaAnalytics?.username && `of ${socialMediaAnalytics?.username}`} */}
      </Typography>

      {/* {smDown && (
        <Stack direction="row" alignItems="center" spacing={1} my={2} color="text.secondary">
          <Button
            variant="outlined"
            startIcon={<Iconify icon="mdi:instagram" width={24} />}
            sx={{
              fontSize: '1rem',
              py: 1.5,
              px: 3,
              minWidth: '130px',
              height: '48px',
              borderWidth: 1,
              borderColor: currentTab === 'instagram' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              ...(currentTab === 'instagram' && {
                color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                boxShadow: 'none',
                borderColor: '#1340FF',
                borderWidth: 2,
              }),
            }}
            onClick={() => setCurrentTab('instagram')}
          >
            Instagram
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="ic:baseline-tiktok" width={24} />}
            sx={{
              fontSize: '1rem',
              py: 1.5,
              px: 3,
              minWidth: '130px',
              height: '48px',
              borderWidth: 1,
              borderColor: currentTab === 'tiktok' ? '#1340FF' : 'rgba(0, 0, 0, 0.12)',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              ...(currentTab === 'tiktok' && {
                color: theme.palette.mode === 'light' ? '#1340FF' : '#4e70ff',
                boxShadow: 'none',
                borderColor: '#1340FF',
                borderWidth: 2,
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
      )} */}

      <MediaKitSocial currentTab={currentTab} />
      {/* <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} /> */}
    </Container>
  );
};

export default MediaKitCreator;
