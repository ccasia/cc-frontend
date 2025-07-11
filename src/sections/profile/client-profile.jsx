import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { useState, useCallback, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Box,
  Grid,
  Card,
  Stack,
  Avatar,
  Typography,
  InputAdornment,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';

import UploadPhoto from './dropzone';

// ----------------------------------------------------------------------

const ClientProfile = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [image, setImage] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);

  const UpdateClientSchema = Yup.object().shape({
    companyName: Yup.string().required('Company name is required'),
    companyAddress: Yup.string().required('Company address is required'),
    registrationNumber: Yup.string().required('Registration number is required'),
    picName: Yup.string().required('PIC name is required'),
    picDesignation: Yup.string().required('PIC designation is required'),
    picMobile: Yup.string().required('PIC mobile number is required'),
    country: Yup.string().required('Country is required'),
  });

  const defaultValues = {
    companyName: '',
    companyAddress: '',
    registrationNumber: '',
    picName: '',
    picDesignation: '',
    picMobile: '',
    country: '',
    companyLogo: null,
  };

  const methods = useForm({
    resolver: yupResolver(UpdateClientSchema),
    defaultValues,
  });

  const { handleSubmit, setValue, watch, reset } = methods;

  const countryValue = watch('country');

  // Fetch company data when component mounts
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        
        // First try to get user data to find associated company
        const userResponse = await axiosInstance.get(`${endpoints.auth.me}`);
        const userData = userResponse.data.user;

        console.log('User data: ', userData)
        
        // If user has client data and we need to find the company
        if (userData?.client || userData?.email) {
          // Get all companies and find the one matching user email or PIC email
          const companiesResponse = await axiosInstance.get(`${endpoints.company.getAll}`);
          const companies = companiesResponse.data;

          // Find company where user email matches company email or PIC email
          const matchedCompany = companies.find(company => 
            company.email?.toLowerCase() === userData.email?.toLowerCase() ||
            company.pic?.some(pic => pic.email?.toLowerCase() === userData.email?.toLowerCase())
          );
          
          if (matchedCompany) {
            console.log('Company info: ', matchedCompany)
            const company = matchedCompany;
            const pic = company.pic?.find(p => p.email?.toLowerCase() === userData.email?.toLowerCase()) || company.pic?.[0] || {};
            
            setCompanyData(company);
            reset({
              companyName: company.name || '',
              companyAddress: company.address || '',
              registrationNumber: company.registration_number || '',
              picName: userData.name || '',
              picDesignation: pic.designation || '',
              picMobile: userData.phoneNumber || '',
              country: company.country || userData.country || '',
              companyLogo: company.logo || null,
            });
          } else {
            enqueueSnackbar('No associated company found for this client', { variant: 'warning' });
          }
        }
      } catch (error) {
        enqueueSnackbar('Error fetching company data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'client') {
      fetchCompanyData();
    }
  }, [user, reset, enqueueSnackbar]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        setImage(preview);
        setValue('companyLogo', file);
      }
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);

      // Prepare form data for the new updateClient endpoint
      const formData = new FormData();
      const updateData = {
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        registrationNumber: data.registrationNumber,
        picName: data.picName,
        picDesignation: data.picDesignation,
        picMobile: data.picMobile,
        country: data.country,
      };

      formData.append('data', JSON.stringify(updateData));
      if (data.companyLogo instanceof File) {
        formData.append('companyLogo', data.companyLogo);
      }

      // Use the new comprehensive updateClient endpoint
      await axiosInstance.patch(endpoints.client.updateClient, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Profile updated successfully');
    } catch (error) {
      enqueueSnackbar('Error updating profile', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  });

  const renderPicture = (
    <Grid item xs={12} md={4}>
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <UploadPhoto onDrop={onDrop}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                borderRadius: '12px',
              }}
              src={image || companyData?.logo}
              variant="rounded"
            />
          </UploadPhoto>
          <Typography variant="caption" color="text.secondary">
            Company Logo
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            Allowed *.jpeg, *.jpg, *.png, *.gif max size of 3 Mb
          </Typography>
        </Stack>
      </Card>
    </Grid>
  );

  const renderForm = (
    <Grid item xs={12} md={8}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Company Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <RHFTextField name="companyName" label="Company Name" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <RHFTextField name="registrationNumber" label="Registration Number" />
            </Grid>
            <Grid item xs={12}>
              <RHFTextField name="companyAddress" label="Company Address" multiline rows={3} />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Person In Charge (PIC) Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <RHFTextField name="picName" label="PIC Name" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <RHFTextField name="picDesignation" label="PIC Designation" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <RHFAutocomplete
                name="country"
                label="Country"
                placeholder="Choose a country"
                options={countries.map((option) => option.label)}
                getOptionLabel={(option) => option}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <RHFTextField
                name="picMobile"
                label="PIC Mobile Number"
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
          </Grid>

          <Box sx={{ textAlign: 'right', mt: 3 }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
              disabled={!methods.formState.isDirty && !image}
            >
              Save
            </LoadingButton>
          </Box>
        </Card>
      </FormProvider>
    </Grid>
  );

  if (user?.role !== 'client') {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          This profile is only available for client users.
        </Typography>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      {renderPicture}
      {renderForm}
    </Grid>
  );
};

export default ClientProfile;