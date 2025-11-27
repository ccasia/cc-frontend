import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import axiosInstance from 'src/utils/axios';

import {
  Box,
  Grid,
  Stack,
  Button,
  Dialog,
  Avatar,
  Divider,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers';
import Iconify from 'src/components/iconify';

export default function ScheduleDeliveryDialog({ open, onClose, logistic, campaignId, onUpdate }) {
  const [trackingLink, setTrackingLink] = useState('');
  const [expectedDate, setExpectedDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const address = logistic?.deliveryDetails?.address;

  useEffect(() => {
    if (open && logistic) {
      setTrackingLink(logistic.deliveryDetails?.trackingLink || '');
      setExpectedDate(
        logistic.deliveryDetails?.expectedDeliveryDate
          ? new Date(logistic.deliveryDetails.expectedDeliveryDate)
          : null
      );
    }
  }, [open, logistic]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/api/logistics/campaign/${campaignId}/${logistic.id}/schedule`, {
        trackingLink,
        expectedDeliveryDate: expectedDate,
        address: address,
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error scheduling delivery', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          p: 3,
          width: '100%',
          maxWidth: 700,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
        <Box>
          <Typography
            variant="h2"
            sx={{ fontWeight: 400, fontFamily: 'instrument serif', color: '#231F20' }}
          >
            Schedule Delivery
          </Typography>
          <Typography variant="body2" sx={{ color: '#636366' }}>
            We’ll notify the creator and update your logistics dashboard.
          </Typography>
          <Typography variant="body2" sx={{ color: '#FF3500' }}>
            Once submitted, you won't be able to make any edits.{' '}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" width={32} />
        </IconButton>
      </Box>
      <Divider sx={{ my: 2 }} />

      {/* Recipient Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ color: '#636366', mb: 2 }}>
          Recipient
        </Typography>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={logistic?.creator?.photoURL}
            sx={{ width: 56, height: 56, bgcolor: '#E0E0E0' }}
          />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 800, fontSize: '20px' }}>
              {logistic?.creator?.name}
            </Typography>
            <Typography variant="body1" sx={{ color: '#231F20' }}>
              {logistic?.deliveryDetails?.address || 'No address provided'}
            </Typography>
          </Box>
        </Stack>
      </Box>
      {/* Inputs Grid */}
      <Grid container spacing={3}>
        {/* Tracking Link */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ color: '#636366', mb: 1 }}>
            Tracking Link
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter Tracking Link"
            value={trackingLink}
            onChange={(e) => setTrackingLink(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff',
                borderRadius: 1.5,
                '& fieldset': { borderColor: '#E0E0E0' },
                '&:hover fieldset': { borderColor: '#BDBDBD' },
                '&.Mui-focused fieldset': { borderColor: '#231F20' },
              },
            }}
          />
        </Grid>
        {/* Expected Delivery Date */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ color: '#636366', mb: 1 }}>
            Expected Delivery Date
          </Typography>
          <DatePicker
            value={expectedDate}
            format="dd/MM/yyyy"
            onChange={(newValue) => setExpectedDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                placeholder: 'DD/MM/YYYY',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    borderRadius: 1.5,
                    '& fieldset': { borderColor: '#E0E0E0' },
                    '&:hover fieldset': { borderColor: '#BDBDBD' },
                    '&.Mui-focused fieldset': { borderColor: '#231F20' },
                  },
                },
              },
              day: {
                sx: {
                  '&.Mui-selected': {
                    backgroundColor: '#1340FF !important',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#0B2DAD !important',
                    },
                  },
                },
              },
              layout: {
                sx: {
                  '& .MuiPickersYear-yearButton.Mui-selected': {
                    backgroundColor: '#1340FF !important',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#0B2DAD !important',
                    },
                  },
                },
              },
            }}
            minDate={new Date()}
          />
        </Grid>
      </Grid>

      {/* Footer / Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={!trackingLink || !expectedDate || isSubmitting}
          sx={{
            bgcolor: '#333333',
            color: '#fff',
            px: 6,
            py: 1.5,
            borderRadius: '8px',
            textTransform: 'none',
            boxShadow: '0px -4px 0px 0px #000000 inset',
            backgroundColor: '#3A3A3C',
            fontSize: '1rem',
            fontWeight: 700,
            '&:hover': {
              backgroundColor: '#3A3A3C',
              boxShadow: '0px -4px 0px 0px #000000ef inset',
            },
            '&:active': {
              boxShadow: '0px 0px 0px 0px #000000 inset',
              transform: 'translateY(1px)',
            },
          }}
        >
          {isSubmitting ? 'Updating...' : 'Update'}
        </Button>
      </Box>
    </Dialog>
  );
}

ScheduleDeliveryDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
};
