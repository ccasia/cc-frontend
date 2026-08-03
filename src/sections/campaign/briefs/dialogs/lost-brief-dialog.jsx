import * as yup from 'yup';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const schema = yup.object({
  currency: yup.string().required('Currency is required'),
  amount: yup
    .number()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .typeError('Please enter a valid amount')
    .positive('Amount must be greater than 0')
    .required('Amount is required'),
  reason: yup.string().trim().required('Please provide a reason for loss'),
});

export default function LostBriefDialog({ open, brief, onClose, onLost }) {
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { currency: 'MYR', amount: '', reason: '' },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await axiosInstance.post(endpoints.campaignBrief.lost(brief.id), {
        lostAmount: Number(values.amount),
        lostCurrency: values.currency,
        lostReason: values.reason,
      });

      enqueueSnackbar('Brief marked as lost', { variant: 'success' });
      onLost?.();
      onClose?.();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update brief status', {
        variant: 'error',
      });
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogContent sx={{ p: 4 }}>
        {/* Custom Header matching your exact spacing and font */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 3 }}
        >
          <Typography variant="h4" sx={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
            Mark Campaign as Lost
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>

        {/* Clean Form Provider */}
        <FormProvider methods={methods} onSubmit={onSubmit}>
          {/* Currency and Amount side-by-side */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <RHFTextField
              select
              name="currency"
              label="Currency"
              sx={{
                width: { xs: '100%', sm: 120 }, 
                flexShrink: 0,
              }}
            >
              <MenuItem value="MYR">MYR</MenuItem>
              <MenuItem value="SGD">SGD</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
            </RHFTextField>

            <RHFTextField
              name="amount"
              label="Amount Lost"
              type="number"
              fullWidth
              inputProps={{ min: 0, step: 'any' }}
            />
          </Stack>

          <RHFTextField
            name="reason"
            label="Reason for Loss"
            multiline
            rows={3}
            placeholder="e.g., Budget limitations, decided on alternative marketing strategy..."
            sx={{ mb: 4 }}
          />

          {/* Footer Actions */}
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              color="error" // Kept red because it's a destructive/loss action
              sx={{ px: 4 }}
            >
              {isSubmitting ? 'Updating…' : 'Mark as Lost'}
            </Button>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

LostBriefDialog.propTypes = {
  open: PropTypes.bool,
  brief: PropTypes.object,
  onClose: PropTypes.func,
  onLost: PropTypes.func,
};
