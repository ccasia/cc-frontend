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
} from '@mui/material';

import useGetPackages from 'src/hooks/use-get-packges';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const packageSchema = Yup.object().shape({
  packageName: Yup.string().required('Package Name is required'),
  priceMYR: Yup.string().required('Price in MYR is required'),
  priceSGD: Yup.string().required('Price in SGD is required'),
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
  priceMYR: '',
  priceSGD: '',
  totalUGCCredits: '',
  validityPeriod: '',
};

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children, required = true, ...others }) => (
  <Stack spacing={1} alignItems="start" width={1}>
    <FormLabel 
      required={required}
      sx={{ 
        fontWeight: 600, 
        color: '#374151', 
        fontSize: '0.875rem',
        '& .MuiFormLabel-asterisk': {
          color: '#dc2626',
        },
      }} 
      {...others}
    >
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
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.package.create, data);
      enqueueSnackbar(res?.data?.message || 'Package created successfully!');
      mutate();
      reset();
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to create package', { variant: 'error' });
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #f0f0f0',
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: '#f0f9ff',
                    border: '1px solid rgba(19, 64, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="heroicons:cube-20-solid" width={20} height={20} sx={{ color: '#1340ff' }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#111827',
                      fontSize: '1.25rem',
                      mb: 0.5,
                    }}
                  >
                    Create New Package
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#6b7280', 
                      fontSize: '0.875rem',
                    }}
                  >
                    Set up a new package with pricing and credits
                  </Typography>
                </Box>
              </Stack>
              <IconButton
                onClick={handleClose}
                sx={{
                  color: '#6b7280',
                  '&:hover': {
                    bgcolor: '#f3f4f6',
                    color: '#374151',
                  },
                }}
              >
                <Iconify icon="heroicons:x-mark-20-solid" width={20} height={20} />
              </IconButton>
            </Stack>
          </Box>

          {/* Form Content */}
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              },
              mb: 4,
            }}
          >
            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
              <FormField label="Package Name">
                <RHFTextField 
                  name="packageName" 
                  placeholder="Enter package name"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1340ff',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1340ff',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </FormField>
            </Box>

            <FormField label="Price in MYR">
              <NumericFormat
                customInput={TextField}
                thousandSeparator
                prefix="RM "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                onValueChange={(values) => setValue('priceMYR', values.value)}
                placeholder="0.00"
                variant="outlined"
                fullWidth
                error={!!errors.priceMYR}
                helperText={errors.priceMYR?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                      borderWidth: 2,
                    },
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
                placeholder="0.00"
                variant="outlined"
                fullWidth
                error={!!errors.priceSGD}
                helperText={errors.priceSGD?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </FormField>

            <FormField label="Total UGC Credits">
              <RHFTextField
                name="totalUGCCredits"
                placeholder="Enter number of credits"
                type="number"
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </FormField>

            <FormField label="Validity Period">
              <RHFTextField
                name="validityPeriod"
                placeholder="Enter months"
                type="number"
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        mr: 1,
                      }}
                    >
                      months
                    </Typography>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1340ff',
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </FormField>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ pt: 3, borderTop: '1px solid #f0f0f0' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={isSubmitting}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    bgcolor: '#f9fafb',
                  },
                  '&:disabled': {
                    borderColor: '#e5e7eb',
                    color: '#9ca3af',
                  },
                }}
              >
                Cancel
              </Button>

              <LoadingButton 
                type="submit" 
                variant="contained"
                loading={isSubmitting}
                sx={{
                  bgcolor: '#1340ff',
                  color: '#ffffff',
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#0f35d1',
                  },
                  '&:disabled': {
                    bgcolor: '#e5e7eb',
                    color: '#9ca3af',
                  },
                }}
              >
                Create Package
              </LoadingButton>
            </Stack>
          </Box>
        </Box>
      </FormProvider>
    </Dialog>
  );
};

export default PackageCreate;

PackageCreate.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
