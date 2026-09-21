import PropTypes from 'prop-types';

import { Box, Stack, Button, Dialog, Typography } from '@mui/material';

import {
  DIALOG_PAPER_SX,
  PRIMARY_ACTION_SX,
  SECONDARY_ACTION_SX,
} from 'src/components/campaign/action-button-styles';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function DeleteDraftDialog({ open, isDeleting, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      aria-labelledby="delete-draft-title"
      aria-describedby="delete-draft-description"
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
              id="delete-draft-title"
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
              Delete Draft?
            </Typography>

            <Typography
              id="delete-draft-description"
              sx={{
                fontFamily: 'InterDisplay',
                fontWeight: 400,
                fontSize: 16,
                lineHeight: '20px',
                textAlign: 'center',
                color: '#636366',
              }}
            >
              Once deleting you will not be able to recover the draft.
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={1} sx={{ width: '100%' }}>
          <Button fullWidth disabled={isDeleting} onClick={onConfirm} sx={PRIMARY_ACTION_SX}>
            {isDeleting ? 'Deleting…' : 'Delete Draft'}
          </Button>
          <Button fullWidth disabled={isDeleting} onClick={onClose} sx={SECONDARY_ACTION_SX}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

DeleteDraftDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  isDeleting: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
