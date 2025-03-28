import * as Yup from 'yup';
import React, { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import { Card, Grid, Stack, IconButton, Typography, InputAdornment, Box, Paper, Fade, Popper } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const AccountSecurity = () => {
  const password = useBoolean();
  const [loading, setLoading] = useState(false);
  const mdDown = useResponsive('down', 'lg');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const id = open ? 'popper' : undefined;

  useEffect(() => {
    const handleClose = (event) => {
      if (anchorEl && !anchorEl.contains(event.target)) {
        setAnchorEl(null);
      }
    };

    window.addEventListener('click', handleClose);

    return () => {
      window.removeEventListener('click', handleClose);
    };
  }, [anchorEl]);

  const ChangePassWordSchema = Yup.object().shape({
    oldPassword: Yup.string().required('Current Password is required'),
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
      <Typography variant="caption" gutterBottom color="text.secondary">
        It&apos;s better to have:
      </Typography>
      {criteria.map((rule, index) => (
        <Stack key={index} direction="row" alignItems="center" spacing={0.5}>
          {rule.test ? (
            <Iconify icon="ic:round-check" color={rule.test && 'success.main'} />
          ) : (
            <Iconify icon="mdi:dot" />
          )}
          <Typography
            variant="caption"
            sx={{
              ...(curPassword &&
                rule.test && {
                  color: 'success.main',
                  textDecoration: 'line-through',
                }),
            }}
          >
            {rule.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack spacing={3}>
            {/* Current Password Field */}
            <Box>
              <Typography variant="body2" color="#636366" fontWeight={500} sx={{ fontSize: '13px', mb: 1 }}>
                Current Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              <RHFTextField
                name="oldPassword"
                placeholder="Current password"
                type={password.value ? 'text' : 'password'}
                InputLabelProps={{ shrink: false }}
                FormHelperTextProps={{ sx: { display: 'none' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={password.onToggle}>
                        <Box 
                          component="img" 
                          src={`/assets/icons/components/${password.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'}`} 
                          sx={{ width: 24, height: 24 }} 
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: '100%',
                  maxWidth: { xs: '100%', sm: 500 },
                  '&.MuiTextField-root': {
                    bgcolor: 'white',
                    borderRadius: 1,
                    height: { xs: 40, sm: 48 },
                    '& .MuiInputLabel-root': {
                      display: 'none',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#B0B0B0',
                      fontSize: { xs: '14px', sm: '16px' },
                      opacity: 1,
                    },
                  },
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#F04438',
                  mt: 1.5,
                  ml: 0.5,
                  display: 'block',
                  fontSize: '12px',
                }}
              >
                {methods.formState.errors.oldPassword?.message}
              </Typography>
            </Box>

            {/* New Password Field */}
            <Box>
              <Typography variant="body2" color="#636366" fontWeight={500} sx={{ fontSize: '13px', mb: 1 }}>
                New Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <RHFTextField
                    {...field}
                    placeholder="New password"
                    type={password.value ? 'text' : 'password'}
                    InputLabelProps={{ shrink: false }}
                    FormHelperTextProps={{ sx: { display: 'none' } }}
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                    }}
                    aria-describedby={id}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={password.onToggle}>
                            <Box 
                              component="img" 
                              src={`/assets/icons/components/${password.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'}`} 
                              sx={{ width: 24, height: 24 }} 
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: '100%',
                      maxWidth: { xs: '100%', sm: 500 },
                      '&.MuiTextField-root': {
                        bgcolor: 'white',
                        borderRadius: 1,
                        height: { xs: 40, sm: 48 },
                        '& .MuiInputLabel-root': {
                          display: 'none',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#B0B0B0',
                          fontSize: { xs: '14px', sm: '16px' },
                          opacity: 1,
                        },
                      },
                    }}
                  />
                )}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#F04438',
                  mt: 1.5,
                  ml: 0.5,
                  display: 'block',
                  fontSize: '12px',
                }}
              >
                {methods.formState.errors.newPassword?.message}
              </Typography>
            </Box>

            {/* Confirm Password Field */}
            <Box>
              <Typography variant="body2" color="#636366" fontWeight={500} sx={{ fontSize: '13px', mb: 1 }}>
                Confirm New Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              <RHFTextField
                name="confirmNewPassword"
                placeholder="Confirm new password"
                type={password.value ? 'text' : 'password'}
                InputLabelProps={{ shrink: false }}
                FormHelperTextProps={{ sx: { display: 'none' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={password.onToggle}>
                        <Box 
                          component="img" 
                          src={`/assets/icons/components/${password.value ? 'ic_open_passwordeye.svg' : 'ic_closed_passwordeye.svg'}`} 
                          sx={{ width: 24, height: 24 }} 
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: '100%',
                  maxWidth: { xs: '100%', sm: 500 },
                  '&.MuiTextField-root': {
                    bgcolor: 'white',
                    borderRadius: 1,
                    height: { xs: 40, sm: 48 },
                    '& .MuiInputLabel-root': {
                      display: 'none',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#B0B0B0',
                      fontSize: { xs: '14px', sm: '16px' },
                      opacity: 1,
                    },
                  },
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#F04438',
                  mt: 1.5,
                  ml: 0.5,
                  display: 'block',
                  fontSize: '12px',
                }}
              >
                {methods.formState.errors.confirmNewPassword?.message}
              </Typography>
            </Box>

            <Stack alignItems="flex-start">
              <LoadingButton
                type="submit"
                variant="contained"
                loading={loading}
                // disabled={!isDirty}
                sx={{
                  background: isDirty
                    ? '#1340FF'
                    : 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
                  pointerEvents: !isDirty && 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  borderBottom: isDirty ? '3px solid #0c2aa6' : '3px solid #91a2e5',
                  transition: 'none',
                  width: { xs: '100%', sm: '90px' },
                  height: '44px',
                }}
              >
                Update
              </LoadingButton>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement={mdDown ? 'top' : 'right'}
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper
              sx={{
                position: 'relative',
                borderRadius: 2,
                boxShadow: 10,
                border: 1,
                borderColor: '#EBEBEB',
                ml: 2,
                p: 2,
                ...(mdDown && {
                  mb: 2,
                  ml: 0,
                }),
              }}
            >
              <Iconify
                icon="ic:round-arrow-left"
                width={30}
                color="white"
                sx={{
                  position: 'absolute',
                  left: -17,
                  top: !mdDown && '50%',
                  transform: 'translateY(-50%)',
                  ...(mdDown && {
                    position: 'absolute',
                    bottom: -17,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(-90deg)',
                  }),
                }}
              />
              {renderPasswordValidations}
            </Paper>
          </Fade>
        )}
      </Popper>
    </FormProvider>
  );
};

export default AccountSecurity;
