import PropTypes from 'prop-types';
import { useState } from 'react';
import axiosInstance from 'src/utils/axios';

import { Box, Stack, Button, Dialog, Avatar, Divider, Typography, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

export default function ReviewIssueDialog({ open, onClose, logistic, onUpdate }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestIssue =
    logistic?.issues && logistic.issues.length > 0
      ? logistic.issues[logistic.issues.length - 1]
      : { reason: 'No issue description provided.' };

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
              {logistic?.deliveryDetails?.address || 'No address provided'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Issue Display Box */}
      <Box
        sx={{
          bgcolor: '#F9FAFB', // Light background like a disabled input
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
        <Button
          //   fullWidth
          variant="contained"
          //   onClick={handleRetry}
          disabled={isSubmitting}
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
          Retry
        </Button>

        <Button
          //   fullWidth
          variant="contained"
          //   onClick={handleResolve}
          disabled={isSubmitting}
          sx={{
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
        </Button>
      </Stack>
    </Dialog>
  );
}

ReviewIssueDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
};
