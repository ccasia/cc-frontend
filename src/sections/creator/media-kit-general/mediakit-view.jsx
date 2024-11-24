import { m } from 'framer-motion';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  useTheme,
  Container,
  Typography,
  ListItemText,
  CircularProgress,
} from '@mui/material';

import { useSWRGetCreatorByID } from 'src/hooks/use-get-creators';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import MediaKitSocial from '../media-kit-creator-view/media-kit-social/view';
import { formatNumber } from '../media-kit-creator-view/media-kit-social/media-kit-social-content/view-instagram';

// eslint-disable-next-line react/prop-types
const MediaKit = ({ id, noBigScreen }) => {
  // const settings = useSettingsContext();
  const theme = useTheme();
  const { creator, isLoading, isError } = useSWRGetCreatorByID(id);

  // const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTab, setCurrentTab] = useState('instagram');
  const [data, setData] = useState();

  const socialMediaAnalytics = useMemo(() => {
    if (!isLoading) {
      const {
        creator: { socialMediaData: social },
      } = creator;

      setData(social);

      if (currentTab === 'instagram') {
        return {
          followers: social?.instagram?.data?.followers,
          engagement_rate: social?.instagram?.data?.engagement_rate,
          averageLikes: social?.instagram?.data?.user_performance?.avg_likes_per_post,
        };
      }

      if (currentTab === 'tiktok') {
        return {
          followers: social?.tiktok?.data?.followers,
          engagement_rate: social?.tiktok?.data?.engagement_rate,
          averageLikes: social?.tiktok?.data?.user_performance?.avg_likes_per_post,
        };
      }
    }

    return {
      followers: 0,
      engagement_rate: 0,
      averageLikes: 0,
    };
  }, [currentTab, creator, isLoading]);

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
          src={creator?.photoURL}
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
            {creator?.name}
          </Typography>
          {/* <Iconify icon="material-symbols:verified" color="info.main" width={20} /> */}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {creator?.creator?.pronounce}
          </Typography>
          <Iconify icon="mdi:dot" color="text.secondary" />
          <Typography variant="body2" color="text.secondary">
            {creator?.country}
          </Typography>
          <Iconify icon="mdi:dot" color="text.secondary" />
          <Typography variant="body2" color="text.secondary">
            {creator?.email}
          </Typography>
        </Stack>
      </Stack>

      <Typography variant="subtitle2" my={1}>
        {creator?.creator?.mediaKit?.about}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} mb={2} flexWrap="wrap">
        {creator?.creator?.interests.map((interest) => (
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

      {!isLoading && (
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
