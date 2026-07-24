import * as yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

import StatusBadge from '../components/status-badge';
import BriefSentDialog from './brief-sent-dialog';

const schema = yup.object({
  clientName: yup.string().trim().required('Client name is required'),
  clientEmail: yup.string().trim().email('Invalid email').required('Client email is required'),
});

export default function SendToClientDialog({ open, brief, onClose, onSent }) {
  const { enqueueSnackbar } = useSnackbar();
  const [sentLink, setSentLink] = useState(null);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { clientName: brief?.clientName || '', clientEmail: brief?.clientEmail || '' },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  // defaultValues only applies on the first mount; the dialog is mounted once
  // and reused per brief, so re-seed the fields each time it opens.
  useEffect(() => {
    if (open) {
      reset({ clientName: brief?.clientName || '', clientEmail: brief?.clientEmail || '' });
    }
  }, [open, brief?.id, brief?.clientName, brief?.clientEmail, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await axiosInstance.post(endpoints.campaignBrief.send(brief.id), values);
      setSentLink(res.data?.link || null);
      onSent?.();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to send brief', { variant: 'error' });
    }
  });

  const handleSentClose = () => {
    setSentLink(null);
    onClose?.();
  };

  if (sentLink) {
    return <BriefSentDialog open link={sentLink} onClose={handleSentClose} />;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
            Send Brief to Client
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <RHFTextField name="clientName" label="Client Name" fullWidth />
            <RHFTextField name="clientEmail" label="Client Email" fullWidth />
          </Stack>

          <Box sx={{ p: 2, borderRadius: 1, bgcolor: '#FAFAFA', mb: 3 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Brand Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{brief?.brandName || brief?.name || '—'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Status</Typography>
                {brief?.draftStatus ? <StatusBadge status={brief.draftStatus} /> : '—'}
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ bgcolor: '#15803D', '&:hover': { bgcolor: '#166534' }, px: 4 }}
            >
              {isSubmitting ? 'Sending…' : `Send to ${methods.watch('clientName') || 'Client'}`}
            </Button>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

SendToClientDialog.propTypes = {
  open: PropTypes.bool,
  brief: PropTypes.object,
  onClose: PropTypes.func,
  onSent: PropTypes.func,
};
