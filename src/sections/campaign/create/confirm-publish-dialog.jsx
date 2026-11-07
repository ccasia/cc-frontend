import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Button, Dialog, IconButton, Typography, DialogContent } from '@mui/material';

import Iconify from 'src/components/iconify';
import {
  DIALOG_PAPER_SX,
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

const BLUE = '#1340FF';

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

// The blue of the header's Confirm Campaign button, on the dialog button shape
const PUBLISH_SX = {
  ...PRIMARY_ACTION_SX,
  bgcolor: BLUE,
  '&:hover': { ...PRIMARY_ACTION_SX['&:hover'], bgcolor: '#0030E0' },
  '&:active': { ...PRIMARY_ACTION_SX['&:active'], bgcolor: '#0029C2' },
  '&.Mui-disabled': { ...PRIMARY_ACTION_SX['&.Mui-disabled'], bgcolor: BLUE },
  '& .MuiLoadingButton-loadingIndicator': { color: '#FFFFFF' },
};

// Asks once before the campaign goes live. A start date of today publishes
// (or activates) now; a later date schedules it.
export default function ConfirmPublishDialog({
  open,
  onClose,
  onConfirm,
  loading,
  activate,
  startDate,
}) {
  const start = startDate ? dayjs(startDate) : null;
  const scheduled = !!start && !start.isSame(dayjs(), 'date');

  let title = activate ? 'Activate this campaign?' : 'Publish this campaign?';
  let body = 'The campaign goes live today.';
  let action = activate ? 'Activate Now' : 'Publish Now';
  if (scheduled) {
    if (!activate) title = 'Schedule this campaign?';
    body = `The campaign goes live on ${start.format('ddd, D MMM YYYY')}.`;
    action = `Schedule for ${start.format('D MMM')}`;
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirm-publish-title"
      aria-describedby="confirm-publish-body"
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      <IconButton aria-label="Cancel" onClick={onClose} disabled={loading} sx={CLOSE_SX}>
        <Iconify icon="mingcute:close-line" width={24} />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        <Stack spacing={2} alignItems="center">
          <Box
            aria-hidden
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '500px',
              bgcolor: BLUE,
              fontSize: 36,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {scheduled ? '\u{1F5D3}️' : '\u{1F680}'}
          </Box>

          <Stack spacing={3} sx={{ width: '100%' }}>
            <Stack spacing={0.5}>
              <Typography id="confirm-publish-title" component="h2" sx={TITLE_SX}>
                {title}
              </Typography>
              <Typography id="confirm-publish-body" sx={BODY_SX}>
                {body}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <LoadingButton
                fullWidth
                autoFocus
                onClick={onConfirm}
                loading={loading}
                sx={PUBLISH_SX}
              >
                {action}
              </LoadingButton>
              <Button fullWidth onClick={onClose} disabled={loading} sx={SECONDARY_ACTION_SX}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

ConfirmPublishDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  activate: PropTypes.bool,
  startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
