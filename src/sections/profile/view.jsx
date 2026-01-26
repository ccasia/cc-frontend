import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useTheme } from '@emotion/react';
import { yupResolver } from '@hookform/resolvers/yup';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Grid,
  alpha,
  Stack,
  Avatar,
  Button,
  MenuItem,
  Container,
  Typography,
  ListItemText,
  InputAdornment,
  CircularProgress,
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

import CreatorProfile from 'src/sections/creator/profile/general';

import API from './api';
import UploadPhoto from './dropzone';
import AccountSecurity from './security';
import ClientProfile from './client-profile';
import ChildAccounts from './child-accounts';
import CampaignSettingsTab from './campaign-settings';
import { Billing } from '../creator/profile/billing';
import Preference from '../creator/profile/preferences';
import AccountSocialLinks from '../creator/profile/social';
import PaymentFormProfile from '../creator/profile/payment-form';
import AccountNotifications from '../creator/profile/notification';

// import x from '../creator/profile/notification';

dayjs.extend(localizedFormat);

const Profile = () => {
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const theme = useTheme();
  const { user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  const [image, setImage] = useState(null);
  const { section } = useParams();

  // Determine current tab based on URL path
  const getTabFromPath = useCallback(() => {
    const path = location.pathname;

    if (path.includes('/security')) return 'security';
    if (path.includes('/api')) return 'api';
    if (path.includes('/campaign-settings')) return 'campaignSettings';
    if (path.includes('/socials')) return 'Social Links';
    if (path.includes('/payment')) return 'paymentForm';
    if (path.includes('/billing')) return 'Billing';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/preference')) return 'preference';
    if (path.includes('/client')) return 'client';
    if (path.includes('/accounts')) return 'accounts';

    // Default to general/account tab
    if (user?.role === 'client') return 'client';
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

  const profileCompletion = useMemo(() => {
    const account = {
      name: user?.name,
      pronounce: user?.creator?.pronounce,
      phoneNumber: user?.phoneNumber,
      email: user?.email,
      cor: user?.country,
      city: user?.city,
      address: user?.creator?.address,
      employementStatus: user?.creator?.employment,
      birthDate: user?.creator?.birthDate,
      aboutMe: user?.creator?.mediaKit?.about,
    };

    const preferences = {
      languages: user?.creator?.languages,
      interests: user?.creator?.interests,
    };

    const socials = {
      isTikTokConnected: user?.creator?.isTiktokConnected,
      isInstagramConnected: user?.creator?.isFacebookConnected,
    };

    const payment = {
      countryOfBank: user?.paymentForm?.countryOfBank,
      bankName: user?.paymentForm?.bankName,
      accountHolderName: user?.paymentForm?.bankAccountName,
      accountNumber: user?.paymentForm?.bankAccountNumber,
      icNumber: user?.paymentForm?.icNumber,
    };

    const combinedProfile = {
      ...account,
      ...preferences,
      ...socials,
      ...payment,
    };

    const totalFields = Object.keys(combinedProfile).length;

    const filledFields = Object.values(combinedProfile).filter((value) => {
      if (Array.isArray(value)) return value.length > 0; // array fields (e.g., languages, interests)
      if (typeof value === 'boolean') return value !== false; // allow boolean fields like isTikTokConnected
      return value !== undefined && value !== null && value !== '';
    }).length;

    const completionPercentage = Math.round((filledFields / totalFields) * 100);

    return completionPercentage;
  }, [user]);

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

  const handleTabClick = (event) => {
    if (window.innerWidth >= 900) return;

    const tabElement = event.currentTarget;
    const container = scrollContainerRef.current;

    if (tabElement && container) {
      const scrollLeft = tabElement.offsetLeft;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  };

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
    <Box sx={{ position: 'relative', width: '100%', mb: 3 }}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          paddingRight: { xs: '40px', md: 0 },
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
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
            whiteSpace: 'nowrap',
            flexShrink: 0,
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

        {(user?.admin?.role?.name === 'Finance' || user?.role === 'superadmin') && (
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
              whiteSpace: 'nowrap',
              flexShrink: 0,
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

        {(user?.role === 'superadmin' || user?.admin?.role?.name === 'CSL') && (
          <Button
            component={Link}
            to={paths.dashboard.user.profileTabs.campaignSettings}
            disableRipple
            size="large"
            sx={{
              px: 0.5,
              py: 0.5,
              pb: 0.5,
              ml: 2,
              minWidth: 'fit-content',
              color: currentTab === 'campaignSettings' ? '#221f20' : '#8e8e93',
              position: 'relative',
              fontSize: '1.05rem',
              fontWeight: 650,
              whiteSpace: 'nowrap',
              flexShrink: 0,
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
                width: currentTab === 'campaignSettings' ? '100%' : '0%',
                bgcolor: '#1340ff',
                transform: 'scaleX(1)',
                transformOrigin: 'left',
              },
              '&:hover': {
                bgcolor: 'transparent',
                '&::after': {
                  width: '100%',
                  opacity: currentTab === 'campaignSettings' ? 1 : 0.5,
                },
              },
            }}
            startIcon={<Iconify icon="solar:settings-bold" width={20} />}
          >
            Campaign Settings
          </Button>
        )}
      </Stack>

      {/* Indicator for more tabs */}
      <Box
        sx={{
          position: 'absolute',
          right: { xs: '15px', sm: '20px', md: 0 },
          top: 0,
          height: '100%',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,1) 100%)',
          width: { xs: '80px', sm: '100px' },
          pointerEvents: 'none',
          display: { xs: 'block', md: 'none' },
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: { xs: 5, sm: 10 },
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: '50%',
            width: 24,
            height: 24,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} color="#1340ff" />
        </Box>
      </Box>
    </Box>
  );

  const CreatorTabs = (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        mb: 3,
        overflow: 'hidden',
      }}
    >
      {/* Separate divider positioned below the tabs */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          bgcolor: 'divider',
          zIndex: 5,
        }}
      />

      <Stack
        ref={scrollContainerRef}
        direction="row"
        spacing={0.5}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          maskImage: {
            xs: 'linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)',
            md: 'none', // No mask on larger screens
          },
          // Don't forget the WebKit prefix for Safari
          WebkitMaskImage: {
            xs: 'linear-gradient(to right, transparent 0%, black 10px, black calc(100% - 80px), transparent 100%)',
            md: 'none',
          },
          paddingRight: { xs: '80px', sm: '100px', md: 0 },
          paddingBottom: '1px',
        }}
        onScroll={(e) => {
          if (window.innerWidth >= 900) return;

          const element = e.target;
          const leftArrow = document.getElementById('creator-tabs-left-arrow');
          const rightArrow = document.getElementById('creator-tabs-right-arrow');

          // Show left arrow when scrolled right
          if (leftArrow) {
            leftArrow.style.display = element.scrollLeft > 20 ? 'flex' : 'none';
          }

          // Show right arrow when not scrolled to the end
          if (rightArrow) {
            const isAtEnd =
              Math.ceil(element.scrollLeft + element.clientWidth) >= element.scrollWidth - 10;
            rightArrow.style.display = isAtEnd ? 'none' : 'flex';
          }
        }}
      >
        <Button
          onClick={handleTabClick}
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
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
          onClick={handleTabClick}
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
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
          onClick={handleTabClick}
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
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
          onClick={handleTabClick}
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
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
          onClick={handleTabClick}
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
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
          {user?.paymentForm?.status === 'rejected' && `⚠️`} Payment
        </Button>
      </Stack>

      {/* Left arrow indicator */}
      {/* <Box
        id="creator-tabs-left-arrow"
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          background:
            'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 60%, rgba(255,255,255,0.3) 100%)',
          width: { xs: '50px', sm: '60px' },
          pointerEvents: 'none',
          display: 'none',
          zIndex: 1,
          '@media (min-width: 900px)': {
            display: 'none !important',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: { xs: 5, sm: 10 },
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: '50%',
            width: 24,
            height: 24,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Iconify icon="eva:arrow-ios-back-fill" width={16} color="#1340ff" />
        </Box>
      </Box> */}

      {/* Right arrow indicator */}
      {/* <Box
        id="creator-tabs-right-arrow"
        sx={{
          position: 'absolute',
          right: { xs: '15px', sm: '20px', md: 0 },
          top: 0,
          height: '100%',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,1) 100%)',
          width: { xs: '80px', sm: '100px' },
          pointerEvents: 'none',
          display: { xs: 'flex', md: 'none' },
          zIndex: 1,
          '@media (min-width: 900px)': {
            display: 'none !important',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: { xs: 5, sm: 10 },
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: '50%',
            width: 24,
            height: 24,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} color="#1340ff" />
        </Box>
      </Box> */}
    </Box>
  );

  const ClientTabs = (
    <Box sx={{ position: 'relative', width: '100%', mb: 3 }}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          paddingRight: { xs: '40px', md: 0 },
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
          to={paths.dashboard.user.profileTabs.client}
          disableRipple
          size="large"
          sx={{
            px: 0.5,
            py: 0.5,
            pb: 0.5,
            minWidth: 'fit-content',
            color: currentTab === 'client' ? '#221f20' : '#8e8e93',
            position: 'relative',
            fontSize: '1.05rem',
            fontWeight: 650,
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
              width: currentTab === 'client' ? '100%' : '0%',
              bgcolor: '#1340ff',
              transform: 'scaleX(1)',
              transformOrigin: 'left',
            },
            '&:hover': {
              bgcolor: 'transparent',
              '&::after': {
                width: '100%',
                opacity: currentTab === 'client' ? 1 : 0.5,
              },
            },
          }}
          startIcon={<Iconify icon="mdi:office-building" width={20} />}
        >
          Profile
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
            whiteSpace: 'nowrap',
            flexShrink: 0,
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

        {/* Only show Accounts tab for parent clients (not child accounts) */}
        {user?.role === 'client' && user?.client && user?.isChildAccount !== true && (
          <Button
            component={Link}
            to={paths.dashboard.user.profileTabs.accounts}
            disableRipple
            size="large"
            sx={{
              px: 0.5,
              py: 0.5,
              pb: 0.5,
              ml: 2,
              minWidth: 'fit-content',
              color: currentTab === 'accounts' ? '#221f20' : '#8e8e93',
              position: 'relative',
              fontSize: '1.05rem',
              fontWeight: 650,
              whiteSpace: 'nowrap',
              flexShrink: 0,
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
                width: currentTab === 'accounts' ? '100%' : '0%',
                bgcolor: '#1340ff',
                transform: 'scaleX(1)',
                transformOrigin: 'left',
              },
              '&:hover': {
                bgcolor: 'transparent',
                '&::after': {
                  width: '100%',
                  opacity: currentTab === 'accounts' ? 1 : 0.5,
                },
              },
            }}
            startIcon={<Iconify icon="mdi:account-group" width={20} />}
          >
            Accounts
          </Button>
        )}
      </Stack>

      {/* Indicator for more tabs */}
      {/* <Box
        sx={{
          position: 'absolute',
          right: { xs: '15px', sm: '20px', md: 0 },
          top: 0,
          height: '100%',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,1) 100%)',
          width: { xs: '80px', sm: '100px' },
          pointerEvents: 'none',
          display: { xs: 'block', md: 'none' },
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: { xs: 5, sm: 10 },
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: '50%',
            width: 24,
            height: 24,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} color="#1340ff" />
        </Box>
      </Box> */}
    </Box>
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
      {(user?.admin?.role?.name === 'Finance' || user?.role === 'superadmin') &&
        currentTab === 'api' && <API />}
      {(user?.role === 'superadmin' || user?.admin?.role?.name === 'CSL') &&
        currentTab === 'campaignSettings' && <CampaignSettingsTab />}
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

  const clientContents = (
    <>
      {currentTab === 'client' && <ClientProfile />}
      {currentTab === 'security' && <AccountSecurity />}
      {currentTab === 'accounts' && user?.role === 'client' && user?.client && user?.isChildAccount !== true && <ChildAccounts />}
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
      {/* eslint-disable-next-line no-nested-ternary */}
      {['admin', 'superadmin'].includes(user?.role)
        ? Admintabs
        : user?.role === 'client'
          ? ClientTabs
          : CreatorTabs}

      {profileCompletion < 100 && user?.role === 'creator' ? (
        <Stack mb={2} direction="row" alignItems="center" spacing={2}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              thickness={4}
              value={profileCompletion}
              variant="determinate"
              size={60}
              sx={{
                color: '#2944B7',
                strokeLinecap: 'round',
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="subtitle2">{`${Math.round(profileCompletion)}%`}</Typography>
            </Box>
          </Box>
          <ListItemText
            primary="You're almost there!"
            secondary="Complete your account now to get selected for campaigns"
            primaryTypographyProps={{
              fontFamily: theme.typography.fontSecondaryFamily,
              variant: 'body1',
              fontSize: 25,
            }}
            secondaryTypographyProps={{
              fontSize: { xs: 13, sm: 14, md: 'inherit' },
              color: '#231F20',
            }}
          />
        </Stack>
      ) : (
        user?.role === 'creator' && (
          <Stack mb={2} direction="row" alignItems="center" spacing={2}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                thickness={4}
                value={profileCompletion}
                variant="determinate"
                size={60}
                sx={{
                  color: '#2944B7',
                  strokeLinecap: 'round',
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="subtitle2">{`${Math.round(profileCompletion)}%`}</Typography>
              </Box>
            </Box>
            <ListItemText
              primary="Congratulations!"
              secondary="Your account now has a higher chance to get selected for campaigns!"
              primaryTypographyProps={{
                fontFamily: theme.typography.fontSecondaryFamily,
                variant: 'body1',
                fontSize: 25,
              }}
            />
          </Stack>
        )
      )}

      {(() => {
        if (['admin', 'superadmin'].includes(user?.role)) {
          return adminContents;
        }
        if (user?.role === 'client') {
          return clientContents;
        }
        return creatorContents;
      })()}

      {/* <Toaster /> */}
    </Container>
  );
};

export default Profile;
