import PropTypes from 'prop-types';

import { Box, Stack, Button, Dialog, Typography } from '@mui/material';

import {
  DIALOG_PAPER_SX,
  PRIMARY_ACTION_SX,
  DISCARD_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

export default function DiscardCompanyDialog({ open, onKeepEditing, onDiscard }) {
  return (
    <Dialog
      open={open}
      onClose={onKeepEditing}
      aria-labelledby="discard-company-title"
      aria-describedby="discard-company-description"
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
              bgcolor: '#1340FF',
              borderRadius: '500px',
              fontSize: 36,
              lineHeight: '40px',
            }}
          >
            🏢
          </Box>

          <Stack spacing={0.5} sx={{ width: '100%' }}>
            <Typography
              id="discard-company-title"
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
              Leave without saving?
            </Typography>

            <Typography
              id="discard-company-description"
              sx={{
                fontFamily: 'InterDisplay',
                fontWeight: 400,
                fontSize: 16,
                lineHeight: '20px',
                textAlign: 'center',
                color: '#636366',
              }}
            >
              This company is not created yet. If you leave now, the details you entered will be
              lost.
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={1} sx={{ width: '100%' }}>
          <Button fullWidth autoFocus onClick={onKeepEditing} sx={PRIMARY_ACTION_SX}>
            Keep Editing
          </Button>
          <Button fullWidth onClick={onDiscard} sx={DISCARD_ACTION_SX}>
            Discard Company
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

DiscardCompanyDialog.propTypes = {
  open: PropTypes.bool,
  onKeepEditing: PropTypes.func,
  onDiscard: PropTypes.func,
};
