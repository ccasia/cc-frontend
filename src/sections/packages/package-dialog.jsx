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
  Collapse,
  FormLabel,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';

import useGetPackages from 'src/hooks/use-get-packges';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField, RHFDatePicker } from 'src/components/hook-form';
import {
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

import StatTile from '../campaign/create/components/stat-tile';
import { EASE_OUT } from '../campaign/create/components/motion';
import ChipSelect from '../campaign/create/components/chip-select';
import {
  singleLineSx,
  helperTextSx,
} from '../campaign/create/components/field-styles';

const CURRENCIES = ['MYR', 'SGD'];
const CUSTOM = 'Custom';

const defaultValues = {
  packageId: '',
  packageType: '',
  packageValue: '',
  totalUGCCredits: '',
  validityPeriod: '',
  currency: 'MYR',
  invoiceDate: null,
};

const schema = Yup.object().shape({
  currency: Yup.string().required('Pick a currency.'),
  packageType: Yup.string().required('Pick a package.'),
  packageValue: Yup.string().required('Enter the package price.'),
  totalUGCCredits: Yup.string().required('Enter the total credits.'),
  validityPeriod: Yup.string().required('Enter the validity period.'),
  invoiceDate: Yup.date().required('Pick the invoice date.').typeError('Pick a valid date.'),
});

const pricePrefix = (currency) => (currency === 'MYR' ? 'RM ' : '$ ');
const plural = (n, word) => `${word}${Number(n) === 1 ? '' : 's'}`;

const Field = ({ label, hint, children, required = true }) => (
  <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
    <FormLabel
      required={required}
      sx={{
        fontWeight: 700,
        fontSize: '0.875rem',
        color: 'black',
        '& .MuiFormLabel-asterisk': { color: '#FF3500' },
      }}
    >
      {label}
    </FormLabel>
    {children}
    {hint && (
      <Typography sx={{ fontSize: 12, lineHeight: '16px', color: '#8E8E93' }}>{hint}</Typography>
    )}
  </Stack>
);

Field.propTypes = {
  label: PropTypes.string,
  hint: PropTypes.node,
  children: PropTypes.node,
  required: PropTypes.bool,
};

const blockMinus = (e) => {
  if (e.key === '-' || e.key === 'e') e.preventDefault();
};

const PackageCreateDialog = ({ open, onClose, clientId, onRefresh }) => {
  const { data: packages, isLoading } = useGetPackages();
  const { data: subscriptions, isLoading: subsLoading } = useSWR('/api/subscription/', fetcher);
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
    formState: { errors, isValid, isSubmitting },
  } = methods;

  const packageType = watch('packageType');
  const currency = watch('currency');
  const packageValue = watch('packageValue');
  const totalUGCCredits = watch('totalUGCCredits');
  const invoiceDate = watch('invoiceDate');
  const validityPeriod = watch('validityPeriod');

  const isCustom = packageType === CUSTOM;
  const showDetails = Boolean(packageType && currency);
  // Basic is retired, and Custom is added once at the end
  const options =
    packages?.filter((item) => !['custom', 'basic'].includes(item.name.toLowerCase())) || [];
  const byId = Object.fromEntries(options.map((item) => [item.id, item]));
  const optionIds = [...options.map((item) => item.id), CUSTOM];

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch(endpoints.company.linkPackage(clientId), { ...data, clientId });
      onRefresh?.();
      onClose();
      reset();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to link package', { variant: 'error' });
    }
  });

  useEffect(() => {
    if (!packageType || !currency) return;
    if (packageType !== CUSTOM) {
      const item = packages.find((c) => c.id === packageType);
      const amount = item.prices.find((c) => c.currency === currency)?.amount;
      setValue('packageId', item.id);
      setValue('validityPeriod', item.validityPeriod);
      setValue('packageValue', amount == null ? '' : parseFloat(amount));
      setValue('totalUGCCredits', item.credits);
    } else {
      setValue('packageId', '');
      setValue('validityPeriod', '');
      setValue('packageValue', '');
      setValue('totalUGCCredits', '');
    }
    setValue('subsID', `P000${subscriptions.length + 1}`);
  }, [setValue, packageType, currency, packages, subscriptions]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const validUntil =
    invoiceDate && validityPeriod
      ? `Valid until ${dayjs(invoiceDate).add(validityPeriod, 'month').format('LL')}`
      : null;

  const loading = isLoading || subsLoading;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="package-dialog-title"
      PaperProps={{ sx: { borderRadius: '12px', p: 3 } }}
    >
      <Box sx={{ position: 'relative', pr: 6 }}>
        <Typography
          id="package-dialog-title"
          sx={{
            fontFamily: 'Instrument Serif',
            fontSize: 36,
            lineHeight: '40px',
            color: '#231F20',
          }}
        >
          Create Package
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 14, color: '#8E8E93' }}>
          Link a package to this client. Its credits pay for their campaigns.
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            color: '#636366',
            '@media (hover: hover) and (pointer: fine)': {
              '&:hover': { bgcolor: 'rgba(35, 31, 32, 0.06)', color: '#231F20' },
            },
          }}
        >
          <Iconify icon="eva:close-fill" width={24} />
        </IconButton>
      </Box>

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ height: 160 }}>
          <CircularProgress size={24} sx={{ color: '#8E8E93' }} />
        </Stack>
      ) : (
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5} sx={{ mt: 3, ...helperTextSx }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Field label="Package">
                <ChipSelect
                  single
                  name="packageType"
                  options={optionIds}
                  getTitle={(id) => (id === CUSTOM ? CUSTOM : byId[id]?.name)}
                  getDescription={(id) =>
                    id === CUSTOM
                      ? 'Set your own price, credits and validity'
                      : `${byId[id]?.credits} ${plural(byId[id]?.credits, 'credit')} · ${byId[id]?.validityPeriod} ${plural(byId[id]?.validityPeriod, 'month')}`
                  }
                  placeholder="Select package"
                />
              </Field>

              <Box sx={{ width: { xs: 1, sm: 160 }, flexShrink: 0 }}>
                <Field label="Currency">
                  <ChipSelect
                    single
                    name="currency"
                    options={CURRENCIES}
                    placeholder="Select currency"
                  />
                </Field>
              </Box>
            </Stack>

            <Collapse in={showDetails} timeout={200} easing={EASE_OUT} unmountOnExit>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                {isCustom ? (
                  <>
                    <Field label="Price">
                      <NumericFormat
                        value={packageValue}
                        customInput={TextField}
                        thousandSeparator
                        prefix={pricePrefix(currency)}
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        onValueChange={(items) =>
                          setValue('packageValue', items.value, { shouldValidate: true })
                        }
                        placeholder={`Price in ${currency}`}
                        fullWidth
                        sx={singleLineSx}
                        error={Boolean(errors.packageValue)}
                        helperText={errors.packageValue?.message}
                      />
                    </Field>
                    <Field label="UGC Credits">
                      <RHFTextField
                        name="totalUGCCredits"
                        type="number"
                        placeholder="Credits"
                        onKeyDown={blockMinus}
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={singleLineSx}
                      />
                    </Field>
                    <Field label="Validity">
                      <RHFTextField
                        name="validityPeriod"
                        type="number"
                        placeholder="Months"
                        onKeyDown={blockMinus}
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={singleLineSx}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Price" required={false}>
                      <StatTile
                        icon="solar:tag-price-linear"
                        value={
                          packageValue === ''
                            ? 'No price'
                            : `${pricePrefix(currency)}${Number(packageValue).toLocaleString()}`
                        }
                        unit={packageValue === '' ? `in ${currency}` : ''}
                        warning={packageValue === ''}
                      />
                    </Field>
                    <Field label="UGC Credits" required={false}>
                      <StatTile
                        icon="solar:wallet-money-linear"
                        value={totalUGCCredits}
                        unit={plural(totalUGCCredits, 'credit')}
                      />
                    </Field>
                    <Field label="Validity" required={false}>
                      <StatTile
                        icon="solar:clock-circle-linear"
                        value={validityPeriod}
                        unit={plural(validityPeriod, 'month')}
                      />
                    </Field>
                  </>
                )}
              </Stack>
            </Collapse>

            <Field label="Invoice Date" hint={validUntil}>
              <RHFDatePicker name="invoiceDate" sx={singleLineSx} />
            </Field>
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 4 }}>
            <Button onClick={handleClose} disabled={isSubmitting} sx={SECONDARY_ACTION_SX}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              disabled={!isValid}
              sx={PRIMARY_ACTION_SX}
            >
              Create Package
            </LoadingButton>
          </Stack>
        </FormProvider>
      )}
    </Dialog>
  );
};

export default PackageCreateDialog;

PackageCreateDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  clientId: PropTypes.string,
  onRefresh: PropTypes.func,
};
