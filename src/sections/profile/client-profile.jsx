import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Grid, Card, Typography, InputAdornment } from '@mui/material';

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
    companyName: '',
    companyAddress: '',
    picEmail: '',
    registrationNumber: '',
    picName: '',
    picDesignation: '',
    picMobile: user?.phoneNumber || '',
    country: '',
    companyLogo: null,
  };

  const methods = useForm({
    defaultValues,
  });

  const { handleSubmit, setValue, watch, reset } = methods;

  const countryValue = watch('country');

  // Local persistence for PIC fields as a safety net when reopening
  const PIC_OVERRIDE_KEY = 'client_pic_override';
  const loadPicOverride = () => {
    try {
      const raw = localStorage.getItem(PIC_OVERRIDE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const savePicOverride = (pic) => {
    try {
      localStorage.setItem(PIC_OVERRIDE_KEY, JSON.stringify(pic || {}));
    } catch {}
  };

  // Fetch company data when component mounts
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        // Prefer server-side association check
        const check = await axiosInstance.get(endpoints.client.checkCompany);
        const hasCompany = !!check?.data?.hasCompany;
        const company = check?.data?.company || null;

        if (hasCompany && company) {
          const pic = company.pic?.[0] || {};
          const override = loadPicOverride();
          const mergedPic = {
            name: pic.name || override?.name || '',
            email: pic.email || override?.email || '',
            designation: pic.designation || override?.designation || '',
          };
          setCompanyData(company);
          try { localStorage.setItem('client_company_logo', company.logo || ''); } catch {}
          reset({
            companyLogo: company.logo || {},
            companyName: company.name || '',
            companyAddress: company.address || '',
            picEmail: mergedPic.email,
            registrationNumber: company.registration_number || '',
            picName: mergedPic.name,
            picDesignation: mergedPic.designation,
            picMobile: user?.phoneNumber || '',
            country: company.country || user?.country || '',
            companyLogo: company.logo || null,
          });
          return;
        }

        // Fallback: attempt to match by email if server has no link yet
        const userResponse = await axiosInstance.get(`${endpoints.auth.me}`);
        const userData = userResponse.data.user;
        const allCompanies = await axiosInstance.get(`${endpoints.company.getAll}`);
        const companies = allCompanies.data;
        const matchedCompany = companies.find((co) =>
          co.email?.toLowerCase() === userData.email?.toLowerCase() ||
          co.pic?.some((p) => p.email?.toLowerCase() === userData.email?.toLowerCase())
        );
        if (matchedCompany) {
          const pic = matchedCompany.pic?.find((p) => p.email?.toLowerCase() === userData.email?.toLowerCase()) || matchedCompany.pic?.[0] || {};
          const override = loadPicOverride();
          const mergedPic = {
            name: pic.name || override?.name || '',
            email: pic.email || override?.email || '',
            designation: pic.designation || override?.designation || '',
          };
          setCompanyData(matchedCompany);
          try { localStorage.setItem('client_company_logo', matchedCompany.logo || ''); } catch {}
          reset({
            companyLogo: matchedCompany.logo || {},
            companyName: matchedCompany.name || '',
            companyAddress: matchedCompany.address || '',
            picEmail: mergedPic.email,
            registrationNumber: matchedCompany.registration_number || '',
            picName: mergedPic.name,
            picDesignation: mergedPic.designation,
            picMobile: userData.phoneNumber || '',
            country: matchedCompany.country || userData.country || '',
            companyLogo: matchedCompany.logo || null,
          });
        } else {
          // Do not warn; allow user to fill the form and update
          setCompanyData(null);
          const override = loadPicOverride();
          if (override) {
            reset({
              companyLogo: null,
              companyName: '',
              companyAddress: '',
              picEmail: override.email || '',
              registrationNumber: '',
              picName: override.name || '',
              picDesignation: override.designation || '',
              picMobile: user?.phoneNumber || '',
              country: user?.country || '',
              companyLogo: null,
            });
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
      // Keep the submitted values visible; optionally merge fresh server data
      const submittedValues = {
        companyLogo: data.companyLogo || null,
        companyName: data.companyName || '',
        companyAddress: data.companyAddress || '',
        picEmail: data.picEmail || '',
        registrationNumber: data.registrationNumber || '',
        picName: data.picName || '',
        picDesignation: data.picDesignation || '',
        picMobile: data.picMobile || '',
        country: data.country || '',
      };
      reset(submittedValues);
      // Persist PIC fields locally so they show after reopening
      savePicOverride({ name: submittedValues.picName, email: submittedValues.picEmail, designation: submittedValues.picDesignation });

      // Background refresh to sync with server without wiping PIC fields
      try {
        const check = await axiosInstance.get(endpoints.client.checkCompany);
        if (check?.data?.company) {
          const company = check.data.company;
          const pic = company.pic?.[0] || {};
          setCompanyData(company);
          try { localStorage.setItem('client_company_logo', company.logo || ''); } catch {}
          reset({
            companyLogo: company.logo || submittedValues.companyLogo,
            companyName: company.name || submittedValues.companyName,
            companyAddress: company.address || submittedValues.companyAddress,
            // Prefer submitted PIC values so the user sees their edits
            picEmail: submittedValues.picEmail || pic.email || '',
            registrationNumber: company.registration_number || submittedValues.registrationNumber,
            picName: submittedValues.picName || pic.name || '',
            picDesignation: submittedValues.picDesignation || pic.designation || '',
            picMobile: submittedValues.picMobile || user?.phoneNumber || '',
            country: company.country || submittedValues.country,
            companyLogo: company.logo || submittedValues.companyLogo,
          });
        }
      } catch {}
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
        <RHFUploadAvatar name="companyLogo" onDrop={handleDrop} />
        <Grid container spacing={3} mt={1}>
          {/* First Row */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Company Name
            </Typography>
            <RHFTextField name="companyName" placeholder="Company Name" size="small" />
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
            <RHFTextField name="picEmail" placeholder="PIC Email" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Designation
            </Typography>
            <RHFTextField name="picDesignation" placeholder="Designation" size="small" />
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
            <RHFTextField name="companyAddress" placeholder="Company Address" size="small" />
          </Grid>

          {/* Fourth Row */}
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Country
            </Typography>
            <RHFAutocomplete
              name="country"
              type="country"
              size="small"
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
                    +{countries.filter((elem) => elem.label === countryValue).map((e) => e.phone)}
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
