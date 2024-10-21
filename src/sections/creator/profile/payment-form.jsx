import React from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import { Box, Paper, Typography } from '@mui/material';

import { banks } from 'src/contants/bank';
import { updatePaymentForm } from 'src/api/paymentForm';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

const PaymentFormProfile = ({ user }) => {
  const paymentForm = user?.paymentForm;

  const methods = useForm({
    defaultValues: {
      bankName: null || { bank: paymentForm?.bankName },
      bankNumber: paymentForm?.bankAccountNumber || '',
      // bodyMeasurement: paymentForm?.bodyMeasurement || '',
      // allergies: paymentForm?.allergies?.map((allergy) => ({ name: allergy })) || [{ name: '' }],
      icPassportNumber: paymentForm?.icNumber || '',
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isDirty, isSubmitting },
  } = methods;

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
          <RHFAutocomplete
            label="Choose a bank"
            name="bankName"
            options={banks}
            getOptionLabel={(option) => option.bank}
          />
          <RHFTextField name="bankNumber" type="number" label="Bank Account Number" />
          <RHFTextField name="icPassportNumber" type="number" label="IC / Passport Number" />
          {/* <RHFTextField
            name="bodyMeasurement"
            type="number"
            label="Body Measurement"
            InputProps={{
              endAdornment: <InputAdornment position="start">cm</InputAdornment>,
            }}
          /> */}
          {/* <Stack spacing={1}>
            {fields.map((item, index) => (
              <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                <RHFTextField name={`allergies[${index}].name`} label={`Allergy ${index + 1}`} />
                <IconButton onClick={() => remove(index)}>
                  <Iconify icon="material-symbols:remove" />
                </IconButton>
              </Stack>
            ))}
            <Button size="small" variant="contained" onClick={() => insert({ name: '' })}>
              Add more allergy
            </Button>
          </Stack> */}
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
