import PropTypes from 'prop-types';
import { Box, Stack, Button, Dialog, Typography, DialogContent } from '@mui/material';
import { LoadingButton } from '@mui/lab';

export default function ConfirmReservationModal({ open, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          py: 3,
          width: '100%',
        },
      }}
    >
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#1340FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
              fontSize: 32,
            }}
          >
            🗓️
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'instrument serif',
              fontWeight: 400,
              mb: 1,
              fontSize: { xs: '2.4rem', sm: '2.6rem' },
              whiteSpace: 'nowrap',
            }}
          >
            Confirm your Reservation
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: '#636366', fontWeight: 400, fontSize: '16px', mb: 3 }}
          >
            This campaign requires you to make a reservation in the Logistics tab! Reserve now to
            proceed with your campaign.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          <LoadingButton
            fullWidth
            variant="contained"
            size="large"
            onClick={onConfirm}
            sx={{
              py: 1.5,
              borderRadius: '8px',
              boxShadow: '0px -4px 0px 0px #00000073 inset',
              color: '#FFFFFF',
              bgcolor: '#3A3A3C',
              '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
              '&:active': {
                boxShadow: '0px 0px 0px 0px #000000 inset',
                transform: 'translateY(1px)',
              },
            }}
          >
            Go to Logistics
          </LoadingButton>

          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 600,
              boxShadow: '0px -4px 0px 0px #E7E7E7 inset',
              color: '#231F20',
              bgcolor: '#FFFFFF',
              '&:hover': {
                bgcolor: '#FFFFFF',
                boxShadow: '0px -4px 0px 0px #E7E7E7 inset',
                borderColor: '#E7E7E7',
              },
              '&:active': {
                boxShadow: '0px 0px 0px 0px #E7E7E7 inset',
                transform: 'translateY(1px)',
              },
            }}
          >
            I&apos;ll do it later
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

ConfirmReservationModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
};
