import * as yup from 'yup';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Box, Paper, TextField, Typography, createFilterOptions } from '@mui/material';

import { banks } from 'src/contants/bank';
import { updatePaymentForm } from 'src/api/paymentForm';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

const schema = yup.object().shape({
  bankName: yup.string().required('Bank name is required'),
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

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      bankName: paymentForm?.bankName || '',
      bankNumber: paymentForm?.bankAccountNumber || '',
      bankAccName: paymentForm?.bankAccountName || '',
      icPassportNumber: paymentForm?.icNumber || '',
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
    <Box component={Paper} p={2}>
      <Typography variant="h6" mb={2}>
        Payment Form
      </Typography>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
          gap={2}
        >
          {/* <RHFAutocomplete
            label="Choose a bank"
            name="bankName"
            options={banks.map((bank) => bank.bank)}
            getOptionLabel={(option) => option}
          /> */}
          <RHFAutocomplete
            selectOnFocus
            clearOnBlur
            label="Bank Account Name"
            name="bankName"
            options={banks.map((item) => item.bank)}
            getOptionLabel={(option) => option}
            filterOptions={(options, params) => {
              const { inputValue } = params;
              const filtered = filter(options, params);

              // Suggest the creation of a new value
              const isExisting = options.some(
                (option) => option.toLowerCase() === inputValue.toLowerCase()
              );

              if (inputValue !== '' && !isExisting) {
                filtered.push(`Add ${inputValue}`);
              }

              return filtered;
            }}
            sx={{
              '& .MuiInputBase-root': {
                background: '#FFFFFF',
                border: '1px solid #EBEBEB',
                borderRadius: '8px',
              },
              '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
                padding: '5px 4px 5px 4px',
              },
              '& .MuiLoadingButton-root.Mui-disabled': {
                backgroundColor: '#B0BEC5',
                color: '#FFFFFF',
                opacity: 1,
                cursor: 'not-allowed',
              },
            }}
          />

          <Controller
            name="bankNumber"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                type="number"
                label="Bank Account Number"
                error={!!error}
                helperText={!!error && error?.message}
              />
            )}
          />
          <RHFTextField name="bankAccName" label="Bank Account Name" />
          <RHFTextField name="icPassportNumber" label="IC / Passport Number" />
        </Box>
        <Box sx={{ textAlign: 'end', mt: 2 }}>
          <LoadingButton
            size="small"
            variant="outlined"
            type="submit"
            disabled={!isDirty}
            loading={isSubmitting}
          >
            Save changes
          </LoadingButton>
        </Box>
      </FormProvider>
    </Box>
  );
};

export default PaymentFormProfile;

PaymentFormProfile.propTypes = {
  user: PropTypes.object,
};
