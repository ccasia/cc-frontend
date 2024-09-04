import React from 'react';
import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Box,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { banks } from 'src/contants/bank';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

const CreatorForm = ({ dialog, user }) => {
  const schema = yup.object().shape({
    fullName: yup.string().required('Full name is required'),
    address: yup.string().required('Address is required'),
    icNumber: yup.string().required('IC/Passport number is required'),
    bankName: yup.string().required('Bank Name is required'),
    accountName: yup.string().required('Account Name is required'),
    accountNumber: yup.string().required('Account Number is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: user?.name || '',
      address: user?.creator?.address || '',
      icNumber: user?.paymentForm?.icNumber || '',
      bankName: user?.paymentForm?.bankName || '',
      accountName: user?.name || '',
      accountNumber: user?.paymentForm?.bankAccountNumber || '',
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.creators.updateCreatorform, {
        ...data,
        userId: user?.id,
      });
      enqueueSnackbar(res?.data?.message);
      dialog.onFalse();
      mutate(endpoints.auth.me);
    } catch (error) {
      enqueueSnackbar('error', {
        variant: 'error',
      });
    }
  });

  return (
    <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Complete this form</DialogTitle>
        <DialogContent>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
            gap={1}
            mt={2}
          >
            <RHFTextField name="fullName" label="Full name" />
            <RHFTextField name="address" label="Address" multiline />
            <RHFTextField name="icNumber" label="IC/Passport Number" />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Bank Details</Typography>
            <Box
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
              gap={1}
              mt={2}
            >
              <RHFAutocomplete
                label="Choose a bank"
                name="bankName"
                options={banks.map((item) => item.bank)}
                getOptionLabel={(option) => option}
              />
              {/* <RHFTextField name="bankName" label="Bank name" /> */}
              <RHFTextField name="accountName" label="Name on Account" />
              <RHFTextField name="accountNumber" label="Account Number" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button size="small" variant="outlined" onClick={dialog.onFalse}>
            Close
          </Button>
          <Button size="small" variant="contained" type="submit">
            Submit
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default CreatorForm;

CreatorForm.propTypes = {
  dialog: PropTypes.object,
  user: PropTypes.object,
};
