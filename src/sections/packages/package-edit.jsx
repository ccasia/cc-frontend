import * as Yup from 'yup';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { NumericFormat } from 'react-number-format';
import { useForm } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Dialog,
  Divider,
  TextField,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const packageSchema = Yup.object().shape({
  name: Yup.string().required('Package name is required'),
  priceMYR: Yup.string().required('Price in MYR is required'),
  priceSGD: Yup.string().required('Price in SGD is required'),
  credits: Yup.number()
    .required('UGC Credits is required')
    .positive('UGC Credits must be a positive number')
    .integer('UGC Credits must be an integer'),
  validityPeriod: Yup.number()
    .required('Validity Period is required')
    .positive('Validity Period must be a positive number')
    .integer('Validity Period must be an integer'),
});

const defaultValues = {
  name: '',
  priceMYR: '',
  priceSGD: '',
  credits: '',
  validityPeriod: '',
};

function getPriceAmount(prices, currency) {
  const match = (prices || []).find((p) => p?.currency === currency);
  const amount = match?.amount;
  if (typeof amount === 'number') return amount;
  return amount ? Number(amount) : '';
}

const PackageEdit = ({ open, onClose, item, mutate }) => {
  const methods = useForm({
    resolver: yupResolver(packageSchema),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  const priceMYR = watch('priceMYR');
  const priceSGD = watch('priceSGD');

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!item?.id) return;

    try {
      const payload = {
        name: data.name,
        priceMYR: data.priceMYR,
        priceSGD: data.priceSGD,
        credits: Number(data.credits),
        validityPeriod: Number(data.validityPeriod),
      };

      const res = await axiosInstance.patch(endpoints.package.update(item.id), payload);
      enqueueSnackbar(res?.data?.message || 'Package successfully updated');
      mutate?.();
      handleClose();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || error?.message || 'Error updating package', {
        variant: 'error',
      });
    }
  });

  useEffect(() => {
    if (item && open) {
      reset({
        name: item.name ?? '',
        priceMYR: getPriceAmount(item.prices, 'MYR'),
        priceSGD: getPriceAmount(item.prices, 'SGD'),
        credits: item.credits ?? '',
        validityPeriod: item.validityPeriod ?? '',
      });
    }
  }, [item, open, reset]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
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
          fontSize: { xs: '28px !important', sm: '40px !important' },
          fontWeight: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          lineHeight: 1.2,
        }}
      >
        Edit Package
        <IconButton onClick={handleClose} size="small">
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent
          sx={{
            pt: 3,
            pb: 0,
            px: 3,
            maxHeight: 'calc(100vh - 220px)',
            overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              columnGap: 3,
              rowGap: 2.5,
            }}
          >
            <RHFTextField
              name="name"
              label="Package Name"
              error={errors.name}
              helperText={errors.name?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  minHeight: 48,
                  borderRadius: 1,
                },
              }}
            />

            <RHFTextField
              name="credits"
              label="UGC Credits"
              type="number"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
              error={errors.credits}
              helperText={errors.credits?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  minHeight: 48,
                  borderRadius: 1,
                },
              }}
            />

            <NumericFormat
              value={priceMYR}
              customInput={TextField}
              thousandSeparator
              prefix="RM "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              onValueChange={(values) => setValue('priceMYR', values.value, { shouldValidate: true })}
              label="Price in MYR"
              variant="outlined"
              fullWidth
              error={Boolean(errors.priceMYR)}
              helperText={errors.priceMYR?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  minHeight: 48,
                  borderRadius: 1,
                },
              }}
            />

            <NumericFormat
              value={priceSGD}
              customInput={TextField}
              thousandSeparator
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              onValueChange={(values) => setValue('priceSGD', values.value, { shouldValidate: true })}
              label="Price in SGD"
              variant="outlined"
              fullWidth
              error={Boolean(errors.priceSGD)}
              helperText={errors.priceSGD?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  minHeight: 48,
                  borderRadius: 1,
                },
              }}
            />

            <RHFTextField
              name="validityPeriod"
              label="Validity Period (months)"
              type="number"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
              error={errors.validityPeriod}
              helperText={errors.validityPeriod?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  minHeight: 48,
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 3 }}>
          <Button
            onClick={handleClose}
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

          <LoadingButton
            type="submit"
            loading={isSubmitting}
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
            Save Changes
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default PackageEdit;

PackageEdit.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  item: PropTypes.object,
  mutate: PropTypes.func,
};
