import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import toast, { Toaster } from 'react-hot-toast';
import React, { useState, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

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
    password: Yup.string().required('Password is required'),
    name: Yup.string().required('Name is required'),
    designation: Yup.string().required('Designation is required'),
    country: Yup.string().required('Country is required'),
    phoneNumber: Yup.string().required('Phone Number is required'),
  });

  const password = useBoolean();

  const methods = useForm({
    resolver: yupResolver(AdminSchema),
  });

  const {
    setValue,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

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
      toast.success('You are noe verified to use the system!');
      navigate('/auth/jwt/admin/login');
    } catch (error) {
      alert(error);
      reset();
      setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

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
      <RHFTextField name="email" label="Email" type="email" value={user?.email} />
      <RHFTextField name="name" label="Name" type="text" />
      <RHFTextField name="designation" label="Designation" type="text" />
      <RHFAutocomplete
        name="country"
        type="country"
        label="Country"
        placeholder="Choose a country"
        fullWidth
        options={countries.map((option) => option.label)}
        getOptionLabel={(option) => option}
      />
      <RHFTextField name="phoneNumber" label="Phone Number" type="text" />
      <RHFTextField
        name="password"
        label="Password"
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
