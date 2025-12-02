import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import {
  Stack,
  Button,
  Typography,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { ConfirmDialog } from 'src/components/custom-dialog';

const V3PitchActions = ({ pitch, onViewPitch, campaignId, onRemoved }) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleRemoveCreator = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(endpoints.campaign.removeCreator, {
        creatorId: pitch.userId,
        campaignId,
      });

      enqueueSnackbar(res?.data?.message || 'Creator removed successfully');
      setConfirmDialogOpen(false);
      if (onRemoved) {
        onRemoved();
      }
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to remove creator', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onViewPitch(pitch)}
          sx={{
            cursor: 'pointer',
            px: 2,
            py: 2,
            minWidth: '90px',
            border: '1px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            borderRadius: 1,
            color: '#203ff5',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            textTransform: 'none',
            bgcolor: 'transparent',
            whiteSpace: 'nowrap',
            '&:hover': {
              bgcolor: 'rgba(32, 63, 245, 0.04)',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
            },
          }}
        >
          View
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setConfirmDialogOpen(true)}
          sx={{
            cursor: 'pointer',
            px: 2,
            py: 2,
            minWidth: '90px',
            border: '1px solid #3A3A3C',
            borderBottom: '3px solid #00000073',
            borderRadius: 1,
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            textTransform: 'none',
            bgcolor: '#3A3A3C',
            whiteSpace: 'nowrap',
            '&:hover': {
              bgcolor: '#3A3A3C',
              border: '1px solid #3A3A3C',
              borderBottom: '3px solid #00000073',
            },
          }}
        >
          Remove
        </Button>
      </Stack>

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        title="Remove Creator from Campaign?"
        content={
          <Typography variant="body2" gutterBottom>
            Are you sure you want to remove this creator? This action cannot be undone.
          </Typography>
        }
        action={
          <LoadingButton
            variant="outlined"
            color="error"
            loading={loading}
            onClick={handleRemoveCreator}
          >
            Confirm
          </LoadingButton>
        }
      />
    </>
  );
};

export default V3PitchActions;

V3PitchActions.propTypes = {
  pitch: PropTypes.object.isRequired,
  onViewPitch: PropTypes.func.isRequired,
  campaignId: PropTypes.string.isRequired,
  onRemoved: PropTypes.func,
}; 