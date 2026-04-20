import PropTypes from 'prop-types';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogContent,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';

const ApprovalConfirmationModal = ({ open, onClose, approvalLink }) => {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(approvalLink);
      enqueueSnackbar('Link copied to clipboard!', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to copy link', { variant: 'error' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, textAlign: 'center' } }}
    >
      <DialogContent sx={{ px: 4, py: 4 }}>
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: '#8A5AFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            🚀
          </Box>

          <Typography
            sx={{
              color: '#221f20',
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 550,
              fontSize: { xs: '2rem', sm: '2.3rem' },
              lineHeight: 1.05,
            }}
          >
            List Sent for Approval
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              fontFamily: 'Inter Display, Inter, sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0%',
              textAlign: 'center',
            }}
          >
            Your Approver will receive a link in their email inbox! You may also copy the link here
            to send to them directly.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleCopyLink}
            sx={{
              mt: 1,
              bgcolor: '#1a1a1a',
              color: 'white',
              fontFamily: 'Inter Display, Inter, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0%',
              height: 48,
              textTransform: 'none',
              borderRadius: 1,
              borderBottom: '3px solid #000',
              '&:hover': { bgcolor: '#000' },
            }}
          >
            Copy Link
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              fontFamily: 'Inter Display, Inter, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0%',
              height: 44,
              textTransform: 'none',
              borderRadius: 1,
              color: '#221f20',
              borderColor: '#e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              '&:hover': { borderColor: '#b0b0b0', bgcolor: 'transparent' },
            }}
          >
            Done
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

ApprovalConfirmationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  approvalLink: PropTypes.string,
};

export default ApprovalConfirmationModal;
