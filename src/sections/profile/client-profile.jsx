import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Card,
  Typography,
  InputAdornment,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete, RHFUploadAvatar } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const ClientProfile = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [image, setImage] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);

  const defaultValues = {
    companyLogo: {},
    companyName: '',
    companyAddress: '',
    picEmail: '',
    registrationNumber: '',
    picName: '',
    picDesignation: '',
    picMobile: userData.phoneNumber || '',
    country: company.country || userData.country || '',
    companyLogo: company.logo || null,
  };

  const methods = useForm({
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
          const allCompanies = await axiosInstance.get(`${endpoints.company.getAll}`);
          const companies = allCompanies.data;

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
              companyLogo: company.logo || {},
              companyName: company.name || '',
              companyAddress: company.address || '',
              picEmail: pic.email || '',
              registrationNumber: company.registration_number || '',
              picName: pic.name || '',
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

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('companyLogo', newFile, { shouldValidate: true });
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
        companyLogo: data.companyLogo,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        picEmail: data.picEmail,
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
    <Box sx={{ mx: 'auto' }}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <RHFUploadAvatar name='companyLogo' onDrop={handleDrop} />
        <Grid container spacing={3} mt={1}>
          {/* First Row */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Company Name
            </Typography>
            <RHFTextField 
              name="companyName" 
              placeholder="Company Name"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              PIC (Person in Charge) Name
            </Typography>
            <RHFTextField 
              name="picName" 
              placeholder="Company PIC (Person in Charge) Name"
              size="small"
            />
          </Grid>

          {/* Second Row */}
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              PIC Email
            </Typography>
            <RHFTextField 
              name="picEmail" 
              placeholder="PIC Email"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Designation
            </Typography>
            <RHFTextField 
              name="picDesignation" 
              placeholder="Designation"
              size="small"
            />
          </Grid>

          {/* Third Row */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Client Registration Number
            </Typography>
            <RHFTextField 
              name="registrationNumber" 
              placeholder="Client Registration Number"
              size="small"
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Company Address
            </Typography>
            <RHFTextField 
              name="companyAddress" 
              placeholder="Company Address"
              size="small"
            />
          </Grid>

          {/* Fourth Row */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Country
            </Typography>
            <RHFAutocomplete
              name="country"
              type="country"
              size='small'
              placeholder="Code"
              options={countries.map((option) => option.label)}
              getOptionLabel={(option) => option}

            />
          </Grid>            
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              PIC Mobile Number
            </Typography>
            <RHFTextField
              name="picMobile"
              placeholder="PIC Mobile Number"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment sx={{ fontSize: 14 }} position="start">
                    +
                    {countries
                      .filter((elem) => elem.label === countryValue)
                      .map((e) => e.phone)}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Update Button */}
          <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
              sx={{
                background: '#1340FF',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '10px',
                borderBottom: '3px solid #0c2aa6',
                transition: 'none',
                width: { xs: '100%', sm: '90px' },
                height: '44px',
              }}
            >
              Update
            </LoadingButton>
          </Grid>
        </Grid>
      </FormProvider>
    </Box>
  );

};

export default ClientProfile;