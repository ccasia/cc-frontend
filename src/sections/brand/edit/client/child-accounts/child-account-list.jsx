import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect, useCallback } from 'react';

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
  TextField,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import axiosInstance from 'src/utils/axios';

const ChildAccountList = ({ company, inviteDialogOpen, onInviteDialogClose, isPicActivated }) => {
  const [childAccounts, setChildAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [resendDialog, setResendDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });

  // Get client ID from company - use the first active client
  // Note: company.clientId is just a reference (like A01), we need the actual client.id
  const clientId = company?.clients?.[0]?.id;

  const fetchChildAccounts = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

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
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchChildAccounts();
    }
  }, [clientId, fetchChildAccounts]);

  // Refresh when page becomes visible (user comes back from activation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchChildAccounts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchChildAccounts]);

  const handleCloseInviteDialog = () => {
    onInviteDialogClose();
    setFormData({ email: '', firstName: '', lastName: '' });
  };

  const handleInviteChildAccount = async () => {
    if (!clientId) {
      enqueueSnackbar('No client ID found. Cannot invite child account.', { variant: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const response = await axiosInstance.post(`/api/child-account/client/${clientId}`, formData);
      enqueueSnackbar(response.data.message, { variant: 'success' });
      handleCloseInviteDialog();
      fetchChildAccounts();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error inviting child account';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSubmitting(false);
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
    let status = 'pending';
    let label = 'Pending';

    if (account.isActive) {
      status = 'active';
      label = 'Active';
    } else if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
      status = 'expired';
      label = 'Expired';
    }

    const statusConfig = {
      active: { color: '#1ABF66', borderColor: '#1ABF66' },
      pending: { color: '#FFA902', borderColor: '#FFA902' },
      expired: { color: '#D4321C', borderColor: '#D4321C' },
    };

    const config = statusConfig[status];

    return (
      <Typography
        variant="caption"
        sx={{
          textTransform: 'uppercase',
          fontWeight: 700,
          display: 'inline-block',
          px: 1.5,
          py: 0.5,
          fontSize: '0.7rem',
          border: '1px solid',
          borderBottom: '3px solid',
          borderRadius: 0.8,
          bgcolor: 'white',
          color: config.color,
          borderColor: config.borderColor,
        }}
      >
        {label}
      </Typography>
    );
  };

  const renderTableBody = () => {
    // No client associated
    if (!clientId) {
      return (
        <TableRow>
          <TableCell colSpan={5} sx={{ py: 6 }}>
            <Stack alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#FEF3F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:link-broken-bold-duotone" width={32} sx={{ color: '#F04438' }} />
              </Box>
              <Typography variant="subtitle1" color="text.primary" fontWeight={600}>
                No Client Associated
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={360}>
                This company doesn&apos;t have an active client account yet. Activate the account first to manage child accounts.
              </Typography>
            </Stack>
          </TableCell>
        </TableRow>
      );
    }

    // PIC not yet activated
    if (!isPicActivated) {
      return (
        <TableRow>
          <TableCell colSpan={5} sx={{ py: 6 }}>
            <Stack alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#FFF8E6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:hourglass-bold-duotone" width={32} sx={{ color: '#FFA902' }} />
              </Box>
              <Typography variant="subtitle1" color="text.primary" fontWeight={600}>
                Pending Activation
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={360}>
                The primary account holder must activate their account before child accounts can be invited. Check the Person In Charge tab for status.
              </Typography>
            </Stack>
          </TableCell>
        </TableRow>
      );
    }

    // No child accounts yet
    if (childAccounts.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} sx={{ py: 6 }}>
            <Stack alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:users-group-rounded-bold-duotone" width={32} sx={{ color: '#C4CDD5' }} />
              </Box>
              <Typography variant="subtitle1" color="text.primary" fontWeight={600}>
                No Child Accounts
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
                Invite team members to give them access to this client account. They&apos;ll receive an email to set up their login.
              </Typography>
            </Stack>
          </TableCell>
        </TableRow>
      );
    }

    // Render child accounts list
    return childAccounts.map((account) => (
      <TableRow
        key={account.id}
        sx={{
          '&:hover': { bgcolor: 'action.hover' },
          '& td': { borderBottom: '1px solid #EBEBEB' },
        }}
      >
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            {account.firstName} {account.lastName}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {account.email}
          </Typography>
        </TableCell>
        <TableCell>{getStatusChip(account)}</TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {new Date(account.invitedAt).toLocaleDateString()}
          </Typography>
        </TableCell>
        <TableCell>
          <IconButton
            onClick={(e) => handleMenuOpen(e, account)}
            size="small"
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              border: '1px solid #E7E7E7',
              boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
              bgcolor: '#FFFFFF',
              '&:hover': { bgcolor: '#F5F5F5' },
            }}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <Card sx={{ border: 'none', boxShadow: 'none' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {['Name', 'Email', 'Status', 'Invited', 'Actions'].map((label, index, arr) => (
                  <TableCell
                    key={label}
                    sx={{
                      bgcolor: '#f5f5f5',
                      color: '#221f20',
                      fontWeight: 600,
                      py: 1.5,
                      whiteSpace: 'nowrap',
                      borderBottom: 'none',
                      ...(index === 0 && { borderRadius: '10px 0 0 10px' }),
                      ...(index === arr.length - 1 && { borderRadius: '0 10px 10px 0' }),
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>{renderTableBody()}</TableBody>
          </Table>
        </Scrollbar>
      </Card>

      {/* Invite Child Account Dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography fontSize={32} fontFamily="Instrument Serif">
            Invite Child Account
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Send an invitation to add a new child account
          </Typography>
        </Box>
        <Divider sx={{ mx: 2 }} />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
              placeholder="Enter email address"
            />
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              fullWidth
              placeholder="Enter first name"
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              fullWidth
              placeholder="Enter last name"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={handleCloseInviteDialog}
            disabled={submitting}
            sx={{
              border: '1px solid #E7E7E7',
              borderRadius: '8px',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleInviteChildAccount}
            variant="contained"
            loading={submitting}
            disabled={!formData.email}
            sx={{
              bgcolor: '#1340FF',
              borderRadius: '8px',
              border: '1px solid #1a32c4',
              borderBottom: '3px solid #102387',
              px: 3,
              '&:hover': { bgcolor: '#1a32c4' },
              '&.Mui-disabled': {
                bgcolor: '#E7E7E7',
                color: '#8E8E93',
                border: '1px solid #E7E7E7',
                borderBottom: '3px solid #C4CDD5',
              },
            }}
          >
            Send Invitation
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Resend Invitation Dialog */}
      <Dialog
        open={resendDialog}
        onClose={() => {
          setResendDialog(false);
          setSelectedAccount(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography fontSize={32} fontFamily="Instrument Serif">
              Resend Invitation?
            </Typography>
          </Box>
          <Divider sx={{ mx: 2 }} />
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" color="text.secondary">
              A new invitation email will be sent to:
            </Typography>
            <Typography variant="body1" fontWeight={600} mt={1}>
              {selectedAccount?.email}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setResendDialog(false);
                setSelectedAccount(null);
              }}
              sx={{
                border: '1px solid #E7E7E7',
                borderRadius: '8px',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResendInvitation}
              variant="contained"
              sx={{
                bgcolor: '#FFA902',
                borderRadius: '8px',
                border: '1px solid #E69500',
                borderBottom: '3px solid #CC8400',
                px: 3,
                '&:hover': { bgcolor: '#E69500' },
              }}
            >
              Resend
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Child Account Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
          setSelectedAccount(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography fontSize={32} fontFamily="Instrument Serif">
              Delete Child Account?
            </Typography>
          </Box>
          <Divider sx={{ mx: 2 }} />
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Are you sure you want to delete the child account for:
            </Typography>
            <Typography variant="body1" fontWeight={600} mt={1}>
              {selectedAccount?.email}
            </Typography>
            <Typography variant="body2" color="error.main" mt={2}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setDeleteDialog(false);
                setSelectedAccount(null);
              }}
              sx={{
                border: '1px solid #E7E7E7',
                borderRadius: '8px',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteChildAccount}
              variant="contained"
              sx={{
                bgcolor: '#D4321C',
                borderRadius: '8px',
                border: '1px solid #B82A17',
                borderBottom: '3px solid #8C1F11',
                px: 3,
                '&:hover': { bgcolor: '#B82A17' },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: '12px',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
            border: '1px solid #EBEBEB',
            mt: 1,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            console.log('Resend clicked for account:', selectedAccount);
            setResendDialog(true);
            handleMenuClose();
          }}
          sx={{
            py: 1.25,
            px: 2,
            fontSize: 14,
            '&:hover': { bgcolor: '#F5F5F5' },
          }}
        >
          <Iconify icon="eva:refresh-fill" sx={{ mr: 1.5, width: 20, height: 20, color: '#636366' }} />
          Resend Invitation
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            console.log('Delete clicked for account:', selectedAccount);
            setDeleteDialog(true);
            handleMenuClose();
          }}
          sx={{
            py: 1.25,
            px: 2,
            fontSize: 14,
            color: 'error.main',
            '&:hover': { bgcolor: '#FEF3F2' },
          }}
        >
          <Iconify icon="eva:trash-2-fill" sx={{ mr: 1.5, width: 20, height: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

ChildAccountList.propTypes = {
  company: PropTypes.object,
  inviteDialogOpen: PropTypes.bool,
  onInviteDialogClose: PropTypes.func,
  isPicActivated: PropTypes.bool,
};

export default ChildAccountList;
