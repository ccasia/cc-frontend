import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Stack, Button, Divider, MenuItem, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';
import LoadingButton from '@mui/lab/LoadingButton';
import FormProvider, { RHFTextField, RHFSelect } from 'src/components/hook-form';
import { regions } from 'src/assets/data/regions';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';

const LogisticsForm = ({
  user,
  campaignId,
  onUpdate,
  onConfirm,
  isLogisticsCompleted,
  submission,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const LogisticsSchema = Yup.object().shape({
    country: Yup.string().required('Country is required'),
    state: Yup.string().required('State/Region is required'),
    address: Yup.string().required('Address is required'),
    location: Yup.string(),
    postcode: Yup.string().required('Postcode is required'),
    city: Yup.string().required('City is required'),
    dietaryRestrictions: Yup.string(),
  });

  const defaultValues = useMemo(() => {
    const creator = user?.creator || {};
    return {
      country: creator.country || '',
      state: creator.state || '',
      address: creator.address || '',
      location: creator.location || '',
      postcode: creator.postcode || '',
      city: creator.city || '',
      dietaryRestrictions: creator.dietaryRestrictions || '',
    };
  }, [user]);

  const methods = useForm({
    resolver: yupResolver(LogisticsSchema),
    defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const selectedCountry = watch('country');

  const availableStates = useMemo(() => {
    const countryData = regions.find((region) => region.countryName === selectedCountry);
    return countryData ? countryData.regions : [];
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedCountry !== user?.creator?.country) {
      setValue('state', '');
    }
  }, [selectedCountry, setValue, user?.creator?.country]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.post(
        `/api/logistics/creator/campaign/${campaignId}/onboarding-details`,
        data
      );
      enqueueSnackbar('Logistics information saved!', { variant: 'success' });
      if (onUpdate) onUpdate();
    } catch (error) {
      enqueueSnackbar('Failed to save information', { variant: 'error' });
    }
  });

  const countryOptions = useMemo(() => {
    const allCountries = regions.map((region) => region.countryName);
    const priorityCountries = ['Malaysia', 'Singapore'];
    const otherCountries = allCountries.filter((c) => !priorityCountries.includes(c)).sort();
    return [...priorityCountries, ...otherCountries];
  }, []);

  if (isLogisticsCompleted) {
    return (
      <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#221f20' }}>
            Product Delivery Info 📦
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Due: {dayjs(submission?.dueDate).format('MMM DD, YYYY')}
          </Typography>
        </Stack>
        <Stack justifyContent="center" alignItems="center" spacing={2}>
          <Divider sx={{ width: '100%', mx: 'auto' }} />

          <Box
            sx={{
              width: 100,
              height: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: '#5abc6f',
              fontSize: '50px',
              mb: -1,
            }}
          >
            ✅
          </Box>
          <Stack spacing={1} alignItems="center">
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '1.5rem', sm: '2.5rem' },
                fontWeight: 550,
                textAlign: 'center',
              }}
            >
              Logistics Information Saved!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#636366',
                mt: -1,
                textAlign: 'center',
              }}
            >
              Your delivery details have been successfully submitted.
            </Typography>
          </Stack>
          <Button
            onClick={onConfirm}
            variant="contained"
            startIcon={<Iconify icon="solar:box-bold" width={24} />}
            sx={{
              bgcolor: '#203ff5',
              color: 'white',
              borderBottom: 3.5,
              borderBottomColor: '#112286',
              borderRadius: 1.5,
              px: 3,
              py: 1.25,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#203ff5',
                opacity: 0.9,
              },
            }}
          >
            Go To Logistics
          </Button>
        </Stack>
      </>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#221f20' }}>
          Product Delivery Info 📦
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Due: {dayjs(submission?.dueDate).format('MMM DD, YYYY')}
        </Typography>
      </Stack>

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Divider sx={{ width: '100%', mx: 'auto' }} />
          <Stack direction="row" spacing={2}>
            <Stack spacing={1} flex={1}>
              <Typography variant="caption" sx={{ color: '#636366', fontWeight: 500 }}>
                Country of Residence{' '}
                <Typography component="span" color="error">
                  *
                </Typography>
              </Typography>
              <RHFSelect name="country">
                {countryOptions.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Stack>
            <Stack spacing={1} flex={1}>
              <Typography variant="caption" sx={{ color: '#636366', fontWeight: 500 }}>
                State/Territory{' '}
                <Typography component="span" color="error">
                  *
                </Typography>
              </Typography>
              <RHFSelect name="state" disabled={!selectedCountry || availableStates.length === 0}>
                {availableStates.map((s) => (
                  <MenuItem key={s.name} value={s.name}>
                    {s.name}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ color: '#636366', fontWeight: 500 }}>
              Address{' '}
              <Typography component="span" color="error">
                *
              </Typography>
            </Typography>
            <RHFTextField name="address" placeholder="Address" />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ color: '#636366', fontWeight: 500 }}>
              Apartment, suite, etc.
            </Typography>
            <RHFTextField name="location" placeholder="Apartment, suite, etc." />
          </Stack>

          <Stack direction="row" spacing={2}>
            <Stack spacing={1} flex={1}>
              <Typography variant="caption" sx={{ color: '#636366', fontWeight: 500 }}>
                Postcode{' '}
                <Typography component="span" color="error">
                  *
                </Typography>
              </Typography>
              <RHFTextField name="postcode" placeholder="Enter Postcode" />
            </Stack>
            <Stack spacing={1} flex={1}>
              <Typography variant="caption" sx={{ color: '#636366', fontWeight: 500 }}>
                City{' '}
                <Typography component="span" color="error">
                  *
                </Typography>
              </Typography>
              <RHFTextField name="city" placeholder="Enter City" />
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ color: '#636366', fontWeight: 500 }}>
              Dietary Restrictions/Allergies
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', mt: -0.5, mb: 0.5 }}>
              Please provide any dietary restrictions, or allergies to help us ensure your safety
              and suitability for this campaign
            </Typography>
            <RHFTextField
              name="dietaryRestrictions"
              multiline
              rows={4}
              placeholder="Dietary Restrictions/Allergies"
            />
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              sx={{ bgcolor: '#333', px: 4, '&:hover': { bgcolor: '#000' } }}
            >
              Submit
            </LoadingButton>
          </Box>
        </Stack>
      </FormProvider>
    </Box>
  );
};

export default LogisticsForm;

LogisticsForm.propTypes = {
  user: PropTypes.object,
  campaignId: PropTypes.string,
  onUpdate: PropTypes.func,
  onConfirm: PropTypes.func,
  isLogisticsCompleted: PropTypes.bool,
  submission: PropTypes.object,
};
