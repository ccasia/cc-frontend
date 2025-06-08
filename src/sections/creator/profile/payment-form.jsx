import * as yup from 'yup';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, TextField, Typography, createFilterOptions } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { newBanks } from 'src/contants/banksv2';
import { updatePaymentForm } from 'src/api/paymentForm';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

const schema = yup.object().shape({
  bankName: yup.string().required('Bank name is required'),
  countryOfBank: yup.string().required('Country of bank is required'),
  bankNumber: yup
    .string()
    .min(0, 'Bank account number cannot be negative')
    .required('Bank account number is required'),
  bankAccName: yup.string().required('Bank account name is required'),
  icPassportNumber: yup.string().required('IC / Passport Number is required.'),
});

const filter = createFilterOptions();

const PaymentFormProfile = ({ user }) => {
  const paymentForm = user?.paymentForm;
  const mdDown = useResponsive('down', 'lg');

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      bankName: paymentForm?.bankName || '',
      bankNumber: paymentForm?.bankAccountNumber || '',
      bankAccName: paymentForm?.bankAccountName || '',
      icPassportNumber: paymentForm?.icNumber || '',
      countryOfBank: paymentForm?.countryOfBank || '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isDirty, isSubmitting },
    watch,
    setValue,
  } = methods;

  const bankName = watch('bankName');
  const countryOfBank = watch('countryOfBank');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await updatePaymentForm(data);
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar('Error submitting payment form', {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    if (bankName) {
      if (bankName.includes('Add')) {
        const value = bankName.split(' ').slice(1).join(' ');
        setValue('bankName', value, { shouldDirty: true });
      } else if (bankName !== paymentForm?.bankName) {
        setValue('bankName', bankName, { shouldDirty: true });
      }
    }
  }, [bankName, paymentForm, setValue]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          // maxWidth: { xs: '100%', sm: 500 },
          bgcolor: '#F4F4F4',
          p: 2,
          borderRadius: 2,
          display: 'grid',
          gridTemplateColumns: { md: 'repeat(2,1fr)' },
          gap: 1,
        }}
        width={mdDown ? 1 : 752}
      >
        <Box>
          <Typography
            variant="body2"
            color="#636366"
            fontWeight={500}
            sx={{ fontSize: '13px', mb: 1 }}
          >
            Country of Bank{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <RHFAutocomplete
            selectOnFocus
            clearOnBlur
            name="countryOfBank"
            placeholder="Country of bank"
            options={newBanks.map((item) => item.country)}
            getOptionLabel={(option) => option}
            filterOptions={(options, params) => {
              const { inputValue } = params;
              const filtered = filter(options, params);
              const isExisting = options.some(
                (option) => option.toLowerCase() === inputValue.toLowerCase()
              );
              if (inputValue !== '' && !isExisting) {
                filtered.push(`Add ${inputValue}`);
              }
              return filtered;
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': {
                bgcolor: 'white',
                borderRadius: 1,
                height: { xs: 40, sm: 48 },
              },
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#B0B0B0',
                fontSize: { xs: '14px', sm: '16px' },
                opacity: 1,
              },
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="body2"
            color="#636366"
            fontWeight={500}
            sx={{ fontSize: '13px', mb: 1 }}
          >
            Bank Name{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <RHFAutocomplete
            selectOnFocus
            clearOnBlur
            name="bankName"
            // options={banks.map((item) => item.bank)}
            options={newBanks.find((item) => item.country === countryOfBank)?.banks || []}
            getOptionLabel={(option) => option}
            filterOptions={(options, params) => {
              const { inputValue } = params;
              const filtered = filter(options, params);
              const isExisting = options.some(
                (option) => option.toLowerCase() === inputValue.toLowerCase()
              );
              if (inputValue !== '' && !isExisting) {
                filtered.push(`Add ${inputValue}`);
              }
              return filtered;
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': {
                bgcolor: 'white',
                borderRadius: 1,
                height: { xs: 40, sm: 48 },
              },
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#B0B0B0',
                fontSize: { xs: '14px', sm: '16px' },
                opacity: 1,
              },
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="body2"
            color="#636366"
            fontWeight={500}
            sx={{ fontSize: '13px', mb: 1 }}
          >
            Account Holder Name{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <RHFTextField
            name="bankAccName"
            placeholder="Bank Account Name"
            InputLabelProps={{ shrink: false }}
            FormHelperTextProps={{ sx: { display: 'none' } }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': {
                bgcolor: 'white',
                borderRadius: 1,
                height: { xs: 40, sm: 48 },
              },
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#B0B0B0',
                fontSize: { xs: '14px', sm: '16px' },
                opacity: 1,
              },
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="body2"
            color="#636366"
            fontWeight={500}
            sx={{ fontSize: '13px', mb: 1 }}
          >
            Account Number{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <Controller
            name="bankNumber"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                type="number"
                placeholder="Bank Account Number"
                error={!!error}
                InputLabelProps={{ shrink: false }}
                FormHelperTextProps={{ sx: { display: 'none' } }}
                sx={{
                  width: '100%',
                  '& .MuiInputBase-root': {
                    bgcolor: 'white',
                    borderRadius: 1,
                    height: { xs: 40, sm: 48 },
                  },
                  '& .MuiInputLabel-root': {
                    display: 'none',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#B0B0B0',
                    fontSize: { xs: '14px', sm: '16px' },
                    opacity: 1,
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
            {methods.formState.errors.bankNumber?.message}
          </Typography>
        </Box>

        <Box gridColumn={{ md: 'span 2' }}>
          <Typography
            variant="body2"
            color="#636366"
            fontWeight={500}
            sx={{ fontSize: '13px', mb: 1 }}
          >
            IC / Passport No.{' '}
            <Box component="span" sx={{ color: 'error.main' }}>
              *
            </Box>
          </Typography>
          <RHFTextField
            name="icPassportNumber"
            placeholder="IC / Passport Number"
            InputLabelProps={{ shrink: false }}
            FormHelperTextProps={{ sx: { display: 'none' } }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': {
                bgcolor: 'white',
                borderRadius: 1,
                height: { xs: 40, sm: 48 },
              },
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#B0B0B0',
                fontSize: { xs: '14px', sm: '16px' },
                opacity: 1,
              },
            }}
          />
        </Box>

        <Stack
          spacing={3}
          alignItems={{ xs: 'center', sm: 'flex-end' }}
          sx={{ mt: 3 }}
          gridColumn={{ md: 'span 2' }}
        >
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
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
      </Box>
    </FormProvider>
  );
};

export default PaymentFormProfile;

PaymentFormProfile.propTypes = {
  user: PropTypes.object,
};
