import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useTheme } from '@emotion/react';
import { Toaster } from 'react-hot-toast';
import React, { useState, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { LoadingButton } from '@mui/lab';
import {
  Tab,
  Grid,
  Card,
  Tabs,
  Stack,
  alpha,
  Avatar,
  Button,
  MenuItem,
  Container,
  Typography,
  InputAdornment,
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

import UploadPhoto from './dropzone';
import AccountSecurity from './security';
import { Billing } from '../creator/profile/billing';
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
  const [currentTab, setCurrentTab] = useState('general');
  const [image, setImage] = useState(null);

  const UpdateUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    phoneNumber: Yup.string().required('Phone number is required'),
    country: Yup.string().required('Country is required'),
    designation: Yup.string().required('Address is required'),
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

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

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
          <Button color="error" sx={{ mt: 3, width: '100%' }}>
            Delete
          </Button>
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
                <RHFSelect name="designation" label="Designation">
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
    <Tabs
      value={currentTab}
      onChange={handleChangeTab}
      sx={{
        mb: { xs: 3, md: 5 },
      }}
    >
      <Tab
        label="General"
        value="general"
        icon={<Iconify icon="solar:user-id-bold" width={24} />}
      />
      <Tab
        label="Security"
        value="security"
        icon={<Iconify icon="ic:round-vpn-key" width={24} />}
      />
    </Tabs>
  );

  const CreatorTabs = (
    <Tabs
      value={currentTab}
      onChange={handleChangeTab}
      sx={{
        mb: { xs: 3, md: 5 },
      }}
    >
      <Tab
        label="General"
        value="general"
        icon={<Iconify icon="solar:user-id-bold" width={24} />}
      />

      {/* <Tab
        label="Social"
        value="Social Links"
        icon={<Iconify icon="solar:share-bold" width={24} />}
      /> */}
      <Tab
        label="Security"
        value="security"
        icon={<Iconify icon="ic:round-vpn-key" width={24} />}
      />
      <Tab
        label="Payment Form"
        value="paymentForm"
        icon={<Iconify icon="ic:baseline-payment" width={24} />}
      />
      {/* <Tab
        value="Billing"
        label="Billing"
        icon={<Iconify icon="solar:bill-list-bold" width={24} />}
      /> */}
      {/* <Tab
        value="Notifications"
        label="Notifications"
        icon={<Iconify icon="solar:bell-bing-bold" width={24} />}
      /> */}
    </Tabs>
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
    </>
  );

  const creatorContents = (
    <>
      {currentTab === 'security' && <AccountSecurity />}

      {currentTab === 'paymentForm' && <PaymentFormProfile user={user} />}

      {currentTab === 'general' && <CreatorProfile />}

      {currentTab === 'Billing' && <Billing />}

      {currentTab === 'Social Links' && <AccountSocialLinks socialLinks={_userAbout.socialLinks} />}

      {currentTab === 'Notifications' && <AccountNotifications />}
    </>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Profile"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'User',
            href: paths.dashboard.user,
          },
          { name: 'Profile' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {['admin', 'superadmin'].includes(user?.role) ? Admintabs : CreatorTabs}
      {['admin', 'superadmin'].includes(user?.role) ? adminContents : creatorContents}

      <Toaster />
    </Container>
  );
};

export default Profile;
