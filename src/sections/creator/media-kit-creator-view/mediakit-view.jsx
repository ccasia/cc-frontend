import * as yup from 'yup';
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
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { grey } from 'src/theme/palette';
import { useAuthContext } from 'src/auth/hooks';
import { useGetSocialMedia, fetchSocialMediaData } from 'src/api/socialMedia';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import AvatarIcon from 'src/components/avatar-icon/avatar-icon';

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

  // return (
  //   <Container
  //     maxWidth={settings.themeStretch ? false : 'lg'}
  //     sx={
  //       isFullScreen
  //         ? {
  //             ...styleFullScreen,
  //           }
  //         : {
  //             border: `dashed 1px ${theme.palette.divider}`,
  //             borderRadius: 2,
  //             position: 'relative',
  //           }
  //     }
  //   >
  //     <Box
  //       component="div"
  //       sx={{
  //         position: 'absolute',
  //         top: 20,
  //         right: 20,
  //         cursor: 'pointer',
  //         zIndex: 1000,
  //         '&:hover': {
  //           color: theme.palette.grey[400],
  //         },
  //       }}
  //       onClick={toggle}
  //     >
  //       {isFullScreen ? (
  //         <Iconify icon="akar-icons:reduce" />
  //       ) : (
  //         <Iconify icon="akar-icons:enlarge" />
  //       )}
  //     </Box>
  //     <Box
  //       component="div"
  //       sx={{
  //         position: 'absolute',
  //         top: 20,
  //         left: 20,
  //         cursor: 'pointer',
  //         zIndex: 1000,
  //         display: 'flex',
  //         flexDirection: 'row',
  //         alignItems: 'center',
  //         gap: 1,
  //       }}
  //     >
  //       {!isFullScreen && (
  //         <Iconify
  //           onClick={() => setOpenSetting(true)}
  //           icon="uil:setting"
  //           sx={{
  //             '&:hover': {
  //               color: theme.palette.grey[400],
  //             },
  //           }}
  //         />
  //       )}
  //       {!isLoading && (!data?.tiktok || !data?.instagram) ? (
  //         <Button
  //           size="small"
  //           variant="contained"
  //           startIcon={<Iconify icon="carbon:fetch-upload-cloud" />}
  //           onClick={() => {
  //             const res = checkSocialMediaUsername();
  //             if (res) {
  //               dialog.onTrue();
  //             } else {
  //               fetchNewSocialMediaData();
  //             }
  //           }}
  //         >
  //           {loading.value ? 'Loading...' : 'Refresh User Data'}
  //         </Button>
  //       ) : (
  //         <Button
  //           size="small"
  //           variant="contained"
  //           startIcon={<Iconify icon="material-symbols:refresh" />}
  //           onClick={() => {
  //             const res = checkSocialMediaUsername();
  //             if (res) {
  //               dialog.onTrue();
  //             } else {
  //               fetchNewSocialMediaData();
  //             }
  //           }}
  //         >
  //           {loading.value ? 'Loading...' : 'Refresh User Data'}
  //         </Button>
  //       )}
  //     </Box>
  //     <Card
  //       sx={{
  //         mb: 3,
  //         border: 'none',
  //         boxShadow: 'none',
  //         bgcolor: 'transparent',
  //         mt: 4,
  //       }}
  //     >
  //       <MediaKitCover user={user} />

  //       <Tabs
  //         value={currentTab}
  //         onChange={(e, val) => setCurrentTab(val)}
  //         variant="fullWidth"
  //         sx={{
  //           border: `dashed 1px ${theme.palette.divider}`,
  //           borderRadius: 2,
  //           p: 2,
  //           [`& .Mui-selected`]: {
  //             bgcolor:
  //               settings.themeMode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
  //             borderRadius: 1.5,
  //             border: 1,
  //             borderColor: theme.palette.divider,
  //           },
  //         }}
  //         TabIndicatorProps={{
  //           sx: {
  //             display: 'none',
  //           },
  //         }}
  //       >
  //         <Tab
  //           value="instagram"
  //           label="Instagram"
  //           icon={<Iconify icon="skill-icons:instagram" />}
  //         />
  //         <Tab value="tiktok" label="Tiktok" icon={<Iconify icon="logos:tiktok-icon" />} />
  //         <Tab value="partnership" label="Partnerships" />
  //       </Tabs>

  //       <MediaKitSocial currentTab={currentTab} data={data} isLoading={isLoading} />
  //     </Card>

  //     <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} />

  //     <Dialog open={dialog.value} maxWidth="sm" fullWidth>
  //       <FormProvider methods={methods} onSubmit={onSubmit}>
  //         <DialogTitle>Please complete your profile</DialogTitle>
  //         <DialogContent>
  //           {/* <DialogContentText>Please complete your profile</DialogContentText> */}
  //           <Stack spacing={3} mt={2}>
  //             <RHFTextField
  //               name="instagram"
  //               label="Instagram Username"
  //               placeholder="Eg: cristiano"
  //               InputProps={{
  //                 startAdornment: (
  //                   <InputAdornment position="start">
  //                     <Iconify icon="mdi:instagram" width={20} />
  //                   </InputAdornment>
  //                 ),
  //               }}
  //             />
  //             <RHFTextField
  //               name="tiktok"
  //               label="Tiktok Username"
  //               placeholder="Eg: cristiano"
  //               InputProps={{
  //                 startAdornment: (
  //                   <InputAdornment position="start">
  //                     <Iconify icon="ic:baseline-tiktok" width={20} />
  //                   </InputAdornment>
  //                 ),
  //               }}
  //             />
  //           </Stack>
  //         </DialogContent>
  //         <DialogActions>
  //           <Button size="small" variant="outlined" onClick={dialog.onFalse}>
  //             Cancel
  //           </Button>
  //           <Button size="small" variant="contained" type="submit">
  //             Save
  //           </Button>
  //         </DialogActions>
  //       </FormProvider>
  //     </Dialog>
  //   </Container>
  // );

  return (
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
          src={user?.photoURL}
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
            {user?.name}
          </Typography>
          <Iconify icon="material-symbols:verified" color="info.main" width={20} />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {user?.creator?.pronounce}
          </Typography>
          .
          <Typography variant="body2" color="text.secondary">
            {user?.country}
          </Typography>
          .
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} my={2.5}>
        {user?.creator?.interests.map((interest) => (
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
              <Typography variant="h3">
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
              <Typography variant="h3">
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
              <Typography variant="h3">
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

      <MediaKitSocial currentTab={currentTab} data={data} isLoading={isLoading} />
      <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} />
    </Container>
  );
};

export default MediaKitCreator;
