import React from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import * as Yup from 'yup';
import { RHFTextField } from 'src/components/hook-form';
import PropTypes from 'prop-types';

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

const PackageCreate = ({ open, onClose }) => {
  const methods = useForm({
    resolver: yupResolver(packageSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = (data) => {
    console.log(data);
    // Handle form submission
  };

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
            sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, flexGrow: 1 }}
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
        <FormProvider {...methods}>
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
            {/* <Controller
              name="packageName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Package Name"
                  error={!!errors.packageName}
                  helperText={errors.packageName ? errors.packageName.message : ''}
                />
              )}
            />
            <Controller
              name="packageType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Package Type"
                  error={!!errors.packageType}
                  helperText={errors.packageType ? errors.packageType.message : ''}
                />
              )}
            />
            <Controller
              name="valueMYR"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Value in MYR"
                  type="number"
                  error={!!errors.valueMYR}
                  helperText={errors.valueMYR ? errors.valueMYR.message : ''}
                />
              )}
            />
            <Controller
              name="valueSGD"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Value in SGD"
                  type="number"
                  error={!!errors.valueSGD}
                  helperText={errors.valueSGD ? errors.valueSGD.message : ''}
                />
              )}
            />
            <Controller
              name="totalUGCCredits"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Total UGC Credits"
                  type="number"
                  error={!!errors.totalUGCCredits}
                  helperText={errors.totalUGCCredits ? errors.totalUGCCredits.message : ''}
                />
              )}
            />
            <Controller
              name="validityPeriod"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Validity Period"
                  type="number"
                  error={!!errors.validityPeriod}
                  helperText={errors.validityPeriod ? errors.validityPeriod.message : ''}
                />
              )}
            /> */}
            <RHFTextField
              name="packageName"
              label="Package Name"
              error={!!errors.packageName}
              helperText={errors.packageName ? errors.packageName.message : ''}
            />
            <RHFTextField
              name="packageType"
              label="Package Type"
              error={!!errors.packageType}
              helperText={errors.packageType ? errors.packageType.message : ''}
            />
            <RHFTextField
              name="valueMYR"
              label="Value in MYR"
              type="number"
              error={!!errors.valueMYR}
              helperText={errors.valueMYR ? errors.valueMYR.message : ''}
            />
            <RHFTextField
              name="valueSGD"
              label="Value in SGD"
              type="number"
              error={!!errors.valueSGD}
              helperText={errors.valueSGD ? errors.valueSGD.message : ''}
            />
            <RHFTextField
              name="totalUGCCredits"
              label="Total UGC Credits"
              type="number"
              error={!!errors.totalUGCCredits}
              helperText={errors.totalUGCCredits ? errors.totalUGCCredits.message : ''}
            />
            <RHFTextField
              name="validityPeriod"
              label="Validity Period"
              type="number"
              error={!!errors.validityPeriod}
              helperText={errors.validityPeriod ? errors.validityPeriod.message : ''}
            />
          </Box>
          <Box mt={2} mb={2} display="flex" justifyContent="flex-end">
            <Button variant="outlined" color="error" onClick={onClose}>
              Cancel
            </Button>
            <Box mr={1} />
            {/* <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={handleSubmit(onSubmit)}
            > */}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={handleSubmit(onSubmit)}
            >
              Submit
            </Button>
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
