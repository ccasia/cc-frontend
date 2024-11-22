import * as Yup from 'yup';
import React, { useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import { Card, Grid, Stack, IconButton, Typography, InputAdornment } from '@mui/material';

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
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[@$!%*?&#]/, 'Password must contain at least one special character')
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
    control,
    formState: { isDirty },
    watch,
  } = methods;

  const curPassword = watch('newPassword');

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const res = await axiosInstance.patch(endpoints.auth.changePass, data);
      setLoading(false);
      enqueueSnackbar(res?.data?.message);
      methods.reset(defaultValues);
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  });

  const criteria = [
    { label: 'At least 8 characters', test: curPassword.length >= 8 },
    { label: 'Contains an uppercase letter', test: /[A-Z]/.test(curPassword) },
    { label: 'Contains a lowercase letter', test: /[a-z]/.test(curPassword) },
    { label: 'Contains a number', test: /[0-9]/.test(curPassword) },
    {
      label: 'Contains a special character (@, $, !, %, *, ?, &, #)',
      test: /[@$!%*?&#]/.test(curPassword),
    },
  ];

  const renderPasswordValidations = (
    <Stack>
      {criteria.map((rule, index) => (
        <Stack key={index} direction="row" alignItems="center" spacing={1}>
          <Iconify icon="ic:round-check" color={rule.test ? 'success.main' : 'gray'} />
          <Typography
            variant="caption"
            sx={{
              color: rule.test ? 'success.main' : 'text.secondary',
            }}
          >
            {rule.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );

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
            <Controller
              name="newPassword"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <RHFTextField
                  {...field}
                  label="New Password"
                  type={password.value ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={password.onToggle} edge="end">
                          <Iconify
                            icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText={<Stack spacing={1}>{renderPasswordValidations}</Stack>}
                />
              )}
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
