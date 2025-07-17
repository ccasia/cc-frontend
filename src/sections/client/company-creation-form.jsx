import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Typography, Grid, InputAdornment } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';

import FormProvider, { RHFAutocomplete, RHFTextField } from 'src/components/hook-form';

const schema = Yup.object().shape({
  companyName: Yup.string().required('Company name is required'),
  registrationNumber: Yup.string().required('Company registration number is required'),
  companyAddress: Yup.string('Company address is required'),
  picDesignation: Yup.string().required('PIC designation is required'),
  picNumber: Yup.string().required('PIC phone number is required'),
});

export default function CompanyCreationForm({ onSuccess, existingCompany, isEdit }) {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      companyName: existingCompany?.name || '',
      registrationNumber: existingCompany?.registration_number || '',
      companyEmail: existingCompany?.email || '',
      country: '',
      picDesignation: existingCompany?.pic?.[0]?.designation || '',
      picNumber: existingCompany?.pic?.[0]?.phone || '',
    },
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const watchedValues = watch();
  const isFormValid = watchedValues.companyName && 
                     watchedValues.registrationNumber && 
                     watchedValues.companyAddress && 
                     watchedValues.picDesignation && 
                     watchedValues.picNumber;

  const countryValue = watch('country');

  const onSubmit = async (data) => {
    try {
      const response = await axiosInstance.post(endpoints.client.createCompany, data);
      onSuccess(response.data.company);
    } catch (error) {
      console.error('Error creating company:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error creating company', {
        variant: 'error',
      });
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack>

        <Typography variant="body2" color="text.primary" sx={{ mb: 1, mt: 2 }}>
          Company Name
        </Typography>
        <RHFTextField
          name="companyName"
          placeholder="Company Name"
          required
          sx={{ bgcolor: '#fff', borderRadius: 1 }}
        />

        <Typography variant="body2" color="text.primary" sx={{ mb: 1, mt: 2 }}>
          Company Registration Number
        </Typography>
        <RHFTextField
          name="registrationNumber"
          placeholder="Company Registration Number"
          sx={{ bgcolor: '#fff', borderRadius: 1 }}
          required
        />

        <Typography variant="body2" color="text.primary" sx={{ mb: 1, mt: 2 }}>
          Company Address
        </Typography>
        <RHFTextField
          name="companyAddress"
          placeholder="Company Address"
          sx={{ bgcolor: '#fff', borderRadius: 1 }}
          required
        />

        <Typography variant="body2" color="text.primary" sx={{ mb: 1, mt: 2 }}>
          Designation
        </Typography>
        <RHFTextField
          name="picDesignation"
          placeholder="Designation"
          required
          sx={{ bgcolor: '#fff', borderRadius: 1 }}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, mt: 2 }}>
              Country
            </Typography>
            <RHFAutocomplete
              name="country"
              type="country"
              placeholder="Code"
              options={countries.map((option) => option.label)}
              getOptionLabel={(option) => option}
              sx={{ bgcolor: '#fff', borderRadius: 1 }}
            />
          </Grid>  
          <Grid item sm={8}>
            <Typography variant="body2" color="text.primary" sx={{ mb: 1, mt: 2 }}>
              PIC Mobile Number
            </Typography>
            <RHFTextField
              name="picNumber"
              placeholder="PIC Mobile Number"
              required
              sx={{ bgcolor: '#fff', borderRadius: 1 }}
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

        <Box sx={{ mt: 3, alignSelf: 'flex-end' }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            size="large"
            disabled={!isFormValid}
            sx={{
              boxShadow: '0px -3px 0px 0px #00000073 inset'
            }}
          >
            Save Details
          </LoadingButton>
        </Box>
      </Stack>
    </FormProvider>
  );
}

CompanyCreationForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  existingCompany: PropTypes.object,
  isEdit: PropTypes.bool,
};