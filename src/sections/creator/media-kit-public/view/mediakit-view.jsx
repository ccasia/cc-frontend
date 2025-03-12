import { m } from 'framer-motion';
import React, { useMemo, useState } from 'react';

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

import { useResponsive } from 'src/hooks/use-responsive';
import { useSWRGetCreatorByID } from 'src/hooks/use-get-creators';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import MediaKitSocial from './media-kit-social-view';

// import MediaKitSocial from './media-kit-social/view';
// import { formatNumber } from '../media-kit/view-instagram';

// import MediaKitSocial from '../media-kit-creator-view/media-kit-social/view';
// import { formatNumber } from '../media-kit-creator-view/media-kit-social/media-kit-social-content/view-instagram';

const calculateEngagementRate = (totalLikes, followers) => {
  if (!(totalLikes || followers)) return null;
  return ((parseInt(totalLikes, 10) / parseInt(followers, 10)) * 100).toFixed(2);
};

// eslint-disable-next-line react/prop-types
const MediaKit = ({ id, noBigScreen }) => {
  const theme = useTheme();
  const smDown = useResponsive('down', 'sm');
  const { data, isLoading, isError } = useSWRGetCreatorByID(id);

  const [currentTab, setCurrentTab] = useState('instagram');

  const socialMediaAnalytics = useMemo(() => {
    if (currentTab === 'instagram') {
      return {
        followers: data?.creator?.instagramUser?.followers_count || 0,
        engagement_rate: `${
          calculateEngagementRate(
            data?.creator?.instagramUser?.instagramVideo?.reduce(
              (sum, acc) => sum + parseInt(acc.like_count, 10),
              0
            ),
            data?.creator?.instagramUser?.followers_count
          ) || 0
        }%`,
        averageLikes: data?.creator?.instagramUser?.average_like || 0,
        username: data?.creator?.instagramUser?.username,
      };
    }

    if (currentTab === 'tiktok') {
      return {
        followers: data?.creator?.tiktokUser?.follower_count || 0,
        engagement_rate: data?.creator?.tiktokUser?.follower_count || 0,
        averageLikes: data?.creator?.tiktokUser?.likes_count || 0,
      };
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [data, currentTab]);

  // const toggle = () => {
  //   setIsFullScreen(!isFullScreen);
  // };

  // const styleFullScreen = {
  //   minWidth: '100vw',
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   zIndex: 10000,
  //   bgcolor: theme.palette.grey[900],
  // };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <div>Error loading creator data</div>;
  }

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Avatar
          sx={{
            width: 100,
            height: 100,
          }}
          src={data?.photoURL}
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
            {data?.creator?.mediaKit?.displayName ?? data?.name}
          </Typography>
          {/* <Iconify icon="material-symbols:verified" color="info.main" width={20} /> */}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {data?.creator?.pronounce}
          </Typography>
          <Iconify icon="mdi:dot" color="text.secondary" />
          <Typography variant="body2" color="text.secondary">
            {data?.country}
          </Typography>
          <Iconify icon="mdi:dot" color="text.secondary" />
          <Typography variant="body2" color="text.secondary">
            {data?.email}
          </Typography>
        </Stack>
      </Stack>

      <Typography variant="subtitle2" my={1}>
        {data?.creator?.mediaKit?.about}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} mb={2} flexWrap="wrap">
        {data?.creator?.interests.map((interest) => (
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

      {/* <Stack
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
      </Stack> */}

      {smDown ? (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" spacing={1} alignItems="center">
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
              <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                <Avatar
                  sx={{
                    bgcolor: '#8A5AFE',
                    width: 35,
                    height: 35,
                  }}
                >
                  <Iconify icon="ic:sharp-people-alt" width={20} />
                </Avatar>

                <Typography variant="subtitle1">{socialMediaAnalytics.followers}</Typography>
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
              <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                <Avatar
                  sx={{
                    bgcolor: '#026D54',
                    width: 35,
                    height: 35,
                  }}
                >
                  <Iconify icon="mage:chart-up-fill" width={20} />
                </Avatar>
                <Typography variant="subtitle1">{socialMediaAnalytics.engagement_rate}</Typography>
              </Stack>
            </Box>

            {/* Average likes */}
            <Box
              sx={{
                width: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="center">
                <Avatar
                  sx={{
                    bgcolor: '#FF3500',
                    width: 35,
                    height: 35,
                  }}
                >
                  <Iconify icon="hugeicons:play-list-favourite-02" width={20} />
                </Avatar>
                <Typography variant="subtitle1">{socialMediaAnalytics.averageLikes}</Typography>
              </Stack>
            </Box>
          </Stack>
          <Divider sx={{ my: 1.5 }} />
        </>
      ) : (
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
                secondary={socialMediaAnalytics.followers}
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
                secondary={socialMediaAnalytics.engagement_rate}
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
                secondary={socialMediaAnalytics.averageLikes}
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
      )}

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

      <MediaKitSocial currentTab={currentTab} data={data} isLoading={isLoading} />
    </Container>
  );
};

export default MediaKit;

// export default withPermission(['read'], 'admin', MediaKit);
