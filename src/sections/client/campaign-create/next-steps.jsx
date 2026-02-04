import dayjs from 'dayjs';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

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

  const { watch } = useFormContext();

  const campaignStartDate = watch('campaignStartDate');

  const handleOpenConfirm = () => setConfirmOpen(true);
  const handleCloseConfirm = () => setConfirmOpen(false);

  const handlePublish = () => {
    handleCloseConfirm();
    onPublish?.();
  };

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', mb: { xs: 10, sm: 20 } }}>
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
        <Typography variant="body2" color="text.secondary" mb={{ xs: 2, sm: 4 }} sx={{ maxWidth: 500 }}>
          You may publish your campaign at this point, but completing the additional details
          encourages higher amounts of creator participation.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 8 }} mt={3}>
          <Button
            variant="contained"
            size="large"
            onClick={handleOpenConfirm}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: '#F5F5F5',
              maxWidth: 350,
              height: 400,
              px: 8,
              ':hover': {
                bgcolor: '#F5F5F5',
              },
            }}
          >
            <Typography fontSize={100}>📕</Typography>
            <Typography
              variant="h3"
              color="#231F20"
              lineHeight={1.2}
              fontWeight={400}
              fontFamily="Instrument Serif"
            >
              Publish Campaign For Now
            </Typography>
          </Button>

          <Button
            variant="contained"
            size="large"
            onClick={onContinueAdditionalDetails}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: '#F5F5F5',
              maxWidth: 350,
              height: 400,
              px: 9,
              ':hover': {
                bgcolor: '#F5F5F5',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                fontSize: 10,
                position: 'absolute',
                top: 15,
                left: 15,
                px: 1.2,
                py: 0.5,
                border: '1px solid #EBEBEB',
                borderRadius: 0.8,
                boxShadow: '0px 2px 0px #E7E7E7',
                bgcolor: '#fff',
                color: '#636366',
              }}
            >
              RECOMMENDED
            </Box>
            <Typography fontSize={100}>📝</Typography>
            <Typography
              variant="h3"
              color="#231F20"
              lineHeight={1.2}
              fontWeight={400}
              fontFamily="Instrument Serif"
            >
              Continue Additional Details
            </Typography>
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
          {dayjs(campaignStartDate).isSame(dayjs(), 'date') ? (
            <Button
              variant="contained"
              onClick={handlePublish}
              startIcon={<Iconify icon="material-symbols:publish" />}
              disabled={isLoading}
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
              {isLoading ? 'Publishing...' : 'Publish Now'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handlePublish}
              disabled={isLoading}
              startIcon={<Iconify icon="mdi:calendar-clock" />}
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
              {isLoading ? 'Scheduling...' : `Schedule on ${dayjs(campaignStartDate).format('ddd LL')}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
