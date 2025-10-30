import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSnackbar } from 'src/components/snackbar';
import axiosInstance from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';

import {
  Box,
  Card,
  Stack,
  Button,
  Table,
  Avatar,
  Dialog,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
  TextField,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Container,
  InputAdornment,
  FormControl,
  Select,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { useResponsive } from 'src/hooks/use-responsive';

const defaultFilters = {
  name: '',
  status: 'all',
};

const TABS = [
  { value: 'all', label: 'All', color: 'default' },
  { value: 'pending', label: 'Invitation Sent', color: 'warning' },
  { value: 'active', label: 'Activated', color: 'success' },
  { value: 'disabled', label: 'Deactivated', color: 'error' },
];

export default function ChildAccounts() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const settings = useSettingsContext();
  const smUp = useResponsive('up', 'sm');
  
  const [childAccounts, setChildAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [expandedSections, setExpandedSections] = useState({
    invitationSent: true,
    activated: true,
    deactivated: true,
  });

  // Form data for inviting new child account
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    fetchChildAccounts();
  }, []);

  const fetchChildAccounts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/child-account/client/${user?.client?.id}`);
      setChildAccounts(response.data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch child accounts', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteChildAccount = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      enqueueSnackbar('Please fill in all fields', { variant: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await axiosInstance.post(`/api/child-account/client/${user?.client?.id}`, formData);
      
      enqueueSnackbar('Invitation sent successfully!', { variant: 'success' });
      setInviteDialogOpen(false);
      setFormData({ email: '', firstName: '', lastName: '' });
      fetchChildAccounts();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to send invitation', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvitation = async (childAccountId) => {
    try {
      setSubmitting(true);
      await axiosInstance.post(`/api/child-account/${childAccountId}/resend`);
      enqueueSnackbar('Invitation resent successfully!', { variant: 'success' });
      fetchChildAccounts();
    } catch (error) {
      enqueueSnackbar('Failed to resend invitation', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrantAccess = async (childAccountId) => {
    try {
      setSubmitting(true);
      await axiosInstance.post(`/api/child-account/${childAccountId}/grant-access`);
      enqueueSnackbar('Access granted successfully!', { variant: 'success' });
      fetchChildAccounts();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to grant access', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAccess = async (childAccountId) => {
    try {
      setSubmitting(true);
      await axiosInstance.post(`/api/child-account/${childAccountId}/remove-access`);
      enqueueSnackbar('Access removed successfully!', { variant: 'success' });
      fetchChildAccounts();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to remove access', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChildAccount = async (childAccountId) => {
    try {
      setSubmitting(true);
      await axiosInstance.delete(`/api/child-account/${childAccountId}`);
      enqueueSnackbar('Child account deleted successfully!', { variant: 'success' });
      fetchChildAccounts();
    } catch (error) {
      enqueueSnackbar('Failed to delete child account', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event, account) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAccount(null);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilters = useCallback(
    (name, value) => {
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    []
  );

  const getStatusText = (account) => {
    if (account.isActive) {
      return 'Activated';
    }
    // Check if account was previously activated but is now deactivated
    if (account.activatedAt && !account.isActive) {
      return 'Deactivated';
    }
    if (account.tokenExpiresAt && new Date() > new Date(account.tokenExpiresAt)) {
      return 'Deactivated';
    }
    return 'Invitation Sent';
  };

  const getStatusColor = (account) => {
    const status = getStatusText(account);
    if (status === 'Activated') return 'success';
    if (status === 'Invitation Sent') return 'warning';
    return 'error';
  };

  const getStatusCount = (status) => {
    if (status === 'all') return childAccounts.length;
    return childAccounts.filter(account => {
      const accountStatus = getStatusText(account);
      if (status === 'pending') return accountStatus === 'Invitation Sent';
      if (status === 'active') return accountStatus === 'Activated';
      if (status === 'disabled') return accountStatus === 'Deactivated';
      return accountStatus.toLowerCase() === status.toLowerCase();
    }).length;
  };

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = childAccounts;

    if (filters.name) {
      filtered = filtered.filter(account =>
        account.firstName?.toLowerCase().includes(filters.name.toLowerCase()) ||
        account.lastName?.toLowerCase().includes(filters.name.toLowerCase()) ||
        account.email?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(account => {
        const status = getStatusText(account);
        if (filters.status === 'pending') return status === 'Invitation Sent';
        if (filters.status === 'active') return status === 'Activated';
        if (filters.status === 'disabled') return status === 'Deactivated';
        return status.toLowerCase() === filters.status.toLowerCase();
      });
    }

    return filtered;
  }, [childAccounts, filters]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, md: 3, lg: 4 },
        maxWidth: '100%',
      }}
    >
      {/* Only show header, filters, search, and table when there are child accounts */}
      {childAccounts.length > 0 && (
        <>
          {/* Header Section with Button */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={{ xs: 2, sm: 0 }}
            sx={{ mb: 4, ml: { xs: 0, md: -4 }, mr: { xs: 0, md: -4 } }}
          >
            {/* Header Section */}
            <Box sx={{ textAlign: 'left' }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'Aileron',
                  fontWeight: 600,
                  fontSize: { xs: '20px', sm: '24px' },
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  mb: 1,
                }}
              >
                Accounts
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'Aileron',
                  fontWeight: 400,
                  fontSize: { xs: '12px', sm: '13px' },
                  lineHeight: '20px',
                  letterSpacing: '0%',
                  color: 'text.secondary',
                }}
              >
                Connect an account to grant them access to manage your campaigns.
              </Typography>
            </Box>

            {/* Invite Button */}
            <Button
              onClick={() => setInviteDialogOpen(true)}
              startIcon={<Iconify icon="eva:plus-fill" />}
              sx={{
                width: { xs: '100%', sm: 108 },
                height: 44,
                pt: '10px',
                pr: '16px',
                pb: '13px',
                pl: '16px',
                gap: '6px',
                borderRadius: '8px',
                background: 'rgba(19, 64, 255, 1)',
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                textTransform: 'none',
                '&:hover': {
                  background: 'rgba(19, 64, 255, 0.9)',
                },
              }}
            >
              Invite
            </Button>
          </Stack>

          {/* Desktop Layout: Filter Tabs + Search Bar */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              display: { xs: 'none', md: 'flex' },
              width: '100%',
              mb: 2,
              ml: { md: -4 },
              position: 'relative',
            }}
          >
            {/* Desktop: Individual Filter Tabs */}
            <Stack direction="row" spacing={1}>
              {TABS.map((tab) => (
                <Box
                  key={tab.value}
                  onClick={() => handleFilters('status', tab.value)}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: '1px solid #e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                    bgcolor: filters.status === tab.value ? 'grey.300' : 'transparent',
                    color: filters.status === tab.value ? '#637381' : '#637381',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: filters.status === tab.value ? 'grey.400' : 'grey.100',
                    },
                  }}
                >
                  <Box component="span">{tab.label}</Box>
                  <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    ({getStatusCount(tab.value)})
                  </Box>
                </Box>
              ))}
            </Stack>

            {/* Desktop: Search Bar - Using transform to move right */}
            <Box 
              sx={{ 
                width: 300,
                transform: 'translateX(65px)',
              }}
            >
              <TextField
                placeholder="Search"
                value={filters.name}
                onChange={(e) => handleFilters('name', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    height: '42px',
                    '& input': {
                      py: 3,
                      height: '42px',
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '42px',
                    border: '1px solid #e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
          </Stack>

          {/* Mobile Layout: Filter Dropdown + Search Bar */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              display: { xs: 'flex', md: 'none' },
              mb: 2,
              width: '100%',
            }}
          >
            {/* Mobile: Dropdown Filter */}
            <FormControl sx={{ minWidth: 150 }}>
              <Select
                value={filters.status}
                onChange={(e) => handleFilters('status', e.target.value)}
                displayEmpty
                sx={{
                  height: '42px',
                  border: '1px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& .MuiSelect-select': {
                    py: 1.5,
                    px: 2,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#637381',
                  },
                }}
              >
                {TABS.map((tab) => (
                  <MenuItem key={tab.value} value={tab.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span">{tab.label}</Box>
                      <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        ({getStatusCount(tab.value)})
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Mobile: Search Bar */}
            <Box sx={{ flex: 1 }}>
              <TextField
                placeholder="Search"
                value={filters.name}
                onChange={(e) => handleFilters('name', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    height: '42px',
                    '& input': {
                      py: 3,
                      height: '42px',
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '42px',
                    border: '1px solid #e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
          </Stack>

      <Box
        sx={{
          mb: 3,
          ml: { xs: 0, md: -4 },
          mr: { md: -6 },
          mt: 1,
        }}
      >
        {/* Desktop Table View */}
        <TableContainer
          sx={{
            width: 'calc(100% + -16px)',
            minWidth: 1000,
            position: 'relative',
            bgcolor: 'transparent',
            display: { xs: 'none', lg: 'block' },
          }}
        >
            <Table
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '& td': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 300,
                      borderRadius: '10px 0 0 10px',
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 250,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Email
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 150,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 120,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Activated On
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 100,
                      borderRadius: '0 10px 10px 0',
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredData.map((account) => (
                    <TableRow
                      key={account.id}
                      hover
                      sx={{
                        bgcolor: 'transparent',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '& td': {
                          py: 2,
                          borderBottom: 'none',
                        },
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell sx={{ 
                        width: 300, 
                        display: 'flex', 
                        alignItems: 'center',
                      }}>
                        <Avatar alt={`${account.firstName} ${account.lastName}`} sx={{ mr: 2 }}>
                          {account.firstName?.charAt(0) || account.email.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          {account.firstName} {account.lastName}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ 
                        width: 250,
                      }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                          {account.email}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ 
                        width: 150,
                      }}>
                        <Typography
                          variant="body2"
                          sx={{
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            fontSize: '0.75rem',
                            border: '1px solid',
                            borderBottom: '3px solid',
                            borderRadius: 0.8,
                            bgcolor: 'white',
                            ...(getStatusText(account) === 'Activated' && {
                              color: '#1ABF66',
                              borderColor: '#1ABF66',
                            }),
                            ...(getStatusText(account) === 'Invitation Sent' && {
                              color: '#FFA902',
                              borderColor: '#FFA902',
                            }),
                            ...(getStatusText(account) === 'Deactivated' && {
                              color: '#d4321c',
                              borderColor: '#d4321c',
                            }),
                          }}
                        >
                          {getStatusText(account)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ 
                        width: 120,
                      }}>
                        <Typography variant="body2" noWrap>
                          {account.activatedAt 
                            ? new Date(account.activatedAt).toLocaleDateString()
                            : 'Not activated'
                          }
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{
                          width: 100,
                          py: 2,
                          px: 2,
                          verticalAlign: 'middle',
                          height: '100%',
                        }}
                      >
                          <Tooltip title="More actions">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, account)}
                              sx={{
                                width: 44,
                                height: 44,
                                pt: '10px',
                                pr: '16px',
                                pb: '13px',
                                pl: '16px',
                                gap: '6px',
                                borderRadius: '8px',
                                border: '1px solid #E7E7E7',
                                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                                background: '#FFFFFF',
                                '&:hover': {
                                  background: '#F5F5F5',
                                },
                              }}
                            >
                              <Iconify icon="eva:more-vertical-fill" />
                            </IconButton>
                          </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

        {/* Mobile Card View */}
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            width: '100%',
          }}
        >
          <Stack spacing={2}>
            {/* Invitation Sent Section */}
            {childAccounts.filter(account => getStatusText(account) === 'Invitation Sent').length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    mb: 1,
                    pl: 0,
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      width: { xs: '100%', sm: 320 },
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleSection('invitationSent')}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 4,
                        py: 0.5,
                        fontSize: '0.75rem',
                        border: '1px solid',
                        borderBottom: '3px solid',
                        borderRadius: 0.8,
                        bgcolor: 'white',
                        color: '#FFA902',
                        borderColor: '#FFA902',
                        width: '100%',
                      }}
                    >
                      <span>INVITATION SENT ({childAccounts.filter(account => getStatusText(account) === 'Invitation Sent').length})</span>
                      <Iconify 
                        icon={expandedSections.invitationSent ? "eva:arrow-ios-downward-fill" : "eva:arrow-ios-forward-fill"} 
                        width={16} 
                        sx={{ color: '#FFA902' }} 
                      />
                    </Typography>
                  </Box>
                </Box>
                {expandedSections.invitationSent && (
                  <Stack spacing={0.5} sx={{ bgcolor: 'white', p: 1, pl: 0, alignItems: 'flex-start', width: { xs: '100%', sm: 360 } }}>
                    {childAccounts
                      .filter(account => getStatusText(account) === 'Invitation Sent')
                      .map((account) => (
                      <Card
                        key={account.id}
                        sx={{
                          width: { xs: '102%', sm: 360 },
                          height: 100,
                          p: 2,
                          borderRadius: 1,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #EBEBEB',
                          boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                          '&:hover': {
                            boxShadow: '0px -3px 0px 0px #EBEBEB inset, 0px 2px 4px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                          <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
                            <Avatar alt={`${account.firstName} ${account.lastName}`} sx={{ width: 40, height: 40, bgcolor: '#f5f5f5' }}>
                              {account.firstName?.charAt(0) || account.email.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 0.05, color: '#000' }}>
                                {account.firstName} {account.lastName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0, fontWeight: 600 }}>
                                {account.email}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: -3, lineHeight: 0.8, position: 'relative', top: -4 }}>
                                Invited on {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                              </Typography>
                            </Box>
                          </Stack>
                          <Tooltip title="More actions">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, account)}
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '8px',
                                border: '1px solid #E7E7E7',
                                boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                                background: '#FFFFFF',
                                '&:hover': {
                                  background: '#F5F5F5',
                                },
                              }}
                            >
                              <Iconify icon="eva:more-vertical-fill" width={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* Activated Section */}
            {childAccounts.filter(account => getStatusText(account) === 'Activated').length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    mb: 1,
                    pl: 0,
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      width: { xs: '102%', sm: 320 },
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleSection('activated')}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 4,
                        py: 0.5,
                        fontSize: '0.75rem',
                        border: '1px solid',
                        borderBottom: '3px solid',
                        borderRadius: 0.8,
                        bgcolor: 'white',
                        color: '#1ABF66',
                        borderColor: '#1ABF66',
                        width: '100%',
                      }}
                    >
                      <span>ACTIVATED ({childAccounts.filter(account => getStatusText(account) === 'Activated').length})</span>
                      <Iconify 
                        icon={expandedSections.activated ? "eva:arrow-ios-downward-fill" : "eva:arrow-ios-forward-fill"} 
                        width={16} 
                        sx={{ color: '#1ABF66' }} 
                      />
                    </Typography>
                  </Box>
                </Box>
                {expandedSections.activated && (
                  <Stack spacing={0.5} sx={{ bgcolor: 'white', p: 1, pl: 0, alignItems: 'flex-start', width: { xs: '100%', sm: 360 } }}>
                    {childAccounts
                      .filter(account => getStatusText(account) === 'Activated')
                      .map((account) => (
                      <Card
                        key={account.id}
                        sx={{
                          width: { xs: '102%', sm: 360 },
                          height: 100,
                          p: 2,
                          borderRadius: 1,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #EBEBEB',
                          boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                          '&:hover': {
                            boxShadow: '0px -3px 0px 0px #EBEBEB inset, 0px 2px 4px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                          <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
                            <Avatar alt={`${account.firstName} ${account.lastName}`} sx={{ width: 40, height: 40, bgcolor: '#f5f5f5' }}>
                              {account.firstName?.charAt(0) || account.email.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 0.05, color: '#000' }}>
                                {account.firstName} {account.lastName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0, fontWeight: 600 }}>
                                {account.email}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: -3, lineHeight: 0.8, position: 'relative', top: -4 }}>
                                Activated on {account.activatedAt ? new Date(account.activatedAt).toLocaleDateString() : 'N/A'}
                              </Typography>
                            </Box>
                          </Stack>
                          <Tooltip title="More actions">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, account)}
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '8px',
                                border: '1px solid #E7E7E7',
                                boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                                background: '#FFFFFF',
                                '&:hover': {
                                  background: '#F5F5F5',
                                },
                              }}
                            >
                              <Iconify icon="eva:more-vertical-fill" width={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* Deactivated Section */}
            {childAccounts.filter(account => getStatusText(account) === 'Deactivated').length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    mb: 1,
                    pl: 0,
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      width: { xs: '100%', sm: 320 },
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleSection('deactivated')}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 4,
                        py: 0.5,
                        fontSize: '0.75rem',
                        border: '1px solid',
                        borderBottom: '3px solid',
                        borderRadius: 0.8,
                        bgcolor: 'white',
                        color: '#d4321c',
                        borderColor: '#d4321c',
                        width: '100%',
                      }}
                    >
                      <span>DEACTIVATED ({childAccounts.filter(account => getStatusText(account) === 'Deactivated').length})</span>
                      <Iconify 
                        icon={expandedSections.deactivated ? "eva:arrow-ios-downward-fill" : "eva:arrow-ios-forward-fill"} 
                        width={16} 
                        sx={{ color: '#d4321c' }} 
                      />
                    </Typography>
                  </Box>
                </Box>
                {expandedSections.deactivated && (
                  <Stack spacing={0.5} sx={{ bgcolor: 'white', p: 1, pl: 0, alignItems: 'flex-start', width: { xs: '100%', sm: 360 } }}>
                    {childAccounts
                      .filter(account => getStatusText(account) === 'Deactivated')
                      .map((account) => (
                      <Card
                        key={account.id}
                        sx={{
                          width: { xs: '102%', sm: 360 },
                          height: 100,
                          p: 2,
                          borderRadius: 1,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #EBEBEB',
                          boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                          '&:hover': {
                            boxShadow: '0px -3px 0px 0px #EBEBEB inset, 0px 2px 4px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                          <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
                            <Avatar alt={`${account.firstName} ${account.lastName}`} sx={{ width: 40, height: 40, bgcolor: '#f5f5f5' }}>
                              {account.firstName?.charAt(0) || account.email.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 0.05, color: '#000' }}>
                                {account.firstName} {account.lastName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0, fontWeight: 600 }}>
                                {account.email}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: -3, lineHeight: 0.8, position: 'relative', top: -4 }}>
                                Activated on {account.activatedAt ? new Date(account.activatedAt).toLocaleDateString() : 'N/A'}
                              </Typography>
                            </Box>
                          </Stack>
                          <Tooltip title="More actions">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, account)}
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '8px',
                                border: '1px solid #E7E7E7',
                                boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                                background: '#FFFFFF',
                                '&:hover': {
                                  background: '#F5F5F5',
                                },
                              }}
                            >
                              <Iconify icon="eva:more-vertical-fill" width={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
        </>
      )}

      {/* Show empty state when no child accounts */}
      {childAccounts.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: { xs: 6, sm: 8 },
            px: 3,
          }}
        >
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                borderRadius: '50%',
                bgcolor: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: { xs: '2rem', sm: '2.5rem' },
              }}
            >
              🐣
            </Box>
            <Stack spacing={1} alignItems="center">
              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  color: '#221f20',
                  textAlign: 'center',
                }}
              >
                You don't have any child accounts connected.
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textAlign: 'center',
                  maxWidth: { xs: 300, sm: 400 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                }}
              >
                Connect a child account to grant them access to manage your campaigns.
              </Typography>
            </Stack>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              sx={{
                bgcolor: '#1340FF',
                color: 'white',
                px: { xs: 2, sm: 3 },
                py: 1.5,
                borderRadius: '8px',
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                width: { xs: '100%', sm: 'auto' },
                maxWidth: { xs: 300, sm: 'none' },
                '&:hover': {
                  bgcolor: '#0d2cc7',
                },
              }}
            >
              Invite Account
            </Button>
          </Stack>
        </Box>
      )}

      {/* Invite Dialog */}
      <Dialog 
        open={inviteDialogOpen} 
        onClose={() => setInviteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={false}
        PaperProps={{
          sx: {
            borderRadius: { xs: '16px', sm: '24px' },
            bgcolor: 'rgba(244, 244, 244, 1)',
            color: 'black',
            m: { xs: 2, sm: 2 },
            maxHeight: { xs: '80vh', sm: '90vh' },
            width: { xs: '90%', sm: 'auto' },
          }
        }}
      >
        <DialogTitle
          component="h1"
          sx={{
            fontFamily: 'Instrument Serif',
            fontWeight: 400,
            fontSize: { xs: '20px !important', sm: '25px !important' },
            lineHeight: { xs: '28px', sm: '36px' },
            letterSpacing: '0%',
            color: 'black',
            textAlign: 'left',
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>Invite Account</Box>
          <IconButton
            onClick={() => setInviteDialogOpen(false)}
            sx={{
              color: 'black',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Iconify icon="eva:close-fill" width={24} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '8px',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.6)',
                },
              }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '8px',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0, 0, 0, 0.6)',
                  },
                }}
              />
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '8px',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(0, 0, 0, 0.6)',
                  },
                }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
          <Button
            onClick={handleInviteChildAccount}
            disabled={submitting}
            sx={{
              width: { xs: '100%', sm: 177 },
              height: 44,
              pt: '10px',
              pr: { xs: '16px', sm: '32px' },
              pb: '13px',
              pl: { xs: '16px', sm: '32px' },
              gap: '6px',
              borderRadius: '8px',
              background: 'rgba(58, 58, 60, 1)',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                background: 'rgba(58, 58, 60, 0.9)',
              },
              '&:disabled': {
                background: 'rgba(58, 58, 60, 0.5)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {submitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 180,
            height: 'auto',
            pt: '8px',
            pr: '8px',
            pb: '8px',
            pl: '8px',
            borderRadius: '8px',
            border: '1px solid #E7E7E7',
            background: '#FFFFFF',
            boxShadow: [
              '0px 3px 7px 0px #0000001A',
              '0px 12px 12px 0px #00000017',
              '0px 27px 16px 0px #0000000D',
              '0px 48px 19px 0px #00000003',
              '0px 75px 21px 0px #00000000',
              '0px -3px 0px 0px #E7E7E7 inset',
            ].join(', '),
            '& .MuiMenuItem-root': {
              minHeight: 36,
              py: 1,
              px: 1.5,
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiListItemIcon-root': {
                minWidth: 32,
                mr: 1.5,
                '& .MuiSvgIcon-root': {
                  fontSize: '1rem',
                },
              },
              '& .MuiListItemText-root': {
                margin: 0,
                '& .MuiTypography-root': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  lineHeight: 1.4,
                },
              },
            },
          },
        }}
      >
        {/* Dynamic menu items based on account status */}
        {selectedAccount && getStatusText(selectedAccount) === 'Activated' && (
          <>
            <MenuItem
              onClick={() => {
                handleRemoveAccess(selectedAccount.id);
                handleMenuClose();
              }}
              disabled={submitting}
              sx={{ color: 'black' }}
            >
              <ListItemIcon>
                <Iconify icon="eva:close-fill" sx={{ color: 'black' }} />
              </ListItemIcon>
              <ListItemText>Remove Access</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDeleteChildAccount(selectedAccount.id);
                handleMenuClose();
              }}
              disabled={submitting}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <Iconify icon="eva:trash-2-fill" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}

        {selectedAccount && getStatusText(selectedAccount) === 'Deactivated' && (
          <>
            <MenuItem
              onClick={() => {
                handleGrantAccess(selectedAccount.id);
                handleMenuClose();
              }}
              disabled={submitting}
              sx={{ color: 'black' }}
            >
              <ListItemIcon>
                <Iconify icon="eva:checkmark-fill" sx={{ color: 'black' }} />
              </ListItemIcon>
              <ListItemText>Grant Access</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDeleteChildAccount(selectedAccount.id);
                handleMenuClose();
              }}
              disabled={submitting}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <Iconify icon="eva:trash-2-fill" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}

        {selectedAccount && getStatusText(selectedAccount) === 'Invitation Sent' && (
          <>
            <MenuItem
              onClick={() => {
                handleResendInvitation(selectedAccount.id);
                handleMenuClose();
              }}
              disabled={submitting}
            >
              <ListItemIcon>
                <Iconify icon="eva:refresh-fill" />
              </ListItemIcon>
              <ListItemText>Resend Invitation</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleRemoveAccess(selectedAccount.id);
                handleMenuClose();
              }}
              disabled={submitting}
              sx={{ color: 'black' }}
            >
              <ListItemIcon>
                <Iconify icon="eva:close-fill" sx={{ color: 'black' }} />
              </ListItemIcon>
              <ListItemText>Remove Access</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDeleteChildAccount(selectedAccount.id);
                handleMenuClose();
              }}
              disabled={submitting}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <Iconify icon="eva:trash-2-fill" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Container>
  );
}