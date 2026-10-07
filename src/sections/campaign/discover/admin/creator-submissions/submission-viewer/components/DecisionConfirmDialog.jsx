import PropTypes from 'prop-types';

import { Stack, Button, Dialog, Typography } from '@mui/material';

// Confirms a review decision before it changes the submission's status
export default function DecisionConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      // Don't allow dismissing mid-request
      onClose={loading ? undefined : onClose}
      PaperProps={{ sx: { width: 1, maxWidth: 400, p: 3, borderRadius: 1.75 } }}
    >
      <Stack gap={1}>
        <Typography sx={{ fontSize: 17, fontWeight: 600, color: '#17171A' }}>{title}</Typography>
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: '#6E6E76' }}>
          {description}
        </Typography>
      </Stack>

      <Stack direction="row" gap={1.125} sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          disabled={loading}
          onClick={onClose}
          sx={{ height: 40, borderColor: '#D9D9DE' }}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          variant="contained"
          disabled={loading}
          onClick={onConfirm}
          sx={{ height: 40, bgcolor: '#1304FF', '&:hover': { bgcolor: '#0F03CC' } }}
        >
          {loading ? 'Sending…' : confirmLabel}
        </Button>
      </Stack>
    </Dialog>
  );
}

DecisionConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  confirmLabel: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
