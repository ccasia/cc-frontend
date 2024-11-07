import * as Yup from 'yup';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Card, Grid, Stack, IconButton, InputAdornment } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const AccountSecurity = () => {
  const password = useBoolean();
  const [loading, setLoading] = useState(false);

  const ChangePassWordSchema = Yup.object().shape({
    oldPassword: Yup.string().required('Old Password is required'),
    newPassword: Yup.string()
      .required('New Password is required')
      .min(6, 'Password must be at least 6 characters')
      .test(
        'no-match',
        'New password must be different than old password',
        (value, { parent }) => value !== parent.oldPassword
      ),
    confirmNewPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'Passwords must match'),
  });

  const defaultValues = {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  const methods = useForm({ defaultValues, resolver: yupResolver(ChangePassWordSchema) });

  const {
    handleSubmit,
    formState: { isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const res = await axiosInstance.patch(endpoints.auth.changePass, data);
      setLoading(false);
      enqueueSnackbar(res?.data?.message);
      // toast.success(res?.data?.message);
      methods.reset(defaultValues);
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Card sx={{ p: 3 }}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12} lg={12}>
            <RHFTextField
              name="oldPassword"
              label="Old Password"
              type={password.value ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={password.onToggle} edge="end">
                      <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <RHFTextField
              name="newPassword"
              label="New Password"
              type={password.value ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={password.onToggle} edge="end">
                      <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText={
                <Stack component="span" direction="row" alignItems="center">
                  <Iconify icon="eva:info-fill" width={16} sx={{ mr: 0.5 }} /> Password must be
                  minimum 6+
                </Stack>
              }
            />
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <RHFTextField
              name="confirmNewPassword"
              label="Confirm Password"
              type={password.value ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={password.onToggle} edge="end">
                      <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12} sx={{ textAlign: 'end' }}>
            <LoadingButton
              type="submit"
              variant="outlined"
              loading={loading}
              disabled={!isDirty}
              size="small"
            >
              Save Changes
            </LoadingButton>
          </Grid>
        </Grid>
      </FormProvider>
    </Card>
  );
};

export default AccountSecurity;
