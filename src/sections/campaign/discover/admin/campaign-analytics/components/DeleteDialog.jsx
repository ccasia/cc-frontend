import React from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import { Box, Stack, Dialog, Button, Typography } from '@mui/material';

import { deleteManualCreatorEntry } from 'src/api/manual-creator';

import { setEntryToDelete, useAnalyticsStore, setDeleteModalOpen } from '../stores/analytics.store';

const DeleteDialog = ({ campaignId, mutateManualEntries }) => {
  const deleteModalOpen = useAnalyticsStore((state) => state.deleteModalOpen);
  const entryToDelete = useAnalyticsStore((state) => state.entryToDelete);

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      await deleteManualCreatorEntry(campaignId, entryToDelete.id);
      mutateManualEntries();
      enqueueSnackbar('Creator has been deleted successfully!', { variant: 'success' });
      setDeleteModalOpen(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Failed to delete manual creator entry:', error);
      enqueueSnackbar('Failed to delete creator entry', { variant: 'error' });
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setEntryToDelete(null);
  };

  return (
    <Dialog
      open={deleteModalOpen}
      onClose={handleCloseDeleteModal}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          bgcolor: '#F4F4F4',
          p: 3,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* Icon Circle */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#FF3500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            fontFamily: 'Instrument Serif',
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              lineHeight: 1,
            }}
          >
            🗑️
          </Box>
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontFamily: 'Instrument Serif',
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.111,
            textAlign: 'center',
            color: '#231F20',
          }}
        >
          Delete added creator?
        </Typography>

        {/* Buttons */}
        <Stack spacing={1} sx={{ width: '100%' }}>
          <Button
            fullWidth
            onClick={handleConfirmDelete}
            sx={{
              bgcolor: '#3A3A3C',
              color: '#FFFFFF',
              fontFamily: 'Inter Display, sans-serif',
              fontSize: 16,
              fontWeight: 550,
              lineHeight: 1.25,
              py: '10px',
              px: '16px',
              pb: '13px',
              borderRadius: '8px',
              border: '1px solid #3A3A3C',
              borderBottom: '3px solid #3A3A3C',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              '& .MuiButton-label': {
                fontFamily: 'Inter Display, sans-serif',
              },
              '&:hover': {
                bgcolor: '#FF3600',
                borderColor: '#CC2B00',
                borderBottom: '3px solid',
                borderBottomColor: '#CC2B00',
              },
            }}
          >
            Yes
          </Button>
          <Button
            fullWidth
            onClick={handleCloseDeleteModal}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#231F20',
              fontFamily: 'Inter Display, sans-serif',
              fontSize: 16,
              fontWeight: 550,
              lineHeight: 1.25,
              py: '10px',
              px: '16px',
              pb: '13px',
              borderRadius: '8px',
              border: '1px solid #E7E7E7',
              borderBottom: '3px solid #E7E7E7',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              '& .MuiButton-label': {
                fontFamily: 'Inter Display, sans-serif',
              },
              '&:hover': {
                bgcolor: '#FFFFFF',
                borderColor: '#231F20',
                borderBottom: '3px solid',
                borderBottomColor: '#231F20',
              },
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default DeleteDialog;

DeleteDialog.propTypes = {
  campaignId: PropTypes.string,
  mutateManualEntries: PropTypes.func,
};
