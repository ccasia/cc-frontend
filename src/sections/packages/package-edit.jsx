import * as Yup from 'yup';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, FormProvider } from 'react-hook-form';

import {
  Stack,
  Button,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';

const packageSchema = Yup.object().shape({
  packageName: Yup.string().required('Package Name is required'),
  packageType: Yup.string().required('Package Type is required'),
  valueMYR: Yup.number()
    .required('Value in MYR is required')
    .positive('Value must be a positive number'),
  valueSGD: Yup.number()
    .required('Value in SGD is required')
    .positive('Value must be a positive number'),
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
  packageType: '',
  valueMYR: '',
  valueSGD: '',
  totalUGCCredits: '',
  validityPeriod: '',
};

const PackageEdit = ({ open, onClose, item }) => {
  const methods = useForm({
    resolver: yupResolver(packageSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = methods;

  // const onSubmit = (data) => {
  //   console.log(data);
  // };
  useEffect(() => {
    if (item) {
      reset({
        packageName: item.packageName,
        packageType: item.packageType,
        valueMYR: item.valueMYR,
        valueSGD: item.valueSGD,
        totalUGCCredits: item.totalUGCCredits,
        validityPeriod: item.validityPeriod,
      });
    }
  }, [item, reset]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Edit Package</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="bi:x-lg" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <Stack spacing={2}>
            <RHFTextField
              name="packageName"
              label="Package Name"
              control={control}
              error={errors.packageName}
              helperText={errors.packageName?.message}
            />
            <RHFTextField
              name="packageType"
              label="Package Type"
              control={control}
              error={errors.packageType}
              helperText={errors.packageType?.message}
            />
            <RHFTextField
              name="valueMYR"
              label="Value in MYR"
              control={control}
              error={errors.valueMYR}
              helperText={errors.valueMYR?.message}
            />
            <RHFTextField
              name="valueSGD"
              label="Value in SGD"
              control={control}
              error={errors.valueSGD}
              helperText={errors.valueSGD?.message}
            />
            <RHFTextField
              name="totalUGCCredits"
              label="Total UGC Credits"
              control={control}
              error={errors.totalUGCCredits}
              helperText={errors.totalUGCCredits?.message}
            />
            <RHFTextField
              name="validityPeriod"
              label="Validity Period"
              control={control}
              error={errors.validityPeriod}
              helperText={errors.validityPeriod?.message}
            />
          </Stack>
          <DialogActions>
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
export default PackageEdit;

PackageEdit.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  item: PropTypes.object,
};
