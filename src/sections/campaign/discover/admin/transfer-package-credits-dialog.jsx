import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

// Available package credits = sum of (totalCredits - creditsUsed) across the company's ACTIVE
// subscriptions — matches the FIFO pool the backend's changeCredits endpoint draws from.
export function getAvailablePackageCredits(client) {
  if (!client?.subscriptions?.length) return 0;
  return client.subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => {
      const total = s.totalCredits ?? s.package?.credits ?? s.customPackage?.customCredits ?? 0;
      const used = s.creditsUsed ?? 0;
      return sum + Math.max(0, Number(total) - Number(used));
    }, 0);
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    borderRadius: 1,
    '& fieldset': { borderColor: '#E3E3E3' },
  },
};

export default function TransferPackageCreditsDialog({ open, onClose, campaign, onTransferred }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const client = campaign?.company || campaign?.brand?.company;
  const availableCredits = useMemo(() => getAvailablePackageCredits(client), [client]);
  const currentCampaignCredits = Number(campaign?.campaignCredits) || 0;
  const creditsRemaining = Math.max(0, currentCampaignCredits - (Number(campaign?.creditsUtilized) || 0));
  const parsedAmount = Number(amount) || 0;

  const isInvalid = !parsedAmount || parsedAmount <= 0 || parsedAmount > availableCredits;

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.patch(endpoints.campaign.changeCredits, {
        campaignId: campaign?.id,
        newCredit: parsedAmount,
      });
      enqueueSnackbar(res?.data?.message || 'Credits transferred successfully!');
      setAmount('');
      onClose();
      if (onTransferred) await onTransferred();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to transfer credits', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '20px', bgcolor: '#F5F5F5', position: 'relative' } }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ px: 3.5, pt: 3.5 }}>
        <Stack spacing={0.25}>
          <DialogTitle
            sx={{
              p: 0,
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              '&.MuiTypography-root': { fontSize: 24, fontWeight: 400 },
            }}
          >
            Transfer Campaign Credits
          </DialogTitle>
          <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>for {campaign?.name}</Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#1340FF', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {creditsRemaining} Campaign Credits Remaining
          </Typography>
          <IconButton onClick={handleClose} disabled={loading} sx={{ color: '#221f20' }}>
            <Iconify icon="eva:close-fill" width={24} />
          </IconButton>
        </Stack>
      </Stack>

      <Divider sx={{ borderColor: '#E3E3E3', mt: 2.5, mx: 3.5 }} />

      <DialogContent sx={{ px: 4, pt: 3, pb: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Stack spacing={0.75} sx={{ flex: 1 }}>
            <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Package Credits</Typography>
            <TextField value={availableCredits} size="small" disabled sx={fieldSx} />
          </Stack>

          <Stack spacing={0.75} sx={{ flex: 2 }}>
            <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>
              How many Package Credits would you like to transfer?
            </Typography>
            <TextField
              type="number"
              size="small"
              value={amount}
              placeholder="0"
              inputProps={{ min: 1, max: availableCredits }}
              onChange={(e) => setAmount(e.target.value)}
              sx={fieldSx}
            />
          </Stack>
        </Stack>

        {parsedAmount > availableCredits && (
          <Typography variant="caption" sx={{ color: '#D4321C', mt: 1, display: 'block' }}>
            You only have {availableCredits} Package Credits available.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 2.5 }}>
        <LoadingButton
          onClick={handleConfirm}
          loading={loading}
          disabled={isInvalid}
          sx={{
            width: '170px',
            height: '44px',
            gap: '6px',
            pt: '10px',
            pr: '18px',
            pb: '13px',
            pl: '18px',
            borderRadius: '8px',
            background:
              'linear-gradient(0deg, #1340FF, #1340FF), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
            boxShadow: '0px -3px 0px 0px #0000001A inset',
            color: '#ffffff',
            fontSize: '0.95rem',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': {
              background:
                'linear-gradient(0deg, #0F35D6, #0F35D6), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
              boxShadow: '0px -3px 0px 0px #0000001A inset',
            },
            '&.Mui-disabled': {
              opacity: 1,
              background:
                'linear-gradient(0deg, #3A3A3C, #3A3A3C), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
              boxShadow: '0px -3px 0px 0px #0000001A inset',
              color: '#ffffff',
            },
          }}
        >
          Confirm
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

TransferPackageCreditsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaign: PropTypes.object,
  onTransferred: PropTypes.func,
};
