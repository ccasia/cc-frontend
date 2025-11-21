import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Chip,
  Menu,
  Table,
  Stack,
  Button,
  Dialog,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import EmptyContent from 'src/components/empty-content/empty-content';

const ChildAccountList = ({ companyId, company }) => {
  const [childAccounts, setChildAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [resendDialog, setResendDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });

  const mdUp = useResponsive('up', 'md');

  // Get client ID from company - use the first active client
  const clientId = company?.clients?.[0]?.id || company?.clientId;

  console.log('Company data:', company);
  console.log('Client ID being used:', clientId);

  useEffect(() => {
    if (clientId) {
      fetchChildAccounts();
    }
  }, [clientId]);

  // Refresh when page becomes visible (user comes back from activation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchChildAccounts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchChildAccounts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/child-account/client/${clientId}`);
      setChildAccounts(response.data);
    } catch (error) {
      console.error('Error fetching child accounts:', error);
      enqueueSnackbar('Error fetching child accounts', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteChildAccount = async () => {
    try {
      const response = await axiosInstance.post(`/api/child-account/client/${clientId}`, formData);
      enqueueSnackbar(response.data.message, { variant: 'success' });
      setInviteDialog(false);
      setFormData({ email: '', firstName: '', lastName: '' });
      fetchChildAccounts();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error inviting child account';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleResendInvitation = async () => {
    if (!selectedAccount) {
      console.error('No account selected for resend');
      enqueueSnackbar('No account selected', { variant: 'error' });
      return;
    }
    
    try {
      console.log('Resending invitation for account:', selectedAccount);
      const response = await axiosInstance.post(`/api/child-account/${selectedAccount.id}/resend`);
      console.log('Resend response:', response.data);
      enqueueSnackbar(response.data.message, { variant: 'success' });
      setResendDialog(false);
      setMenuAnchorEl(null);
      setSelectedAccount(null);
      fetchChildAccounts();
    } catch (error) {
      console.error('Error resending invitation:', error);
      const errorMessage = error.response?.data?.message || 'Error resending invitation';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleDeleteChildAccount = async () => {
    if (!selectedAccount) {
      console.error('No account selected for delete');
      enqueueSnackbar('No account selected', { variant: 'error' });
      return;
    }
    
    try {
      console.log('Deleting account:', selectedAccount);
      const response = await axiosInstance.delete(`/api/child-account/${selectedAccount.id}`);
      console.log('Delete response:', response.data);
      enqueueSnackbar(response.data.message, { variant: 'success' });
      setDeleteDialog(false);
      setMenuAnchorEl(null);
      setSelectedAccount(null);
      fetchChildAccounts();
    } catch (error) {
      console.error('Error deleting child account:', error);
      const errorMessage = error.response?.data?.message || 'Error deleting child account';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleMenuOpen = (event, account) => {
    console.log('Opening menu for account:', account);
    setMenuAnchorEl(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleMenuClose = () => {
    console.log('Closing menu');
    setMenuAnchorEl(null);
    // Don't clear selectedAccount here - it will be cleared when dialog closes
  };

  const getStatusChip = (account) => {
    if (account.isActive) {
      return <Chip label="Active" color="success" size="small" />;
    }
    if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    return <Chip label="Pending" color="warning" size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Child Accounts</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setInviteDialog(true)}
            sx={{
              bgcolor: '#203ff5',
              '&:hover': { bgcolor: '#102387' },
            }}
          >
            Invite Account
          </Button>
        </Stack>
      </Box>

      <Card>
        <Scrollbar>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Invited</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {childAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <EmptyContent title="No child accounts" filled />
                  </TableCell>
                </TableRow>
              ) : (
                childAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      {account.firstName} {account.lastName}
                    </TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{getStatusChip(account)}</TableCell>
                    <TableCell>
                      {new Date(account.invitedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, account)}
                        size="small"
                      >
                        <Iconify icon="eva:more-vertical-fill" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>

      {/* Invite Child Account Dialog */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
          <Button onClick={handleInviteChildAccount} variant="contained">
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resend Invitation Dialog */}
      <Dialog open={resendDialog} onClose={() => {
        setResendDialog(false);
        setSelectedAccount(null);
      }}>
        <DialogTitle>Resend Invitation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to resend the invitation to {selectedAccount?.email}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResendDialog(false);
            setSelectedAccount(null);
          }}>Cancel</Button>
          <Button onClick={handleResendInvitation} variant="contained" color="warning">
            Resend
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Child Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => {
        setDeleteDialog(false);
        setSelectedAccount(null);
      }}>
        <DialogTitle>Delete Child Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the child account for {selectedAccount?.email}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialog(false);
            setSelectedAccount(null);
          }}>Cancel</Button>
          <Button onClick={handleDeleteChildAccount} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            console.log('Resend clicked for account:', selectedAccount);
            setResendDialog(true);
            handleMenuClose();
          }}
        >
          <Iconify icon="eva:refresh-fill" sx={{ mr: 1 }} />
          Resend Invitation
        </MenuItem>
        <MenuItem
          onClick={() => {
            console.log('Delete clicked for account:', selectedAccount);
            setDeleteDialog(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="eva:trash-2-fill" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

ChildAccountList.propTypes = {
  companyId: PropTypes.string.isRequired,
  company: PropTypes.object,
};

export default ChildAccountList;
