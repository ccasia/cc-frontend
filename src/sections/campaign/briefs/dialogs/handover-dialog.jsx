import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import AttachClientPackage from './attach-client-package';

// Handover attaches the client + package (new or existing) and finalizes the
// handover to CS. The client/package UI is shared with the CSL assign-csm dialog
// via AttachClientPackage.
export default function HandoverDialog({ open, brief, onClose, onHandedOver }) {
  const { enqueueSnackbar } = useSnackbar();

  const attachRef = useRef(null);

  const [internalComments, setInternalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInternalComments('');
  }, [open, brief?.id]);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Resolve the client company (create new / link existing) + package.
      const result = await attachRef.current?.resolveCompany();
      if (!result?.ok) {
        setSubmitting(false);
        return;
      }

      // 2. Link the company to the campaign.
      await axiosInstance.patch(endpoints.campaign.editCampaignBrandOrCompany, {
        campaignBrand: { id: result.id, name: result.name },
        id: brief.id,
      });

      // 3. Finalize handover. Record the deal value (won) for the BD dashboard.
      await axiosInstance.post(endpoints.campaignBrief.handover(brief.id), {
        internalComments: internalComments || '',
        wonAmount: result.packageValue ?? null,
        wonCurrency: result.currency ?? null,
      });

      enqueueSnackbar('Brief handed over to CS', { variant: 'success' });
      onHandedOver?.();
      onClose?.();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || 'Failed to hand over brief',
        { variant: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        // Bound the dialog height and lay it out as a column so the body scrolls
        // while the Save footer stays pinned to the bottom.
        sx: {
          borderRadius: 2,
          maxHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogContent sx={{ p: 4, flex: 1, overflowY: 'auto' }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 0.5 }}
        >
          <Typography variant="h3" sx={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
            Attach Client &amp; Package
          </Typography>
          <IconButton onClick={onClose} size="medium">
            <Iconify width={24} icon="eva:close-fill" />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {brief?.name || 'this campaign'}
        </Typography>

        <AttachClientPackage ref={attachRef} brief={brief} />

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#6B7280', fontWeight: 600, mb: 1, display: 'block' }}
          >
            Internal Comments
          </Typography>
          <TextField
            value={internalComments}
            onChange={(e) => setInternalComments(e.target.value)}
            placeholder="Anything the CS team should know?"
            fullWidth
            multiline
            minRows={2}
          />
        </Box>
      </DialogContent>

      {/* Pinned footer — stays at the bottom while the content above scrolls. */}
      <DialogActions sx={{ px: 4, py: 2.5 }}>
        <LoadingButton
          variant="contained"
          loading={submitting}
          onClick={onSubmit}
          sx={{
            bgcolor: '#1340FF',
            '&:hover': { bgcolor: '#0F33CC' },
            px: 4,
            borderRadius: 1.5,
            textTransform: 'none',
          }}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

HandoverDialog.propTypes = {
  open: PropTypes.bool,
  brief: PropTypes.object,
  onClose: PropTypes.func,
  onHandedOver: PropTypes.func,
};
