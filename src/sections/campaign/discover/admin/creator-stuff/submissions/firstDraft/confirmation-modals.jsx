import React, { useState } from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

// Helper functions to avoid nested ternary expressions
const getSectionDisplayName = (sectionType) => {
  switch (sectionType) {
    case 'video':
      return 'Draft Videos';
    case 'rawFootages':
      return 'Raw Footages';
    case 'photos':
      return 'Photos';
    default:
      return 'Items';
  }
};

const getSectionItemsName = (sectionType) => {
  switch (sectionType) {
    case 'video':
      return 'videos';
    case 'rawFootages':
      return 'raw footages';
    case 'photos':
      return 'photos';
    default:
      return 'items';
  }
};

const ConfirmationApproveModal = ({
  open,
  onClose,
  sectionType,
  onConfirm,
  isSubmitting = false,
  isDisabled = false,
  watchData = {},
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error confirming approval:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const sectionDisplayName = getSectionDisplayName(sectionType);
  const sectionItemsName = getSectionItemsName(sectionType);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant="h6" component="div">
          Approve {sectionDisplayName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Are you sure you want to approve all {sectionItemsName}? This action cannot be undone.
        </DialogContentText>

        {/* Show feedback preview if available */}
        {watchData?.feedback && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Feedback:
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography variant="body2">{watchData.feedback}</Typography>
            </Box>
          </Box>
        )}

        {/* Show due date if available */}
        {watchData?.dueDate && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Due Date:
            </Typography>
            <Chip
              label={dayjs(watchData.dueDate).format('MMM D, YYYY')}
              size="small"
              sx={{
                bgcolor: 'primary.lighter',
                color: 'primary.darker',
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isConfirming || isSubmitting}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={handleConfirm}
          loading={isConfirming || isSubmitting}
          disabled={isDisabled}
          variant="contained"
          sx={{
            bgcolor: 'success.main',
            '&:hover': {
              bgcolor: 'success.dark',
            },
          }}
        >
          Approve {sectionDisplayName}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

const ConfirmationRequestModal = ({
  open,
  onClose,
  sectionType,
  onConfirm,
  watchData = {},
  isDisabled = false,
  selectedItemsCount = 0,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error confirming request:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const sectionDisplayName = getSectionDisplayName(sectionType);
  const sectionItemsName = getSectionItemsName(sectionType);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant="h6" component="div">
          Request Changes for {sectionDisplayName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Are you sure you want to request changes for{' '}
          {selectedItemsCount > 0 ? `${selectedItemsCount} ` : 'all '}
          {sectionItemsName}? The creator will be notified and asked to make revisions.
        </DialogContentText>

        {/* Show reasons if available */}
        {watchData?.reasons && watchData.reasons.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Reasons for Changes:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {watchData.reasons.map((reason, index) => (
                <Chip
                  key={index}
                  label={reason}
                  size="small"
                  sx={{
                    bgcolor: 'warning.lighter',
                    color: 'warning.darker',
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Show feedback preview if available */}
        {watchData?.feedback && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Feedback:
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography variant="body2">{watchData.feedback}</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isConfirming}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={handleConfirm}
          loading={isConfirming}
          disabled={isDisabled}
          variant="contained"
          sx={{
            bgcolor: 'warning.main',
            '&:hover': {
              bgcolor: 'warning.dark',
            },
          }}
        >
          Request Changes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

ConfirmationApproveModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sectionType: PropTypes.oneOf(['video', 'rawFootages', 'photos']).isRequired,
  onConfirm: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  isDisabled: PropTypes.bool,
  watchData: PropTypes.object,
};

ConfirmationRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sectionType: PropTypes.oneOf(['video', 'rawFootages', 'photos']).isRequired,
  onConfirm: PropTypes.func.isRequired,
  watchData: PropTypes.object,
  isDisabled: PropTypes.bool,
  selectedItemsCount: PropTypes.number,
};

export { ConfirmationApproveModal, ConfirmationRequestModal }; 