import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Typography,
  Grid,
  InputAdornment,
  Box,
} from '@mui/material';

import { useSnackbar } from 'src/components/snackbar';
import axiosInstance, { endpoints } from 'src/utils/axios';
import Iconify from 'src/components/iconify';
import { countries } from 'src/assets/data';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// Validation schema
const ClientProfileSchema = Yup.object().shape({
  companyName: Yup.string()
    .min(2, 'Company name must be at least 2 characters')
    .required('Company name is required'),
  picName: Yup.string()
    .min(2, 'PIC name must be at least 2 characters')
    .required('PIC name is required'),
  picEmail: Yup.string()
    .email('Please enter a valid email address')
    .required('PIC email is required'),
  picDesignation: Yup.string()
    .min(2, 'Designation must be at least 2 characters')
    .required('Designation is required'),
  registrationNumber: Yup.string()
    .min(2, 'Registration number must be at least 2 characters')
    .required('Registration number is required'),
  companyAddress: Yup.string()
    .min(5, 'Company address must be at least 5 characters')
    .required('Company address is required'),
  country: Yup.string()
    .required('Country is required'),
  picMobile: Yup.string()
    .min(10, 'Mobile number must be at least 10 characters')
    .required('Mobile number is required'),
});

export default function ClientProfileCompletionModal({ open, onClose, onSuccess, userEmail }) {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = {
    companyName: '',
    picName: '',
    picEmail: userEmail || '',
    picDesignation: '',
    registrationNumber: '',
    companyAddress: '',
    country: '',
    picMobile: '',
  };

  const methods = useForm({
    resolver: yupResolver(ClientProfileSchema),
    mode: 'onChange',
    defaultValues,
  });

  const { handleSubmit, setValue, watch, reset } = methods;
  const countryValue = watch('country');

  // Set default email from user
  useEffect(() => {
    if (userEmail) {
      setValue('picEmail', userEmail);
    }
  }, [userEmail, setValue]);

  // Check if client already has a company and pre-fill form
  useEffect(() => {
    const checkExistingCompany = async () => {
      try {
        const response = await axiosInstance.get(endpoints.client.checkCompany);
        const { hasCompany, company } = response.data;
        
        if (hasCompany && company) {
          // Pre-fill form with existing company data
          setValue('companyName', company.name || '');
          setValue('companyAddress', company.address || '');
          setValue('registrationNumber', company.registration_number || '');
          setValue('country', company.country || '');
          
          // Pre-fill PIC data if available
          if (company.pic && company.pic.length > 0) {
            const pic = company.pic[0];
            setValue('picName', pic.name || '');
            setValue('picEmail', pic.email || userEmail || '');
            setValue('picDesignation', pic.designation || '');
            setValue('picMobile', pic.mobile || '');
          }
        }
      } catch (error) {
        console.error('Error checking existing company:', error);
      }
    };

    if (open) {
      checkExistingCompany();
    }
  }, [open, setValue, userEmail]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);

      // First, check if client already has a company
      const companyCheck = await axiosInstance.get(endpoints.client.checkCompany);
      const { hasCompany, company } = companyCheck.data;

      if (hasCompany && company) {
        // Client already has a company, update it
        try {
          // First, update the user's name if it's different
          if (data.companyName && data.companyName !== data.picName) {
            await axiosInstance.patch(endpoints.auth.updateClient, {
              name: data.companyName,
              country: data.country,
              phoneNumber: data.picMobile,
            });
          }

          // Then update the company using the updateClient endpoint
          const formData = new FormData();
          const updateData = {
            companyLogo: null,
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

          await axiosInstance.patch(endpoints.client.updateClient, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          enqueueSnackbar('Profile updated successfully!', { 
            variant: 'success',
            autoHideDuration: 6000,
          });
        } catch (updateError) {
          console.error('Error updating company:', updateError);
          enqueueSnackbar('Failed to update profile. Please try again.', { variant: 'error' });
          return;
        }
      } else {
        // Client doesn't have a company, create one
        try {
          // First, update the user's name if it's different from the company name
          if (data.companyName && data.companyName !== data.picName) {
            await axiosInstance.patch(endpoints.auth.updateClient, {
              name: data.companyName,
              country: data.country,
              phoneNumber: data.picMobile,
            });
          }

          // Then create a company with the provided information
          const companyData = {
            picName: data.picName,
            registrationNumber: data.registrationNumber,
            companyAddress: data.companyAddress,
            picDesignation: data.picDesignation,
            picNumber: data.picMobile,
            country: data.country,
          };

          await axiosInstance.post(endpoints.client.createCompany, companyData);

          enqueueSnackbar('Profile completed successfully!', { 
            variant: 'success',
            autoHideDuration: 6000,
          });
        } catch (createError) {
          console.error('Error creating company:', createError);
          enqueueSnackbar('Failed to create company. Please try again.', { variant: 'error' });
          return;
        }
      }
      
      // Reset form
      reset();
      
      // Mark profile as completed
      localStorage.setItem('profileCompleted', 'true');
      console.log('Profile marked as completed in localStorage');
      
      // Close dialog
      onClose();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      enqueueSnackbar('Failed to complete profile. Please try again.', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleClose = () => {
    // Don't allow closing if still submitting
    if (!isSubmitting) {
      // Only allow closing if profile is completed
      // For now, we'll prevent closing entirely until form is submitted
      return;
    }
  };

  const handleSkip = () => {
    // Remove skip functionality - modal must be completed
    return;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="eva:person-fill" width={24} />
          <Typography variant="h6">Complete Your Profile</Typography>
        </Stack>
      </DialogTitle>
      
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            <Alert severity="info" icon={<Iconify icon="eva:info-fill" />}>
              <Typography variant="body2">
                Please complete your company profile to get started. This information is required to continue using the platform.
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              {/* Company Name */}
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

              {/* PIC Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  PIC (Person in Charge) Name
                </Typography>
                <RHFTextField 
                  name="picName" 
                  placeholder="PIC Name"
                  size="small"
                />
              </Grid>

              {/* PIC Email */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  PIC Email
                </Typography>
                <RHFTextField 
                  name="picEmail" 
                  placeholder="PIC Email"
                  size="small"
                />
              </Grid>

              {/* Designation */}
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

              {/* Registration Number */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Registration Number
                </Typography>
                <RHFTextField 
                  name="registrationNumber" 
                  placeholder="Registration Number"
                  size="small"
                />
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Country
                </Typography>
                <RHFAutocomplete
                  name="country"
                  type="country"
                  size="small"
                  placeholder="Select Country"
                  options={countries.map((option) => option.label)}
                  getOptionLabel={(option) => option}
                />
              </Grid>

              {/* Company Address */}
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Company Address
                </Typography>
                <RHFTextField 
                  name="companyAddress" 
                  placeholder="Company Address"
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>

              {/* PIC Mobile */}
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
            </Grid>
          </Stack>
        </DialogContent>
        
        <DialogActions>
          {/* <Button onClick={handleSkip} disabled={isSubmitting}>
            Skip for Now
          </Button> */}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            sx={{
              background: '#1340FF',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '10px',
              borderBottom: '3px solid #0c2aa6',
              transition: 'none',
              '&:hover': {
                background: '#0c2aa6',
              },
            }}
          >
            {isSubmitting ? 'Saving...' : 'Complete Profile'}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

ClientProfileCompletionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  userEmail: PropTypes.string,
}; 