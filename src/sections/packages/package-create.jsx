import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { NumericFormat } from 'react-number-format';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Divider,
  FormLabel,
  TextField,
  IconButton,
  DialogTitle,
  DialogContent,
} from '@mui/material';

import useGetPackages from 'src/hooks/use-get-packges';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const packageSchema = Yup.object().shape({
  packageName: Yup.string().required('Package Name is required'),
  // packageType: Yup.string().required('Package Type is required'),
  priceMYR: Yup.string().required('Price in MYR is required'),
  // .positive('Value must be a positive number'),
  priceSGD: Yup.string().required('Price in SGD is required'),
  // .positive('Value must be a positive number'),
  totalUGCCredits: Yup.number()
    .required('Total UGC Credits is required')
    .positive('Total UGC Credits must be a positive number')
    .integer('Total UGC Credits must be an integer'),
  validityPeriod: Yup.number()
    .required('Validity Period is required')
    .positive('Validity Period must be a positive number')
    .integer('Validity Period must be an integer'),
});

const defaultValues = {
  packageName: '',
  // packageType: '',
  priceMYR: '',
  priceSGD: '',
  totalUGCCredits: '',
  validityPeriod: '',
  // invoiceDate: null,
};

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children, ...others }) => (
  <Stack spacing={0.5} alignItems="start" width={1}>
    <FormLabel required sx={{ fontWeight: 500, color: '#636366', fontSize: '12px' }} {...others}>
      {label}
    </FormLabel>
    {children}
  </Stack>
);

const PackageCreate = ({ open, onClose }) => {
  const methods = useForm({
    resolver: yupResolver(packageSchema),
    defaultValues,
  });

  const { mutate } = useGetPackages();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.package.create, data);

      enqueueSnackbar(res?.data?.message);
      mutate();
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message, { variant: 'error' });
    }
  });

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: 'Instrument Serif',
          fontSize: '40px !important',
          fontWeight: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          lineHeight: 1.2,
        }}
      >
        Create Package
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <DialogContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Box
            rowGap={2}
            columnGap={3}
            display="grid"
            mt={1}
            mb={2}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <FormField label="Package Name">
              <RHFTextField
                name="packageName"
                placeholder="Package Name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
              />
            </FormField>

            <FormField label="Price in MYR">
              <NumericFormat
                customInput={TextField}
                thousandSeparator
                prefix="RM "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                onValueChange={(values) => setValue('priceMYR', values.value)}
                placeholder="Price in MYR"
                variant="outlined"
                fullWidth
                error={errors.priceMYR}
                helperText={errors.priceMYR && errors.priceMYR.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
              />
            </FormField>

            <FormField label="Price in SGD">
              <NumericFormat
                customInput={TextField}
                thousandSeparator
                prefix="$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                onValueChange={(values) => setValue('priceSGD', values.value)}
                placeholder="Price in SGD"
                variant="outlined"
                fullWidth
                error={errors.priceSGD}
                helperText={errors.priceSGD && errors.priceSGD.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
              />
            </FormField>
            <FormField label="Total UGC Credits">
              <RHFTextField
                name="totalUGCCredits"
                placeholder="Total UGC Credits"
                type="number"
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
              />
            </FormField>
            <FormField label="Validity Period ( in months )">
              <RHFTextField
                name="validityPeriod"
                placeholder="Validity Period"
                type="number"
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
              />
            </FormField>

            {/* <FormField label="Invoice Date">
              <RHFDatePicker name="invoiceDate" />
            </FormField> */}
          </Box>

          <Box mt={2} mb={2} display="flex" justifyContent="flex-end">
            <Button
              onClick={onClose}
              sx={{
                bgcolor: '#FFFFFF',
                border: '1.5px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1.15,
                color: '#1340FF',
                height: 44,
                px: 2.5,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(19, 64, 255, 0.08)',
                  border: '1.5px solid #1340FF',
                  borderBottom: '3px solid #1340FF',
                  color: '#1340FF',
                },
              }}
            >
              Cancel
            </Button>
            <Box mr={1} />

            <LoadingButton
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#203ff5',
                border: '1px solid #203ff5',
                borderBottom: '3px solid #1933cc',
                height: 44,
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                px: 3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
                '&:disabled': {
                  bgcolor: '#e7e7e7',
                  color: '#999999',
                  border: '1px solid #e7e7e7',
                  borderBottom: '3px solid #d1d1d1',
                },
              }}
            >
              Create
            </LoadingButton>
          </Box>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default PackageCreate;

PackageCreate.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
