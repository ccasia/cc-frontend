import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Dialog, Avatar, Divider, Typography, IconButton } from '@mui/material';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';

export default function ReviewIssueDialog({ open, onClose, logistic, campaignId, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isReservation = logistic?.type === 'RESERVATION';

  const latestIssue =
    logistic?.issues && logistic.issues.length > 0
      ? logistic.issues[logistic.issues.length - 1]
      : { reason: 'No issue description provided.' };

  const handleRetry = async () => {
    setIsSubmitting(true);

    try {
      await axiosInstance.patch(`/api/logistics/campaign/${campaignId}/${logistic.id}/retry`);
      enqueueSnackbar('Delivery status reverted to Scheduled.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to retry delivery', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/api/logistics/campaign/${campaignId}/${logistic.id}/resolve`);
      enqueueSnackbar('Issue resolved and marked as Completed.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to resolve issue', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    setIsSubmitting(true);
    try {
      // Calls the new service that clears slots but keeps details
      await axiosInstance.post(`/api/logistics/campaign/${campaignId}/${logistic.id}/reschedule`);
      enqueueSnackbar('Reservation reset. Creator can now select a new time.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to reset reservation', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          p: 3,
          width: '100%',
          maxWidth: 600,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 400, fontFamily: 'instrument serif', color: '#231F20' }}
        >
          Review Issue
        </Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" width={32} />
        </IconButton>
      </Box>
      <Divider sx={{ my: 2 }} />

      {/* Recipient Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: '#636366', mb: 2 }}>
          Recipient
        </Typography>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={logistic?.creator?.photoURL}
            sx={{ width: 56, height: 56, bgcolor: '#E0E0E0' }}
          />
          <Box>
            <Typography variant="h5" sx={{ color: '#231F20', fontWeight: 700, lineHeight: 1.2 }}>
              {logistic?.creator?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#231F20' }}>
              {logistic?.creator?.phoneNumber || '-'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#231F20' }}>
              {isReservation
                ? logistic?.deliveryDetails?.address || 'No address provided'
                : logistic?.reservationDetails?.outlet || 'No Outlet Selected'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Issue Display Box */}
      <Box
        sx={{
          bgcolor: '#F9FAFB',
          border: '1px solid #E0E0E0',
          borderRadius: 1.5,
          p: 2,
          mb: 4,
        }}
      >
        <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
          Issue
        </Typography>
        <Typography variant="body1" sx={{ color: '#231F20' }}>
          {latestIssue.reason}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="center">
        <LoadingButton
          variant="contained"
          onClick={isReservation ? handleReschedule : handleRetry}
          loading={isSubmitting}
          sx={{
            width: 'fit-content',
            height: 44,
            padding: { xs: '4px 8px', sm: '6px 10px' },
            borderRadius: '8px',
            boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
            backgroundColor: '#1340FF',
            color: '#FFFFFF',
            fontSize: { xs: 12, sm: 14, md: 16 },
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#133effd3',
              boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
            },
            '&:active': {
              boxShadow: '0px 0px 0px 0px #0c2aa6 inset',
              transform: 'translateY(1px)',
            },
          }}
        >
          {isReservation ? 'Reschedule' : 'Retry'}
        </LoadingButton>

        <LoadingButton
          variant="contained"
          onClick={handleResolve}
          loading={isSubmitting}
          sx={{
            height: 44,
            px: 3,
            borderRadius: '8px',
            boxShadow: '0px -4px 0px 0px #00000073 inset',
            bgcolor: '#3A3A3C',
            fontSize: { xs: 12, sm: 14, md: 16 },
            '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
            '&:active': {
              boxShadow: '0px 0px 0px 0px #000000 inset',
              transform: 'translateY(1px)',
            },
          }}
        >
          Mark as Resolved
        </LoadingButton>
      </Stack>
    </Dialog>
  );
}

ReviewIssueDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  campaignId: PropTypes.string,
  onUpdate: PropTypes.func,
};
