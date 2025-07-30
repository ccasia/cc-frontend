import PropTypes from 'prop-types';
import React, { useState } from 'react';

import {
  Box,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { useSnackbar } from 'notistack';

import Iconify from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';

import axiosInstance from 'src/utils/axios';

const V3PitchActions = ({ pitch, campaign, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const displayStatus = pitch.displayStatus || pitch.status;
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isClient = user?.role === 'client';

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRejectClick = () => {
    setRejectDialogOpen(true);
    handleMenuClose();
  };

  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setRejectionReason('');
  };

  const handleAction = async (action, endpoint, data = {}) => {
    setLoading(true);
    try {
      const response = await axiosInstance.patch(`/api/pitch/v3/${pitch.id}/${endpoint}`, data);
      enqueueSnackbar(response.data.message || 'Action completed successfully', { variant: 'success' });
      onUpdate({ ...pitch, ...response.data.pitch });
    } catch (error) {
      console.error('Error performing action:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error performing action', { variant: 'error' });
    } finally {
      setLoading(false);
      handleRejectDialogClose();
    }
  };

  const handleApprove = () => {
    if (isAdmin && displayStatus === 'PENDING_REVIEW') {
      handleAction('approve', 'approve');
    } else if (isClient && displayStatus === 'PENDING_REVIEW') {
      handleAction('approve', 'approve/client');
    }
    handleMenuClose();
  };

  const handleReject = () => {
    if (isAdmin && displayStatus === 'PENDING_REVIEW') {
      handleAction('reject', 'reject', { rejectionReason });
    } else if (isClient && displayStatus === 'PENDING_REVIEW') {
      handleAction('reject', 'reject/client', { rejectionReason });
    }
  };

  const handleSetAgreement = () => {
    // This would open a separate dialog for setting agreement details
    // For now, just show a placeholder
    enqueueSnackbar('Agreement setup feature coming soon', { variant: 'info' });
    handleMenuClose();
  };

  // Determine available actions based on status and user role
  const getAvailableActions = () => {
    const actions = [];

    if (isAdmin) {
      if (displayStatus === 'PENDING_REVIEW') {
        actions.push(
          { label: 'Approve & Send to Client', action: 'approve', icon: 'eva:checkmark-circle-2-fill' },
          { label: 'Reject', action: 'reject', icon: 'eva:close-circle-fill' }
        );
      } else if (displayStatus === 'APPROVED') {
        actions.push(
          { label: 'Set Agreement', action: 'agreement', icon: 'eva:file-text-fill' }
        );
      }
    } else if (isClient) {
      if (displayStatus === 'PENDING_REVIEW') {
        actions.push(
          { label: 'Approve', action: 'approve', icon: 'eva:checkmark-circle-2-fill' },
          { label: 'Reject', action: 'reject', icon: 'eva:close-circle-fill' }
        );
      }
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          disabled={loading}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {availableActions.map((action) => (
          <MenuItem
            key={action.action}
            onClick={() => {
              if (action.action === 'reject') {
                handleRejectClick();
              } else if (action.action === 'approve') {
                handleApprove();
              } else if (action.action === 'agreement') {
                handleSetAgreement();
              }
            }}
            disabled={loading}
          >
            <ListItemIcon>
              <Iconify icon={action.icon} />
            </ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Pitch</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this pitch:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            disabled={loading || !rejectionReason.trim()}
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default V3PitchActions;

V3PitchActions.propTypes = {
  pitch: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
}; 