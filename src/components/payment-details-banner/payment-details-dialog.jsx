import * as yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Divider,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  createFilterOptions,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';
import { newBanks } from 'src/contants/banksv2';
import { updatePaymentForm } from 'src/api/paymentForm';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const stripSeparators = (value) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;

const schema = yup.object().shape({
  countryOfBank: yup.string().required('Country of bank is required'),
  icPassportNumber: yup
    .string()
    .transform(stripSeparators)
    .required('NRIC / Passport number is required'),
  bankName: yup.string().required('Bank name is required'),
  bankAccName: yup.string().required('Account name is required'),
  bankNumber: yup
    .string()
    .transform(stripSeparators)
    .required('Account number is required'),
});

const filter = createFilterOptions();

const inputSx = {
  width: '100%',
  '& .MuiInputBase-root': {
    bgcolor: 'white',
    borderRadius: 1,
    height: 48,
  },
  '& .MuiInputLabel-root': {
    display: 'none',
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#B0B0B0',
    fontSize: '16px',
    opacity: 1,
  },
};

// ----------------------------------------------------------------------

const FormField = ({ label, children }) => (
  <Stack spacing={1} alignItems="start" width={1}>
    <Typography
      component="label"
      sx={{
        fontWeight: 500,
        fontSize: '13px',
        color: '#636366',
      }}
    >
      {label}
      <Box component="span" sx={{ color: 'error.main', ml: 0.25 }}>
        *
      </Box>
    </Typography>
    {children}
  </Stack>
);

FormField.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

export default function PaymentDetailsDialog({ open, onClose }) {
  const { initialize } = useAuthContext();

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      countryOfBank: '',
      icPassportNumber: '',
      bankName: '',
      bankAccName: '',
      bankNumber: '',
    },
    mode: 'onChange',
  });

  const {
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = methods;

  const countryOfBank = watch('countryOfBank');

  // Keep the visible value in sync with what gets submitted
  const handleStrippedChange = (name) => (event) =>
    setValue(name, stripSeparators(event.target.value), {
      shouldValidate: true,
      shouldDirty: true,
    });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await updatePaymentForm(data);
      enqueueSnackbar(res?.data?.message || 'Payment details saved successfully!');
      await initialize();
      handleClose();
    } catch (error) {
      enqueueSnackbar('Error saving payment details', { variant: 'error' });
    }
  });

  const bankOptions = newBanks.find((item) => item.country === countryOfBank)?.banks || [];

  const buildFilterOptions = (options, params) => {
    const { inputValue } = params;
    const filtered = filter(options, params);
    const isExisting = options.some((option) => option.toLowerCase() === inputValue.toLowerCase());
    if (inputValue !== '' && !isExisting) {
      filtered.push(inputValue);
    }
    return filtered;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          '@media (max-width: 600px)': {
            margin: '16px',
            maxHeight: 'calc(100% - 32px)',
          },
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <DialogTitle sx={{ pb: 2 }}>
            <Typography
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontSize: { xs: 24, sm: 30 },
                fontWeight: 300,
              }}
            >
              💰 Fill in your payment details
            </Typography>
          </DialogTitle>
          <IconButton onClick={handleClose} sx={{ mt: 2, mr: 2 }}>
            <Iconify icon="charm:cross" width={20} />
          </IconButton>
        </Stack>

        <Divider />

        <DialogContent sx={{ py: 3 }}>
          <Stack spacing={2.5}>
            <FormField label="Country of Bank">
              <RHFAutocomplete
                selectOnFocus
                clearOnBlur
                name="countryOfBank"
                placeholder="Select country"
                options={newBanks.map((item) => item.country)}
                getOptionLabel={(option) => option}
                filterOptions={buildFilterOptions}
                sx={inputSx}
              />
            </FormField>

            <FormField label="Bank selection">
              <RHFAutocomplete
                selectOnFocus
                clearOnBlur
                name="bankName"
                placeholder="Select bank"
                disabled={!countryOfBank}
                options={bankOptions}
                getOptionLabel={(option) => option}
                filterOptions={buildFilterOptions}
                sx={inputSx}
              />
            </FormField>

            <FormField label="Account Name">
              <RHFTextField
                name="bankAccName"
                placeholder="Your Name / Sdn Bhd"
                InputLabelProps={{ shrink: false }}
                sx={inputSx}
              />
            </FormField>

            <FormField label="NRIC / Passport No.">
              <RHFTextField
                name="icPassportNumber"
                placeholder="NRIC / Passport No."
                onChange={handleStrippedChange('icPassportNumber')}
                InputLabelProps={{ shrink: false }}
                sx={inputSx}
              />
            </FormField>

            <FormField label="Account No.">
              <RHFTextField
                name="bankNumber"
                placeholder="Account No."
                onChange={handleStrippedChange('bankNumber')}
                InputLabelProps={{ shrink: false }}
                sx={inputSx}
              />
            </FormField>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!isValid}
            sx={{
              background: '#1340FF',
              boxShadow: '0px -3px 0px 0px rgba(68, 68, 77, 0.45) inset',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '10px',
              height: '44px',
              px: 3,
              '&:hover': {
                background: '#1340FF',
              },
              '&.Mui-disabled': {
                background: '#B0B0B0',
                color: 'white',
              },
            }}
          >
            Save Details
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

PaymentDetailsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
