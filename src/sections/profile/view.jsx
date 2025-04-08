import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useTheme } from '@emotion/react';
import { Toaster } from 'react-hot-toast';
import React, { useState, useCallback, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';
import {
  Tab,
  Grid,
  Card,
  Tabs,
  Stack,
  alpha,
  Avatar,
  MenuItem,
  Container,
  Typography,
  InputAdornment,
  Button,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { _userAbout } from 'src/_mock';
import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { RHFSelect } from 'src/components/hook-form/rhf-select';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import CreatorProfile from 'src/sections/creator/profile/general';

import API from './api';
import UploadPhoto from './dropzone';
import AccountSecurity from './security';
import { Billing } from '../creator/profile/billing';
import AccountSocialLinks from '../creator/profile/social';
import PaymentFormProfile from '../creator/profile/payment-form';
import AccountNotifications from '../creator/profile/notification';
import Preference from '../creator/profile/preferences';

// import x from '../creator/profile/notification';

dayjs.extend(localizedFormat);

const Profile = () => {
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const theme = useTheme();
  const { user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const { section } = useParams();

  // Determine current tab based on URL path
  const getTabFromPath = useCallback(() => {
    const path = location.pathname;

    if (path.includes('/security')) return 'security';
    if (path.includes('/api')) return 'api';
    if (path.includes('/socials')) return 'Social Links';
    if (path.includes('/payment')) return 'paymentForm';
    if (path.includes('/billing')) return 'Billing';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/preference')) return 'preference';

    // Default to general/account tab
    return ['admin', 'superadmin'].includes(user?.role) ? 'general' : 'general';
  }, [location.pathname, user?.role]);

  const [currentTab, setCurrentTab] = useState(section);

  // Update current tab when URL changes
  useEffect(() => {
    setCurrentTab(getTabFromPath());
  }, [location.pathname, getTabFromPath]);

  const UpdateUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    phoneNumber: Yup.string().required('Phone number is required'),
    country: Yup.string().required('Country is required'),
    designation: Yup.string(),
  });

  const defaultValues = {
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    designation: user?.admin?.role?.name || '',
    country: user?.country || '',
  };

  const methods = useForm({ defaultValues, resolver: yupResolver(UpdateUserSchema) });

  const { handleSubmit, setValue, watch } = methods;

  const countryValue = watch('country');

  const onDrop = useCallback(
    (e) => {
      const preview = URL.createObjectURL(e[0]);
      setImage(preview);
      setValue('image', e[0]);
    },
    [setValue]
  );

  // const handleChangeTab = useCallback((tab) => {
  //   if (['admin', 'superadmin'].includes(user?.role)) {
  //     switch (tab) {
  //       case 'general':
  //         navigate(paths.dashboard.user.profileTabs.general);
  //         break;
  //       case 'security':
  //         navigate(paths.dashboard.user.profileTabs.security);
  //         break;
  //       case 'api':
  //         navigate(paths.dashboard.user.profileTabs.api);
  //         break;
  //       default:
  //         navigate(paths.dashboard.user.profileTabs.general);
  //     }
  //   } else {
  //     switch (tab) {
  //       case 'general':
  //         navigate(paths.dashboard.user.profileTabs.account);
  //         break;
  //       case 'security':
  //         navigate(paths.dashboard.user.profileTabs.security);
  //         break;
  //       case 'Social Links':
  //         navigate(paths.dashboard.user.profileTabs.socials);
  //         break;
  //       case 'paymentForm':
  //         navigate(paths.dashboard.user.profileTabs.payment);
  //         break;
  //       case 'Billing':
  //         navigate(paths.dashboard.user.profileTabs.billing);
  //         break;
  //       case 'Notifications':
  //         navigate(paths.dashboard.user.profileTabs.notifications);
  //         break;
  //       default:
  //         navigate(paths.dashboard.user.profileTabs.account);
  //     }
  //   }
  // }, [navigate, user?.role]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch(
        endpoints.auth.updateProfileAdmin,
        { userId: user?.id, ...data },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      mutate(endpoints.notification.root);
      enqueueSnackbar('Successfully updated profile.');
      mutate(endpoints.auth.me);
      // toast.success('Successfully updated profile.');
    } catch (error) {
      enqueueSnackbar('Error in updating profile', { variant: 'error' });
      // toast.error('Error in updating profile');
    }
  });

  const renderPicture = (
    <Grid item xs={12} md={4} lg={4}>
      <Card sx={{ p: 1, textAlign: 'center' }}>
        <Stack alignItems="center" p={3} spacing={2}>
          <UploadPhoto onDrop={onDrop}>
            <Avatar
              sx={{
                width: 1,
                height: 1,
                borderRadius: '50%',
              }}
              src={image || user?.photoURL}
            />
          </UploadPhoto>
          <Typography display="block" color={theme.palette.grey['600']} sx={{ fontSize: 12 }}>
            Allowed *.jpeg, *.jpg, *.png, *.gif max size of 3 Mb
          </Typography>
          {/* <Button
            color="error"
            sx={{ mt: 3, width: '100%' }}
            onClick={() => {
              setImage(null);
            }}
          >
            Delete
          </Button> */}
        </Stack>
      </Card>
    </Grid>
  );

  const renderForm = (
    <Grid item xs={12} md={8} lg={8}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Card sx={{ p: 1 }}>
          <Stack alignItems="flex-end" sx={{ mt: 3 }}>
            <Grid container spacing={2} p={3}>
              <Grid item xs={12} sm={6} md={6} lg={6}>
                <RHFTextField name="name" label="Name" />
              </Grid>
              <Grid item xs={12} sm={6} md={6} lg={6}>
                <RHFTextField name="email" label="Email" />
              </Grid>
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <RHFTextField
                  name="phoneNumber"
                  label="Phone Number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        +
                        {countries
                          .filter((elem) => elem.label === countryValue)
                          .map((e) => e.phone)}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              {/* Change later Add more data */}

              <Grid item xs={12} sm={6} md={6} lg={6}>
                <RHFSelect name="designation" label="Designation" disabled>
                  <MenuItem defaultChecked>None</MenuItem>
                  <MenuItem value="CSM">Customer Success Manager</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="BD">Board Director</MenuItem>
                  <MenuItem value="Growth">Growth</MenuItem>
                </RHFSelect>
              </Grid>

              <Grid item xs={12} sm={6} md={6} lg={6}>
                <RHFAutocomplete
                  name="country"
                  type="country"
                  label="Country"
                  placeholder="Choose a country"
                  options={countries.map((option) => option.label)}
                  getOptionLabel={(option) => option}
                />
              </Grid>
              {/* {JSON.stringify(methods)} */}
              <Grid item xs={12} sm={12} md={12} lg={12} sx={{ textAlign: 'end' }}>
                <LoadingButton type="submit" disabled={!methods.formState.isDirty && !image}>
                  Save Changes
                </LoadingButton>
              </Grid>
            </Grid>
          </Stack>
        </Card>
      </FormProvider>
      <Typography
        variant="caption"
        display="block"
        gutterBottom
        textAlign="end"
        color="lightgrey"
        mt={2}
        sx={{ color: alpha(theme.palette.grey[600], 0.5) }}
      >
        Last updated: {dayjs(user?.user?.updatedAt).format('LLL')}
      </Typography>
    </Grid>
  );

  // Tabs
  const Admintabs = (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        position: 'relative',
        width: '100%',
        mb: { xs: 3, md: 5 },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgcolor: 'divider',
        },
      }}
    >
      <Button
        component={Link}
        to={paths.dashboard.user.profileTabs.general}
        disableRipple
        size="large"
        sx={{
          px: 0.5,
          py: 0.5,
          pb: 0.5,
          minWidth: 'fit-content',
          color: currentTab === 'general' ? '#221f20' : '#8e8e93',
          position: 'relative',
          fontSize: '1.05rem',
          fontWeight: 650,
          '&:focus': {
            outline: 'none',
            bgcolor: 'transparent',
          },
          '&:active': {
            bgcolor: 'transparent',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -0.5,
            left: 0,
            right: 0,
            height: '2px',
            width: currentTab === 'general' ? '100%' : '0%',
            bgcolor: '#1340ff',
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
          '&:hover': {
            bgcolor: 'transparent',
            '&::after': {
              width: '100%',
              opacity: currentTab === 'general' ? 1 : 0.5,
            },
          },
        }}
        startIcon={<Iconify icon="solar:user-id-bold" width={20} />}
      >
        General
      </Button>

      <Button
        component={Link}
        to={paths.dashboard.user.profileTabs.security}
        disableRipple
        size="large"
        sx={{
          px: 0.5,
          py: 0.5,
          pb: 0.5,
          ml: 2,
          minWidth: 'fit-content',
          color: currentTab === 'security' ? '#221f20' : '#8e8e93',
          position: 'relative',
          fontSize: '1.05rem',
          fontWeight: 650,
          '&:focus': {
            outline: 'none',
            bgcolor: 'transparent',
          },
          '&:active': {
            bgcolor: 'transparent',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -0.5,
            left: 0,
            right: 0,
            height: '2px',
            width: currentTab === 'security' ? '100%' : '0%',
            bgcolor: '#1340ff',
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
          '&:hover': {
            bgcolor: 'transparent',
            '&::after': {
              width: '100%',
              opacity: currentTab === 'security' ? 1 : 0.5,
            },
          },
        }}
        startIcon={<Iconify icon="ic:round-vpn-key" width={20} />}
      >
        Security
      </Button>

      {user?.admin?.role?.name === 'Finance' && (
        <Button
          component={Link}
          to={paths.dashboard.user.profileTabs.api}
          disableRipple
          size="large"
          sx={{
            px: 0.5,
            py: 0.5,
            pb: 0.5,
            ml: 2,
            minWidth: 'fit-content',
            color: currentTab === 'api' ? '#221f20' : '#8e8e93',
            position: 'relative',
            fontSize: '1.05rem',
            fontWeight: 650,
            '&:focus': {
              outline: 'none',
              bgcolor: 'transparent',
            },
            '&:active': {
              bgcolor: 'transparent',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -0.5,
              left: 0,
              right: 0,
              height: '2px',
              width: currentTab === 'api' ? '100%' : '0%',
              bgcolor: '#1340ff',
              transform: 'scaleX(1)',
              transformOrigin: 'left',
            },
            '&:hover': {
              bgcolor: 'transparent',
              '&::after': {
                width: '100%',
                opacity: currentTab === 'api' ? 1 : 0.5,
              },
            },
          }}
          startIcon={<Iconify icon="material-symbols:api" width={20} />}
        >
          API
        </Button>
      )}
    </Stack>
  );

  const CreatorTabs = (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        position: 'relative',
        width: '100%',
        mb: { xs: 3, md: 5 },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgcolor: 'divider',
        },
      }}
    >
      <Button
        component={Link}
        to={paths.dashboard.user.profileTabs.account}
        disableRipple
        size="large"
        sx={{
          px: 0.5,
          py: 0.5,
          pb: 0.5,
          minWidth: 'fit-content',
          color: currentTab === 'general' ? '#221f20' : '#8e8e93',
          position: 'relative',
          fontSize: '1.05rem',
          fontWeight: 650,
          '&:focus': {
            outline: 'none',
            bgcolor: 'transparent',
          },
          '&:active': {
            bgcolor: 'transparent',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -0.5,
            left: 0,
            right: 0,
            height: '2px',
            width: currentTab === 'general' ? '100%' : '0%',
            bgcolor: '#1340ff',
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
          '&:hover': {
            bgcolor: 'transparent',
            '&::after': {
              width: '100%',
              opacity: currentTab === 'general' ? 1 : 0.5,
            },
          },
        }}
      >
        Account
      </Button>

      <Button
        component={Link}
        to={paths.dashboard.user.profileTabs.preference}
        disableRipple
        size="large"
        sx={{
          px: 0.5,
          py: 0.5,
          pb: 0.5,
          ml: 2,
          minWidth: 'fit-content',
          color: currentTab === 'preference' ? '#221f20' : '#8e8e93',
          position: 'relative',
          fontSize: '1.05rem',
          fontWeight: 650,
          '&:focus': {
            outline: 'none',
            bgcolor: 'transparent',
          },
          '&:active': {
            bgcolor: 'transparent',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -0.5,
            left: 0,
            right: 0,
            height: '2px',
            width: currentTab === 'preference' ? '100%' : '0%',
            bgcolor: '#1340ff',
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
          '&:hover': {
            bgcolor: 'transparent',
            '&::after': {
              width: '100%',
              opacity: currentTab === 'preference' ? 1 : 0.5,
            },
          },
        }}
      >
        Preferences
      </Button>

      <Button
        component={Link}
        to={paths.dashboard.user.profileTabs.security}
        disableRipple
        size="large"
        sx={{
          px: 0.5,
          py: 0.5,
          pb: 0.5,
          ml: 2,
          minWidth: 'fit-content',
          color: currentTab === 'security' ? '#221f20' : '#8e8e93',
          position: 'relative',
          fontSize: '1.05rem',
          fontWeight: 650,
          '&:focus': {
            outline: 'none',
            bgcolor: 'transparent',
          },
          '&:active': {
            bgcolor: 'transparent',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -0.5,
            left: 0,
            right: 0,
            height: '2px',
            width: currentTab === 'security' ? '100%' : '0%',
            bgcolor: '#1340ff',
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
          '&:hover': {
            bgcolor: 'transparent',
            '&::after': {
              width: '100%',
              opacity: currentTab === 'security' ? 1 : 0.5,
            },
          },
        }}
      >
        Security
      </Button>

      <Button
        component={Link}
        to={paths.dashboard.user.profileTabs.socials}
        disableRipple
        size="large"
        sx={{
          px: 0.5,
          py: 0.5,
          pb: 0.5,
          ml: 2,
          minWidth: 'fit-content',
          color: currentTab === 'Social Links' ? '#221f20' : '#8e8e93',
          position: 'relative',
          fontSize: '1.05rem',
          fontWeight: 650,
          '&:focus': {
            outline: 'none',
            bgcolor: 'transparent',
          },
          '&:active': {
            bgcolor: 'transparent',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -0.5,
            left: 0,
            right: 0,
            height: '2px',
            width: currentTab === 'Social Links' ? '100%' : '0%',
            bgcolor: '#1340ff',
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
          '&:hover': {
            bgcolor: 'transparent',
            '&::after': {
              width: '100%',
              opacity: currentTab === 'Social Links' ? 1 : 0.5,
            },
          },
        }}
      >
        Socials
      </Button>

      <Button
        component={Link}
        to={paths.dashboard.user.profileTabs.payment}
        disableRipple
        size="large"
        sx={{
          px: 0.5,
          py: 0.5,
          pb: 0.5,
          ml: 2,
          minWidth: 'fit-content',
          color: currentTab === 'paymentForm' ? '#221f20' : '#8e8e93',
          position: 'relative',
          fontSize: '1.05rem',
          fontWeight: 650,
          '&:focus': {
            outline: 'none',
            bgcolor: 'transparent',
          },
          '&:active': {
            bgcolor: 'transparent',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -0.5,
            left: 0,
            right: 0,
            height: '2px',
            width: currentTab === 'paymentForm' ? '100%' : '0%',
            bgcolor: '#1340ff',
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
          '&:hover': {
            bgcolor: 'transparent',
            '&::after': {
              width: '100%',
              opacity: currentTab === 'paymentForm' ? 1 : 0.5,
            },
          },
        }}
      >
        Payment
      </Button>
    </Stack>
  );

  // Contents
  const adminContents = (
    <>
      {currentTab === 'security' && <AccountSecurity />}

      {currentTab === 'general' && (
        <Grid container spacing={3}>
          {renderPicture}

          {renderForm}
        </Grid>
      )}
      {user?.admin?.role?.name === 'Finance' && currentTab === 'api' && <API />}
      {/* {currentTab === 'api' && <API />} */}
    </>
  );

  const creatorContents = (
    <>
      {currentTab === 'security' && <AccountSecurity />}

      {currentTab === 'paymentForm' && <PaymentFormProfile user={user} />}

      {currentTab === 'general' && <CreatorProfile />}

      {currentTab === 'preference' && <Preference />}

      {currentTab === 'Billing' && <Billing />}

      {currentTab === 'Social Links' && <AccountSocialLinks socialLinks={_userAbout.socialLinks} />}

      {currentTab === 'Notifications' && <AccountNotifications />}
    </>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography
        variant="h2"
        sx={{
          mb: 0.2,
          mt: { lg: 2, xs: 2, sm: 2 },
          fontFamily: theme.typography.fontSecondaryFamily,
          fontWeight: 'normal',
        }}
      >
        Settings ⚙️
      </Typography>

      {['admin', 'superadmin'].includes(user?.role) ? Admintabs : CreatorTabs}
      {['admin', 'superadmin'].includes(user?.role) ? adminContents : creatorContents}

      <Toaster />
    </Container>
  );
};

export default Profile;
