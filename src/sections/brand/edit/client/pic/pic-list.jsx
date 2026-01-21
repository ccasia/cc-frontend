import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Menu,
  Table,
  Stack,
  Dialog,
  Button,
  Divider,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useTable } from 'src/components/table';
import Scrollbar from 'src/components/scrollbar';

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'email', label: 'Email', width: 200 },
  { id: 'designation', label: 'Designation', width: 150 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'actions', label: 'Actions', width: 100, textAlign: 'center' },
];

const PICList = ({ personIncharge, companyId, onUpdate }) => {
  const table = useTable();
  const [editDialog, setEditDialog] = useState(false);
  const [selectedPIC, setSelectedPIC] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
  });
  const [picUsers, setPicUsers] = useState({});
  const [statusLoading, setStatusLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuSelectedPIC, setMenuSelectedPIC] = useState(null);
  const [resendDialog, setResendDialog] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const notFound = !personIncharge?.length;

  // Fetch user data for each PIC to get their status
  useEffect(() => {
    const fetchPICUsers = async () => {
      if (!personIncharge?.length) {
        setStatusLoading(false);
        return;
      }

      setStatusLoading(true);
      const userDataPromises = personIncharge.map(async (pic) => {
        try {
          // Find user by email since PIC email should match User email
          const response = await axiosInstance.get(`/api/user/by-email/${pic.email}`);
          return { picId: pic.id, userData: response.data };
        } catch (error) {
          console.error(`Error fetching user for PIC ${pic.id}:`, error);
          return { picId: pic.id, userData: null };
        }
      });

      const results = await Promise.all(userDataPromises);
      const usersMap = {};
      results.forEach(({ picId, userData }) => {
        usersMap[picId] = userData;
      });
      setPicUsers(usersMap);
      setStatusLoading(false);
    };

    fetchPICUsers();
  }, [personIncharge]);

  const handleEditClick = (pic) => {
    setSelectedPIC(pic);
    setFormData({
      name: pic.name || '',
      email: pic.email || '',
      designation: pic.designation || '',
    });
    setEditDialog(true);
  };

  const handleUpdatePIC = async () => {
    if (!selectedPIC) return;

    try {
      setLoading(true);
      const response = await axiosInstance.patch(`/api/pic/${selectedPIC.id}`, {
        ...formData,
        companyId,
      });

      enqueueSnackbar(response.data.message || 'PIC updated successfully', { variant: 'success' });
      setEditDialog(false);
      setSelectedPIC(null);
      setFormData({ name: '', email: '', designation: '' });

      // Call parent refresh function if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating PIC:', error);
      const errorMessage = error.response?.data?.message || 'Error updating PIC';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (pic) => {
    // Show loading placeholder while fetching status
    if (statusLoading) {
      return (
        <Box
          sx={{
            width: 70,
            height: 24,
            borderRadius: 0.8,
            bgcolor: '#F5F5F5',
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        />
      );
    }

    const userData = picUsers[pic.id];
    const status = userData?.status || 'inactive';

    const statusConfig = {
      active: { color: '#1ABF66', borderColor: '#1ABF66', label: 'Active' },
      pending: { color: '#FFA902', borderColor: '#FFA902', label: 'Pending' },
      inactive: { color: '#8E8E93', borderColor: '#C4CDD5', label: 'Inactive' },
    };

    const config = statusConfig[status] || statusConfig.inactive;

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
        {config.label}
      </Typography>
    );
  };

  const isPending = (pic) => {
    const userData = picUsers[pic.id];
    return userData?.status === 'pending';
  };

  const handleMenuOpen = (event, pic) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuSelectedPIC(pic);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleResendClick = () => {
    setResendDialog(true);
    handleMenuClose();
  };

  const handleResendConfirm = async () => {
    if (!menuSelectedPIC || !companyId) return;

    try {
      setResendLoading(true);
      const response = await axiosInstance.post(`/api/company/${companyId}/resend-activation`, {
        picId: menuSelectedPIC.id,
      });

      enqueueSnackbar(response.data.message || 'Activation email resent successfully', {
        variant: 'success',
      });

      setResendDialog(false);
      setMenuSelectedPIC(null);

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error resending activation email:', error);
      const errorMessage = error.response?.data?.message || 'Error resending activation email';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((item, index) => (
                  <TableCell
                    key={item.id}
                    sx={{
                      width: item.width,
                      textAlign: item.textAlign,
                      bgcolor: '#f5f5f5',
                      color: '#221f20',
                      fontWeight: 600,
                      py: 1.5,
                      whiteSpace: 'nowrap',
                      borderBottom: 'none',
                      ...(index === 0 && { borderRadius: '10px 0 0 10px' }),
                      ...(index === TABLE_HEAD.length - 1 && { borderRadius: '0 10px 10px 0' }),
                    }}
                  >
                    {item.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {notFound ? (
                <TableRow>
                  <TableCell colSpan={TABLE_HEAD.length} sx={{ py: 6 }}>
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
                        <Iconify icon="solar:user-id-bold-duotone" width={32} sx={{ color: '#C4CDD5' }} />
                      </Box>
                      <Typography variant="subtitle1" color="text.primary" fontWeight={600}>
                        No Person In Charge
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
                        A PIC will be added when you activate the client account. They&apos;ll receive an invitation to set up their access.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                personIncharge?.map((item) => (
                  <TableRow
                    key={item.id}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      '& td': { borderBottom: '1px solid #EBEBEB' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item?.name || 'None'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item?.email || 'None'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item?.designation || 'None'}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(item)}</TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, item)}
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
                ))
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      {/* Edit PIC Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography fontSize={32} fontFamily="Instrument Serif">
            Edit Person In Charge
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Update the contact person details
          </Typography>
        </Box>
        <Divider sx={{ mx: 2 }} />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="Enter name"
            />
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
              label="Designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Manager, Director"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => setEditDialog(false)}
            disabled={loading}
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
            onClick={handleUpdatePIC}
            variant="contained"
            loading={loading}
            disabled={!formData.name || !formData.email || !formData.designation}
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
            Update
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Resend Confirmation Dialog */}
      <Dialog
        open={resendDialog}
        onClose={() => {
          setResendDialog(false);
          setMenuSelectedPIC(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography fontSize={32} fontFamily="Instrument Serif">
              Resend Activation Email?
            </Typography>
          </Box>
          <Divider sx={{ mx: 2 }} />
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" color="text.secondary">
              A new activation email will be sent to:
            </Typography>
            <Typography variant="body1" fontWeight={600} mt={1}>
              {menuSelectedPIC?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={2} sx={{ bgcolor: '#FFF8E6', p: 1.5, borderRadius: 1 }}>
              This will generate a new activation link that expires in 24 hours. The previous link will be invalidated.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setResendDialog(false);
                setMenuSelectedPIC(null);
              }}
              disabled={resendLoading}
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
              onClick={handleResendConfirm}
              variant="contained"
              loading={resendLoading}
              sx={{
                bgcolor: '#FFA902',
                borderRadius: '8px',
                border: '1px solid #E69500',
                borderBottom: '3px solid #CC8400',
                px: 3,
                '&:hover': { bgcolor: '#E69500' },
              }}
            >
              Resend Email
            </LoadingButton>
          </DialogActions>
        </Box>
      </Dialog>

      {/* 3-Dot Actions Menu */}
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
        {menuSelectedPIC && isPending(menuSelectedPIC) && (
          <>
            <MenuItem
              onClick={handleResendClick}
              sx={{
                py: 1.25,
                px: 2,
                fontSize: 14,
                '&:hover': { bgcolor: '#F5F5F5' },
              }}
            >
              <Iconify icon="eva:email-outline" sx={{ mr: 1.5, width: 20, height: 20, color: '#636366' }} />
              Resend Activation Email
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
          </>
        )}
        <MenuItem
          onClick={() => {
            handleEditClick(menuSelectedPIC);
            handleMenuClose();
          }}
          sx={{
            py: 1.25,
            px: 2,
            fontSize: 14,
            '&:hover': { bgcolor: '#F5F5F5' },
          }}
        >
          <Iconify icon="eva:edit-fill" sx={{ mr: 1.5, width: 20, height: 20, color: '#636366' }} />
          Edit PIC
        </MenuItem>
      </Menu>
    </>
  );
};

export default PICList;

PICList.propTypes = {
  personIncharge: PropTypes.array,
  companyId: PropTypes.string,
  onUpdate: PropTypes.func,
};
