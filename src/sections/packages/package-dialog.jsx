import useSWR from 'swr';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { NumericFormat } from 'react-number-format';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Button,
  MenuItem,
  FormLabel,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';
import useGetPackages from 'src/hooks/use-get-packges';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelect, RHFTextField, RHFDatePicker } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children, ...others }) => (
  <Stack spacing={0.5} alignItems="start" width={1}>
    <FormLabel required sx={{ fontWeight: 500, color: '#636366', fontSize: '12px' }} {...others}>
      {label}
    </FormLabel>
    {children}
  </Stack>
);

const defaultValues = {
  packageId: '',
  packageType: '',
  packageValue: '',
  totalUGCCredits: '',
  validityPeriod: '',
  currency: '',
  invoiceDate: null,
};

const schema = Yup.object().shape({
  currency: Yup.string().required('Currency is required'),
  packageType: Yup.string().required('Package type is required '),
  packageValue: Yup.string().required('Package price is required'),
  totalUGCCredits: Yup.string().required('Total credits is required'),
  validityPeriod: Yup.string().required('Validity period is required'),
  invoiceDate: Yup.date()
    .required('Invoice date is required')
    .typeError('PackageInvoice must be a valid date'),
});

const PackageCreateDialog = ({ open, onClose, setValue: set, clientId, onRefresh }) => {
  const { data: packages, isLoading } = useGetPackages();
  const { data: subscriptions, isLoading: subsLoading } = useSWR('/api/subscription/', fetcher);
  const { mutate } = useGetCompany();
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  const packageType = watch('packageType');
  const currency = watch('currency');
  const packageValue = watch('packageValue');
  const invoiceDate = watch('invoiceDate');
  const validitiyPeriod = watch('validityPeriod');

  const onSubmit = handleSubmit(async (data) => {
    const updatedData = {
      ...data,
      clientId,
    };

    try {
      const res = await axiosInstance.patch(
        `${endpoints.company.linkPackage(clientId)}`,
        updatedData
      );
      enqueueSnackbar(res?.data?.message);
      mutate();

      if (onRefresh) {
        onRefresh();
      }

      onClose();
      reset();
    } catch (error) {
      enqueueSnackbar(error, { variant: 'error' });
    }
  });

  useEffect(() => {
    if (packageType && currency) {
      if (packageType !== 'Custom') {
        const item = packages.find((c) => c.id === packageType);

        const amount = item.prices.find((c) => c.currency === currency)?.amount;
        setValue('packageId', item.id);
        setValue('validityPeriod', item.validityPeriod);
        setValue('packageValue', parseFloat(amount));
        setValue('totalUGCCredits', item.credits);
      } else {
        setValue('packageId', '');
        setValue('validityPeriod', '');
        setValue('packageValue', '');
        setValue('totalUGCCredits', '');
      }
      setValue('subsID', `P000${subscriptions.length + 1}`);
    }
  }, [setValue, packageType, currency, packages, subscriptions]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  if (isLoading || subsLoading) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="bx:package" width={30} />
          <Typography
            variant="h3"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              letterSpacing: 0.8,
            }}
          >
            Create Package
          </Typography>
        </Stack>
      </DialogTitle>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1,1fr)', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <FormField required={false} label="Package Type">
              <RHFSelect name="packageType">
                <MenuItem disabled sx={{ fontStyle: 'italic' }}>
                  Select package type
                </MenuItem>
                {/* {['Trail', 'Basic', 'Essential', 'Pro', 'Custom'].map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))} */}
                {packages?.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
                <MenuItem key="custom" value="Custom">
                  Custom
                </MenuItem>
              </RHFSelect>
            </FormField>

            <FormField required={false} label="Currency">
              <RHFSelect name="currency">
                <MenuItem disabled sx={{ fontStyle: 'italic' }}>
                  Select currency
                </MenuItem>
                {['MYR', 'SGD'].map((e) => (
                  <MenuItem key={e} value={e}>
                    {e}
                  </MenuItem>
                ))}
              </RHFSelect>
            </FormField>

            {packageType && currency && (
              <>
                {/* <FormField required={false} label="Package ID">
                  <RHFTextField
                    name="subsID"
                    disabled={packageType !== 'Custom'}
                    placeholder="Package ID"
                  />
                </FormField> */}
                <FormField required={false} label="Package Value">
                  <NumericFormat
                    value={packageValue}
                    disabled={packageType !== 'Custom'}
                    customInput={TextField}
                    thousandSeparator
                    prefix={currency === 'MYR' ? 'RM ' : '$ '}
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    onValueChange={(items) => setValue('packageValue', items.value)}
                    placeholder={currency === 'MYR' ? 'Price in MYR' : 'Price in SGD'}
                    variant="outlined"
                    fullWidth
                    error={errors.packageValue}
                    helperText={errors.packageValue && errors.packageValue.message}
                  />
                </FormField>
                <FormField required={false} label="Total UGC Credits">
                  <RHFTextField
                    name="totalUGCCredits"
                    disabled={packageType !== 'Custom'}
                    placeholder="Total UGC Credits"
                    type={packageType === 'Custom' ? 'number' : ''}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </FormField>

                <FormField required={false} label="Validity Period (month)">
                  <RHFTextField
                    name="validityPeriod"
                    disabled={packageType !== 'Custom'}
                    placeholder="Validity Period"
                    type={packageType === 'Custom' ? 'number' : ''}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    InputProps={{ inputProps: { min: 1 } }}
                    helperText={
                      invoiceDate
                        ? `Valid until ${dayjs(invoiceDate).add(validitiyPeriod, 'month').format('LL')}`
                        : ''
                    }
                  />
                </FormField>

                <FormField label="Invoice Date">
                  <RHFDatePicker name="invoiceDate" />
                </FormField>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            sx={{ borderRadius: 0.6 }}
            onClick={() => {
              onClose();
              set('client', null);
            }}
          >
            Close
          </Button>
          <LoadingButton
            //   loading={loading}
            variant="contained"
            type="submit"
            //   onClick={onSubmit}
            sx={{ borderRadius: 0.6 }}
          >
            Create
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default PackageCreateDialog;

PackageCreateDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  setValue: PropTypes.func,
  clientId: PropTypes.string,
  onRefresh: PropTypes.func,
};
