import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import { dangerButtonSx, primaryButtonSx } from './find-cipta-shared';

// House-style centered confirm used for the destructive Find Cipta actions
// (ending the event, deleting a location).
export default function FindCiptaConfirmDialog({
  open,
  onClose,
  emoji,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
  destructive,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, p: 3, textAlign: 'center' } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#2C2C2C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: 40 }}>{emoji}</Typography>
        </Box>

        <Typography
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: 36,
            fontWeight: 400,
            mb: 1,
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>

        <Typography sx={{ color: '#636366', fontSize: '0.875rem', mb: 3, mt: 1, lineHeight: 1.5 }}>
          {description}
        </Typography>

        <Stack spacing={1.5}>
          <LoadingButton
            fullWidth
            loading={loading}
            onClick={onConfirm}
            sx={destructive ? dangerButtonSx : primaryButtonSx}
          >
            {confirmLabel}
          </LoadingButton>
          <Button
            fullWidth
            onClick={onClose}
            sx={{
              bgcolor: '#FFFFFF',
              border: '1.5px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1.15,
              color: '#636366',
              height: 44,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': { bgcolor: '#f5f5f5' },
            }}
          >
            Cancel
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

FindCiptaConfirmDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  emoji: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.node,
  confirmLabel: PropTypes.string,
  onConfirm: PropTypes.func,
  loading: PropTypes.bool,
  destructive: PropTypes.bool,
};
