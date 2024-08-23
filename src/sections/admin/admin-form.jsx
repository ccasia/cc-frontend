import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Alert,
  Stack,
  Container,
  IconButton,
  Typography,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fData } from 'src/utils/format-number';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAdminContext } from 'src/auth/hooks/use-admin-context';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete, RHFUploadAvatar } from 'src/components/hook-form';

const AdminForm = () => {
  const [errorMsg, setErrorMsg] = useState('');
  const { user } = useAdminContext();
  const navigate = useNavigate();

  const AdminSchema = Yup.object().shape({
    email: Yup.string(),
    password: Yup.string().required('Password is required'),
    name: Yup.string().required('Name is required'),
    // designation: Yup.string().required('Designation is required'),
    country: Yup.string().required('Country is required'),
    phoneNumber: Yup.string().required('Phone Number is required'),
  });

  const password = useBoolean();

  const methods = useForm({
    resolver: yupResolver(AdminSchema),
    defaultValues: {
      email: user?.email || '',
      name: '',
      role: '',
      country: '',
      phoneNumber: '',
    },
  });

  const {
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    setValue('email', user?.email);
    setValue('role', user?.admin?.role?.name);
  }, [setValue, user]);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('photoURL', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.put(endpoints.users.updateProfileNewAdmin, { data, userId: user.id });
      navigate('/auth/jwt/admin/login');
      enqueueSnackbar('You are now verified to use the system!', {
        variant: 'success',
      });
      // toast.success('You are now verified to use the system!');
    } catch (error) {
      enqueueSnackbar('Please contact our admin', {
        variant: 'error',
      });
      reset();
      setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

  const countryValue = watch('country');

  const renderForm = (
    <Box
      rowGap={3}
      columnGap={2}
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
      }}
    >
      <RHFTextField name="email" label="Email" type="email" disabled />
      <RHFTextField name="name" label="Name" type="text" />
      <RHFTextField name="role" label="Role" type="text" disabled />
      {/* <RHFAutocomplete
        name="designation"
        type="designation"
        label="Designation"
        placeholder="Choose your designation"
        fullWidth
        options={['Finance', 'CSM', 'BD', 'Growth']}
        getOptionLabel={(option) => option}
      /> */}
      <RHFAutocomplete
        name="country"
        type="country"
        label="Country"
        placeholder="Choose a country"
        fullWidth
        options={countries.map((option) => option.label)}
        getOptionLabel={(option) => option}
      />
      <RHFTextField
        name="phoneNumber"
        label="Phone Number"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              +{countries.filter((elem) => elem.label === countryValue).map((e) => e.phone)}
            </InputAdornment>
          ),
        }}
      />
      <RHFTextField
        name="password"
        label="Password"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: countryValue && (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );

  return (
    <Container maxWidth="md">
      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack
          gap={10}
          p={{
            xs: 5,
            sm: 10,
          }}
        >
          <RHFUploadAvatar
            name="photoURL"
            maxSize={1e7}
            onDrop={handleDrop}
            helperText={
              <Typography
                variant="caption"
                sx={{
                  mt: 3,
                  mx: 'auto',
                  display: 'block',
                  textAlign: 'center',
                  color: 'text.disabled',
                }}
              >
                Allowed *.jpeg, *.jpg, *.png, *.gif
                <br /> max size of {fData(1e7)}
              </Typography>
            }
          />

          {renderForm}

          <LoadingButton
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            Submit
          </LoadingButton>
        </Stack>
      </FormProvider>
      <Toaster />
    </Container>
  );
};

export default AdminForm;
