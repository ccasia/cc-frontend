import PropTypes from 'prop-types';

import { Box, Stack, Button, Dialog, Typography } from '@mui/material';

import {
  DIALOG_PAPER_SX,
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

// Same shape as the Delete Draft dialog, so destructive confirms look the same everywhere.
export default function RemoveScreenshotDialog({ open, isLast, isRemoving, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={isRemoving ? undefined : onClose}
      aria-labelledby="remove-screenshot-title"
      aria-describedby="remove-screenshot-description"
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      <Stack spacing={3} sx={{ width: '100%' }}>
        <Stack spacing={2} alignItems="center">
          <Box
            aria-hidden
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 80,
              height: 80,
              bgcolor: '#D4321C',
              borderRadius: '500px',
              fontFamily: 'Instrument Serif, serif',
              fontSize: 36,
              lineHeight: '40px',
            }}
          >
            🗑️
          </Box>

          <Stack spacing={0.5} sx={{ width: '100%' }}>
            <Typography
              id="remove-screenshot-title"
              component="h2"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontWeight: 400,
                fontSize: 36,
                lineHeight: '40px',
                textAlign: 'center',
                color: '#231F20',
              }}
            >
              Remove Screenshot?
            </Typography>

            <Typography
              id="remove-screenshot-description"
              sx={{
                fontFamily: 'InterDisplay',
                fontWeight: 400,
                fontSize: 16,
                lineHeight: '20px',
                textAlign: 'center',
                color: '#636366',
              }}
            >
              {isLast
                ? 'This is the last screenshot, so the saved insights for this post will be removed too.'
                : 'The insights will be read again from the other screenshots.'}
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={1} sx={{ width: '100%' }}>
          <Button fullWidth disabled={isRemoving} onClick={onConfirm} sx={PRIMARY_ACTION_SX}>
            {isRemoving ? 'Removing…' : 'Remove Screenshot'}
          </Button>
          <Button fullWidth disabled={isRemoving} onClick={onClose} sx={SECONDARY_ACTION_SX}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

RemoveScreenshotDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  isLast: PropTypes.bool,
  isRemoving: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
