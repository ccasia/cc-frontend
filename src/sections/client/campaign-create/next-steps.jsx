import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

NextSteps.propTypes = {
  onPublish: PropTypes.func,
  onContinueAdditionalDetails: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default function NextSteps({ onPublish, onContinueAdditionalDetails, isLoading = false }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleOpenConfirm = () => setConfirmOpen(true);
  const handleCloseConfirm = () => setConfirmOpen(false);

  const handlePublish = () => {
    handleCloseConfirm();
    onPublish?.();
  };

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
      {/* Main Content - Publish Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary" mb={4} sx={{ maxWidth: 500 }}>
          You may publish your campaign at this point, but completing the additional details encourages higher amounts of creator participation.
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="large"
            onClick={handleOpenConfirm}
            startIcon={<Iconify icon="mdi:rocket-launch" />}
            sx={{
              bgcolor: '#1340FF',
              px: 6,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
              '&:hover': {
                bgcolor: '#0030e0',
              },
            }}
          >
            Publish Campaign
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={onContinueAdditionalDetails}
            startIcon={<Iconify icon="mdi:arrow-right" />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: '#1340FF',
              color: '#1340FF',
              '&:hover': {
                bgcolor: 'rgba(19, 64, 255, 0.04)',
                borderColor: '#0030e0',
              },
            }}
          >
            Continue Additional Details
          </Button>
        </Stack>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleCloseConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          <Iconify icon="mdi:rocket-launch" width={32} sx={{ color: '#1340FF' }} />
          <Typography variant="h6" mt={1}>
            Confirm Campaign
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to publish this campaign?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button variant="contained" onClick={handleCloseConfirm} sx={{ px: 2, py: 1.2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePublish}
            disabled={isLoading}
            startIcon={<Iconify icon="mdi:rocket-launch" />}
            sx={{
              bgcolor: '#1340FF',
              px: 4,
              py: 1.2,
              fontWeight: 600,
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
              '&:hover': {
                bgcolor: '#0030e0',
              },
            }}
          >
            {isLoading ? 'Publishing...' : 'Confirm & Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
