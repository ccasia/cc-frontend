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
  FormLabel,
  TextField,
  Typography,
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
      PaperProps={{
        sx: { maxWidth: 720, borderRadius: 0.8 },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mdi:package-variant-closed" width={28} />
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              flexGrow: 1,
            }}
            fontSize={30}
          >
            Create a new package
          </Typography>
          <IconButton size="small" sx={{ borderRadius: 1 }} onClick={onClose}>
            <Iconify icon="material-symbols:close-rounded" width={24} />
          </IconButton>
        </Stack>
      </DialogTitle>

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
              <RHFTextField name="packageName" placeholder="Package Name" />
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
              />
            </FormField>
          </Box>

          <Box mt={2} mb={2} display="flex" justifyContent="flex-end">
            <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 0.8 }}>
              Cancel
            </Button>
            <Box mr={1} />

            <LoadingButton type="submit" variant="contained" sx={{ borderRadius: 0.8 }}>
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
