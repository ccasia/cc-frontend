import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Tab,
  Box,
  Card,
  Tabs,
  Stack,
  Button,
  Dialog,
  useTheme,
  Container,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { grey } from 'src/theme/palette';
import { useAuthContext } from 'src/auth/hooks';
import { useGetSocialMedia, fetchSocialMediaData } from 'src/api/socialMedia';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import { useSettingsContext } from 'src/components/settings';
import FormProvider from 'src/components/hook-form/form-provider';

import MediaKitCover from './mediakit-cover';
import MediaKitSetting from './media-kit-setting';
import MediaKitSocial from './media-kit-social/view';

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
      maxWidth={settings.themeStretch ? false : 'lg'}
      sx={
        isFullScreen
          ? {
              ...styleFullScreen,
            }
          : {
              border: `dashed 1px ${theme.palette.divider}`,
              borderRadius: 2,
              position: 'relative',
            }
      }
    >
      <Box
        component="div"
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          cursor: 'pointer',
          zIndex: 1000,
          '&:hover': {
            color: theme.palette.grey[400],
          },
        }}
        onClick={toggle}
      >
        {isFullScreen ? (
          <Iconify icon="akar-icons:reduce" />
        ) : (
          <Iconify icon="akar-icons:enlarge" />
        )}
      </Box>
      <Box
        component="div"
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {!isFullScreen && (
          <Iconify
            onClick={() => setOpenSetting(true)}
            icon="uil:setting"
            sx={{
              '&:hover': {
                color: theme.palette.grey[400],
              },
            }}
          />
        )}
        {!isLoading && (!data?.tiktok || !data?.instagram) ? (
          <Button
            size="small"
            variant="contained"
            startIcon={<Iconify icon="carbon:fetch-upload-cloud" />}
            onClick={() => {
              const res = checkSocialMediaUsername();
              if (res) {
                dialog.onTrue();
              } else {
                fetchNewSocialMediaData();
              }
            }}
          >
            {loading.value ? 'Loading...' : 'Refresh User data'}
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
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
            {loading.value ? 'Loading...' : 'Refresh User data'}
          </Button>
        )}
      </Box>
      <Card
        sx={{
          mb: 3,
          border: 'none',
          boxShadow: 'none',
          bgcolor: 'transparent',
        }}
      >
        <MediaKitCover user={user} />

        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          variant="fullWidth"
          sx={{
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

        <MediaKitSocial currentTab={currentTab} data={data} isLoading={isLoading} />
      </Card>

      <MediaKitSetting open={openSetting} handleClose={handleClose} user={user} />

      <Dialog open={dialog.value} maxWidth="sm" fullWidth>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <DialogTitle>Please complete your profile</DialogTitle>
          <DialogContent>
            {/* <DialogContentText>Please complete your profile</DialogContentText> */}
            <Stack spacing={3} mt={2}>
              <RHFTextField
                name="instagram"
                label="Instagram Username"
                placeholder="Eg: cristiano"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="mdi:instagram" width={20} />
                    </InputAdornment>
                  ),
                }}
              />
              <RHFTextField
                name="tiktok"
                label="Tiktok Username"
                placeholder="Eg: cristiano"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="ic:baseline-tiktok" width={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button size="small" variant="outlined" onClick={dialog.onFalse}>
              Cancel
            </Button>
            <Button size="small" variant="contained" type="submit">
              Save
            </Button>
          </DialogActions>
        </FormProvider>
      </Dialog>
    </Container>
  );
};

export default MediaKitCreator;
