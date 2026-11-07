import PropTypes from 'prop-types';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Button, Dialog, IconButton, Typography, DialogContent } from '@mui/material';

import Iconify from 'src/components/iconify';
import {
  DIALOG_PAPER_SX,
  DANGER_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

const RED = '#D4321C';

const TITLE_SX = {
  fontFamily: 'Instrument Serif, serif',
  fontWeight: 400,
  fontSize: 36,
  lineHeight: '40px',
  textAlign: 'center',
  color: '#231F20',
};

const BODY_SX = {
  fontFamily: 'InterDisplay',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: '20px',
  textAlign: 'center',
  color: '#636366',
};

const CLOSE_SX = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
  width: 40,
  height: 40,
  color: '#636366',
  transition:
    'color 140ms ease, background-color 140ms ease, transform 140ms cubic-bezier(0.23, 1, 0.32, 1)',
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { bgcolor: 'rgba(35, 31, 32, 0.06)', color: '#231F20' },
  },
  '@media (prefers-reduced-motion: no-preference)': { '&:active': { transform: 'scale(0.92)' } },
};

const ICON_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 80,
  height: 80,
  borderRadius: '500px',
  bgcolor: RED,
  fontSize: 36,
  lineHeight: 1,
  flexShrink: 0,
};

export default function EndCampaignDialog({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="end-campaign-title"
      aria-describedby="end-campaign-body"
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      <IconButton aria-label="Cancel" onClick={onClose} disabled={loading} sx={CLOSE_SX}>
        <Iconify icon="mingcute:close-line" width={24} />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        <Stack spacing={2} alignItems="center">
          <Box aria-hidden sx={ICON_SX}>
            {'\u{1F3C1}'}
          </Box>

          <Stack spacing={3} sx={{ width: '100%' }}>
            <Stack spacing={0.5}>
              <Typography id="end-campaign-title" component="h2" sx={TITLE_SX}>
                End this campaign?
              </Typography>
              <Typography id="end-campaign-body" sx={BODY_SX}>
                The campaign moves to Completed. Pending pitches are rejected and their credits are
                refunded.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <LoadingButton fullWidth onClick={onConfirm} loading={loading} sx={DANGER_ACTION_SX}>
                End Campaign
              </LoadingButton>
              <Button
                fullWidth
                autoFocus
                onClick={onClose}
                disabled={loading}
                sx={SECONDARY_ACTION_SX}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

EndCampaignDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
