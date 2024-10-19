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
  CircularProgress,
} from '@mui/material';

import { useSWRGetCreatorByID } from 'src/hooks/use-get-creators';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import AvatarIcon from 'src/components/avatar-icon/avatar-icon';

import MediaKitSocial from '../media-kit-creator-view/media-kit-social/view';
import { formatNumber } from '../media-kit-creator-view/media-kit-social/media-kit-social-content/view-instagram';

// eslint-disable-next-line react/prop-types
const MediaKit = ({ id, noBigScreen }) => {
  const settings = useSettingsContext();
  const theme = useTheme();
  const { creator, isLoading, isError } = useSWRGetCreatorByID(id);

  const [isFullScreen, setIsFullScreen] = useState(false);
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

  const toggle = () => {
    setIsFullScreen(!isFullScreen);
  };

  const styleFullScreen = {
    minWidth: '100vw',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10000,
    bgcolor: theme.palette.grey[900],
  };

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
    // <Container
    //   maxWidth={settings.themeStretch ? false : 'lg'}
    //   sx={
    //     isFullScreen
    //       ? {
    //           ...styleFullScreen,
    //         }
    //       : {
    //           border: `dashed 1px ${theme.palette.divider}`,
    //           borderRadius: 2,
    //           position: 'relative',
    //         }
    //   }
    // >
    //   {!noBigScreen && (
    //     <Box
    //       component="div"
    //       sx={{
    //         position: 'absolute',
    //         top: 20,
    //         right: 20,
    //         cursor: 'pointer',
    //         zIndex: 1000,
    //       }}
    //       onClick={toggle}
    //     >
    //       {isFullScreen ? (
    //         <Iconify icon="akar-icons:reduce" />
    //       ) : (
    //         <Iconify icon="akar-icons:enlarge" />
    //       )}
    //     </Box>
    //   )}
    //   <Card
    //     sx={{
    //       mb: 3,
    //       border: 'none',
    //       boxShadow: 'none',
    //       bgcolor: 'transparent',
    //     }}
    //   >
    //     <MediaKitCover user={creator} />

    //     <Tabs
    //       value={currentTab}
    //       onChange={(e, val) => setCurrentTab(val)}
    //       variant="fullWidth"
    //       sx={{
    //         border: `dashed 1px ${theme.palette.divider}`,
    //         borderRadius: 2,
    //         p: 2,
    //         [`& .Mui-selected`]: {
    //           bgcolor:
    //             settings.themeMode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
    //           borderRadius: 1.5,
    //           border: 1,
    //           borderColor: theme.palette.divider,
    //         },
    //       }}
    //       TabIndicatorProps={{
    //         sx: {
    //           display: 'none',
    //         },
    //       }}
    //     >
    //       <Tab
    //         value="instagram"
    //         label="Instagram"
    //         icon={<Iconify icon="skill-icons:instagram" />}
    //       />
    //       <Tab value="tiktok" label="Tiktok" icon={<Iconify icon="logos:tiktok-icon" />} />
    //       <Tab value="partnership" label="Partnerships" />
    //     </Tabs>
    //     {creator && <MediaKitSocial currentTab={currentTab} user={creator} />}
    //   </Card>
    // </Container>
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
          src={creator?.photoURL}
        />
      </Stack>

      <Stack my={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h3" fontWeight="bold">
            {creator?.name}
          </Typography>
          <Iconify icon="material-symbols:verified" color="info.main" width={20} />
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

      <Stack direction="row" alignItems="center" spacing={1} my={2.5}>
        {creator?.creator?.interests.map((interest) => (
          <Label key={interest?.id}>{interest.name.toUpperCase()}</Label>
        ))}
      </Stack>

      {!isLoading && (
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
      )}

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

      <MediaKitSocial currentTab={currentTab} data={data} isLoading={isLoading} />
    </Container>
  );
};

export default MediaKit;

// export default withPermission(['read'], 'admin', MediaKit);
