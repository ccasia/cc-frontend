import dayjs from 'dayjs';
import * as yup from 'yup';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import { LoadingButton } from '@mui/lab';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import useGetPackages from 'src/hooks/use-get-packges';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';

// Simplified handover: clients are assumed new, so we create the company from
// the brief's brand/client details and attach the chosen package — no company
// search or manual company/PIC entry. The BD only picks a package + currency
// and (optionally) leaves notes for the CSL.
const schema = yup.object({
  packageType: yup.string().required('Pick a client package'),
  currency: yup.string().required('Pick a currency'),
  internalComments: yup.string().nullable(),
});

export default function HandoverDialog({ open, brief, onClose, onHandedOver }) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: packages, isLoading: packagesLoading } = useGetPackages();

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { packageType: '', currency: 'MYR', internalComments: '' },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset({ packageType: '', currency: 'MYR', internalComments: '' });
  }, [open, brief?.id, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const pkg = (packages || []).find((p) => p.id === values.packageType);
      if (!pkg) throw new Error('Selected package not found');

      const price = pkg.prices?.find((pr) => pr.currency === values.currency)?.amount;

      // 1. Create the client company + subscription from the brief details.
      const fd = new FormData();
      fd.append(
        'data',
        JSON.stringify({
          type: 'directClient',
          companyName: brief?.name || 'Untitled Client',
          companyEmail: brief?.clientEmail || '',
          personInChargeName: brief?.clientName || brief?.name || 'Client',
          personInChargeEmail: brief?.clientEmail || '',
          personInChargeDesignation: 'Client',
          packageType: 'Fixed',
          packageId: pkg.id,
          packageValue: String(price ?? ''),
          totalUGCCredits: String(pkg.credits ?? ''),
          validityPeriod: String(pkg.validityPeriod ?? ''),
          currency: values.currency,
          invoiceDate: dayjs().toISOString(),
        })
      );
      const res = await axiosInstance.post(endpoints.company.create, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const companyId = res.data?.company?.id;
      const companyName = res.data?.company?.name;
      if (!companyId) throw new Error('Company creation returned no id');

      // 2. Link the new company to the campaign.
      await axiosInstance.patch(endpoints.campaign.editCampaignBrandOrCompany, {
        campaignBrand: { id: companyId, name: companyName },
        id: brief.id,
      });

      // 3. Finalize handover.
      await axiosInstance.post(endpoints.campaignBrief.handover(brief.id), {
        internalComments: values.internalComments || '',
      });

      enqueueSnackbar('Brief handed over to CSL', { variant: 'success' });
      onHandedOver?.();
      onClose?.();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || 'Failed to hand over brief',
        { variant: 'error' }
      );
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5, bgcolor: '#F4F4F4' } }}>
      <DialogContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
            Handover To CS
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500, mb: 0.5, display: 'block' }}>
                Client Package
              </Typography>
              <RHFSelect name="packageType" size="small" fullWidth>
                {packagesLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} />
                  </MenuItem>
                ) : (
                  (packages || []).map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))
                )}
              </RHFSelect>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 140 } }}>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500, mb: 0.5, display: 'block' }}>
                Currency
              </Typography>
              <RHFSelect name="currency" size="small" fullWidth>
                <MenuItem value="MYR">MYR</MenuItem>
                <MenuItem value="SGD">SGD</MenuItem>
              </RHFSelect>
            </Box>
            <Box sx={{ flex: 1.4 }}>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 500, mb: 0.5, display: 'block' }}>
                Internal Comments
              </Typography>
              <RHFTextField
                name="internalComments"
                size="small"
                fullWidth
                placeholder="Anything the CS team should know?"
              />
            </Box>
          </Stack>

          <Stack direction="row" justifyContent="flex-end">
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              sx={{ bgcolor: '#1340FF', '&:hover': { bgcolor: '#0F33CC' }, px: 4, borderRadius: 1.5 }}
            >
              Save
            </LoadingButton>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

HandoverDialog.propTypes = {
  open: PropTypes.bool,
  brief: PropTypes.object,
  onClose: PropTypes.func,
  onHandedOver: PropTypes.func,
};
