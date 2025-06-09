import * as yup from 'yup';
import isEqual from 'lodash/isEqual';
import { Toaster } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import {
  Box,
  Chip,
  Stack,
  Dialog,
  Select,
  styled,
  Divider,
  MenuItem,
  Checkbox,
  InputBase,
  Typography,
  FormControl,
  OutlinedInput,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetRoles from 'src/hooks/use-get-roles';
import { useBoolean } from 'src/hooks/use-boolean';
import { useGetAdminsForSuperadmin } from 'src/hooks/use-get-admins-for-superadmin';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { USER_STATUS_OPTIONS } from 'src/_mock';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

// eslint-disable-next-line import/no-cycle
import UserTableRow from '../user-table-row';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_STATUS_OPTIONS];

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: 180 },
  { id: 'phoneNumber', label: 'Phone Number', width: 220 },
  { id: 'designation', label: 'Designation', width: 180 },
  { id: 'country', label: 'Country', width: 100 },
  { id: 'role', label: 'Role', width: 100 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

export const MODULE_ITEMS = [
  {
    name: 'Manage Creator',
    items: ['view_creator', 'create_creator', 'edit_creator', 'delete_creator'],
    value: 'creator',
  },
  {
    name: 'Manage Campaign',
    items: ['view_campaign', 'create_campaign', 'edit_campaign', 'delete_campaign'],
    value: 'campaign',
  },
  {
    name: 'Manage Brand',
    items: ['view_brand', 'create_brand', 'edit_brand', 'delete_brand'],
    value: 'brand',
  },
  {
    name: 'Manage Metric',
    items: ['view_metric', 'create_metric', 'edit_metric', 'delete_metric'],
    value: 'metric',
  },
  {
    name: 'Manage Invoice',
    items: ['view_invoice', 'create_invoice', 'edit_invoice', 'delete_invoice'],
    value: 'invoice',
  },
];

const defaultFilters = {
  name: '',
  role: [],
  status: 'all',
};

// Styled components for improved UI
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #f0f0f0',
  overflow: 'hidden',
}));

const StyledTableHead = styled('thead')(({ theme }) => ({
  backgroundColor: '#fafafa',
  '& .MuiTableCell-head': {
    color: '#666666',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'none',
    borderBottom: '1px solid #f0f0f0',
    padding: '12px 16px',
    height: '44px',
  },
}));

// ----------------------------------------------------------------------

export default function UserListView() {
  const { user } = useAuthContext();
  const { admins, isLoading: adminLoading } = useGetAdminsForSuperadmin();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const { data: roles, isLoading } = useGetRoles();
  const theme = useTheme();

  const buttonLoading = useBoolean();

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleClickOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const table = useTable();

  const settings = useSettingsContext();

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState(admins);

  const [filters, setFilters] = useState(defaultFilters);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const dataInPage = dataFiltered?.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered?.length && canReset) || !dataFiltered?.length;

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await axiosInstance.delete(`${endpoints.admin.delete}/${id}`);
        const deleteRows = tableData.filter((row) => row.id !== id);
        setTableData(deleteRows);
        enqueueSnackbar('Successfully deleted admin');
      } catch (error) {
        enqueueSnackbar(error?.message, { variant: 'error' });
      }
    },
    [enqueueSnackbar, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    enqueueSnackbar('Delete success!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered, dataInPage, enqueueSnackbar, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (status) => {
      handleFilters('status', status);
    },
    [handleFilters]
  );

  const handleFilterRole = useCallback(
    (event) => {
      handleFilters(
        'role',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [handleFilters]
  );

  const handleFilterName = useCallback(
    (event) => {
      handleFilters('name', event.target.value);
    },
    [handleFilters]
  );

  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const schema = yup.object().shape({
    email: yup.string().email().required('Email is required'),
    role: yup.string().required('Role is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      role: '',
      email: '',
    },
  });

  const { handleSubmit, watch } = methods;

  const r = watch('role');

  const onSubmit = handleSubmit(async (data) => {
    try {
      buttonLoading.onTrue();
      await axiosInstance.post(endpoints.users.newAdmin, data);
      enqueueSnackbar('Link has been sent to admin!');
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      buttonLoading.onFalse();
    }
  });

  const inviteAdminDialog = (
    <Dialog 
      open={openDialog} 
      onClose={handleCloseDialog} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #f0f0f0',
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#111827',
                  fontSize: '1.25rem',
                }}
              >
                Invite Admin
              </Typography>
              <IconButton
                onClick={handleCloseDialog}
                sx={{
                  color: '#6b7280',
                  '&:hover': {
                    bgcolor: '#f3f4f6',
                    color: '#374151',
                  },
                }}
              >
                <Iconify icon="heroicons:x-mark-20-solid" width={20} height={20} />
              </IconButton>
            </Stack>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6b7280', 
                mt: 0.5,
                fontSize: '0.875rem',
              }}
            >
              Send an invitation to a new admin user
            </Typography>
          </Box>

          {/* Stepper Content */}
          <Box sx={{ mb: 3 }}>
            {activeStep === 0 && (
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600, 
                    color: '#374151',
                    fontSize: '1rem',
                  }}
                >
                  Select Role
                </Typography>
                
                <RHFSelect 
                  name="role" 
                  label="Role"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1340ff',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1340ff',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  {!isLoading &&
                    roles.map((item) => (
                      <MenuItem 
                        key={item.id} 
                        value={item.id}
                        sx={{
                          borderRadius: 0.75,
                          mx: 0.5,
                          my: 0.25,
                          '&:hover': {
                            bgcolor: 'rgba(19, 64, 255, 0.04)',
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(19, 64, 255, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(19, 64, 255, 0.12)',
                            },
                          },
                        }}
                      >
                        {item.name}
                      </MenuItem>
                    ))}
                </RHFSelect>

                {!isLoading && r && (
                  <Box
                    sx={{
                      bgcolor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: 1,
                      p: 2,
                      mb: 3,
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 1, 
                        color: '#374151',
                        fontWeight: 600,
                      }}
                    >
                      Role Permissions:
                    </Typography>
                    <Stack spacing={0.5}>
                      {roles
                      .find((item) => item.id === r)
                      ?.permissions.map((permission) => (
                          <Typography 
                            key={permission.name}
                            variant="caption" 
                            sx={{
                              color: '#6b7280',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                bgcolor: '#1340ff',
                              }}
                            />
                            <strong style={{ color: '#374151' }}>{permission.name}</strong>
                            <span>→</span>
                            {permission.descriptions}
                        </Typography>
                      ))}
                </Stack>
                  </Box>
                )}

                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!r}
                  sx={{
                    bgcolor: '#1340ff',
                    color: '#ffffff',
                    borderRadius: 1,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: '#0f35d1',
                    },
                    '&:disabled': {
                      bgcolor: '#e5e7eb',
                      color: '#9ca3af',
                    },
                  }}
                >
                  Continue
                </Button>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600, 
                    color: '#374151',
                    fontSize: '1rem',
                  }}
                        >
                  Admin Email
                </Typography>

                <RHFTextField 
                  name="email" 
                  type="email" 
                  label="Email Address"
                  placeholder="Enter admin email address"
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1340ff',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1340ff',
                        borderWidth: 2,
                      },
                    },
                  }}
                />

                <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  sx={{
                      borderColor: '#d1d5db',
                      color: '#6b7280',
                      borderRadius: 1,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#9ca3af',
                        bgcolor: '#f9fafb',
                      },
                  }}
                >
                  Back
                </Button>
                  <LoadingButton 
                    type="submit" 
                    loading={buttonLoading.value}
                  variant="contained"
                  sx={{
                      bgcolor: '#1340ff',
                      color: '#ffffff',
                      borderRadius: 1,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#0f35d1',
                      },
                  }}
                >
                    Send Invitation
                  </LoadingButton>
              </Stack>
              </Box>
            )}
          </Box>

          {/* Progress Indicator */}
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #f0f0f0' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                  sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: '#1340ff',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                1
              </Box>
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  bgcolor: activeStep >= 1 ? '#1340ff' : '#e5e7eb',
                  borderRadius: 1,
                  transition: 'background-color 0.3s ease',
                }}
              />
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: activeStep >= 1 ? '#1340ff' : '#e5e7eb',
                  color: activeStep >= 1 ? '#ffffff' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
            }}
          >
                2
              </Box>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#374151', fontWeight: 500 }}>
                Select Role
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: activeStep >= 1 ? '#374151' : '#9ca3af',
                  fontWeight: 500,
                  transition: 'color 0.3s ease',
                }}
              >
                Enter Email
              </Typography>
            </Stack>
          </Box>
        </Box>
      </FormProvider>
    </Dialog>
  );

  useEffect(() => {
    setTableData(admins && admins.filter((admin) => admin?.id !== user?.id));
  }, [admins, user]);

  if (adminLoading) {
    return (
      <Box
      sx={{
        position: 'relative',
        top: 200,
        textAlign: 'center',
      }}
    >
      <CircularProgress
        thickness={7}
        size={25}
        sx={{
            color: theme.palette.common.black,
          strokeLinecap: 'round',
        }}
      />
    </Box>
    );
  }

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="List Admins"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Admin' },
            { name: 'List' },
          ]}
          action={
            user?.role === 'superadmin' && (
              <Button
                variant="contained"
                size="small"
                onClick={handleClickOpenDialog}
                startIcon={<Iconify icon="heroicons:user-plus-20-solid" width={18} />}
                sx={{
                  bgcolor: '#1340ff',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: '#0f35d1',
                  },
                }}
              >
                Invite admin
              </Button>
            )
          }
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />

        {inviteAdminDialog}

          <Box
            sx={{
            mb: 2.5,
          }}
        >
          {/* Combined Controls Container */}
          <Box
            sx={{
              border: '1px solid #e7e7e7',
              borderRadius: 1,
              p: 2,
              bgcolor: 'background.paper',
            }}
          >
            {/* Status Filter Buttons */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                mb: 2,
              }}
            >
              {STATUS_OPTIONS.map((option) => {
                const isActive = filters.status === option.value;
                const count = option.value === 'all'
                  ? tableData?.length || 0
                  : tableData?.filter((item) => item.status === option.value).length || 0;

                return (
                  <Button
                    key={option.value}
                    onClick={() => handleFilterStatus(option.value)}
                    sx={{
                      px: 2,
                      py: 1,
                      minHeight: '38px',
                      height: '38px',
                      minWidth: 'fit-content',
                      color: isActive ? '#ffffff' : '#666666',
                      bgcolor: isActive ? '#1340ff' : 'transparent',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      borderRadius: 0.75,
                      textTransform: 'none',
              position: 'relative',
                      transition: 'all 0.2s ease',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '1px',
                        left: '1px',
                        right: '1px',
                        bottom: '1px',
                        borderRadius: 0.75,
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.2s ease',
                        zIndex: -1,
                      },
                      '&:hover::before': {
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
                      },
                      '&:hover': {
                        bgcolor: isActive ? '#1340ff' : 'transparent',
                        color: isActive ? '#ffffff' : '#1340ff',
                        transform: 'scale(0.98)',
                      },
                      '&:focus': {
                        outline: 'none',
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <span>{option.label}</span>
                      <Box
              sx={{
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          bgcolor: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f5f5f5',
                          color: isActive ? '#ffffff' : '#666666',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minWidth: 20,
                          textAlign: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {count}
          </Box>
                    </Stack>
                  </Button>
                );
              })}
            </Stack>

            <Divider sx={{ borderColor: '#f0f0f0', mb: 2 }} />

            {/* Search and Filter Controls */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 1.5, md: 1.5 },
              }}
            >
              {/* Search Box */}
              <Box
                sx={{
                  width: { xs: '100%', sm: '240px', md: '320px' },
                  border: '1px solid #e7e7e7',
                  borderRadius: 0.75,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  height: '38px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  '&:hover': {
                    borderColor: '#1340ff',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(19, 64, 255, 0.1)',
                  },
                  '&:focus-within': {
                    borderColor: '#1340ff',
                    boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <InputBase
                  value={filters.name}
                  onChange={handleFilterName}
                  placeholder="Search admins..."
                  startAdornment={
                    <Iconify
                      icon="heroicons:magnifying-glass-20-solid"
                      sx={{
                        width: 18,
                        height: 18,
                        color: 'text.disabled',
                        ml: 1.5,
                        mr: 1,
                        transition: 'color 0.2s ease',
                      }}
                    />
                  }
                  sx={{
                    width: '100%',
                    color: 'text.primary',
                    fontSize: '0.95rem',
                    '& input': {
                      py: 1,
                      px: 1,
                      height: '100%',
                      transition: 'all 0.2s ease',
                      '&::placeholder': {
                        color: '#999999',
                        opacity: 1,
                        transition: 'color 0.2s ease',
                      },
                      '&:focus::placeholder': {
                        color: '#cccccc',
                      },
                    },
                  }}
                />
              </Box>

              {/* Right Side Controls */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {/* Role Filter */}
                <Box
                  sx={{
                    width: { xs: '100%', sm: '200px' },
                    minWidth: { xs: '100%', sm: '200px' },
                    maxWidth: { xs: '100%', sm: '200px' },
                    border: '1px solid #e7e7e7',
                    borderRadius: 0.75,
                    bgcolor: 'background.paper',
                    height: '38px',
                    transition: 'border-color 0.2s ease',
                    '&:hover': {
                      borderColor: '#1340ff',
                    },
                  }}
                >
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={filters.role}
                      onChange={handleFilterRole}
                      input={<OutlinedInput />}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected.length === 0) {
                          return (
                            <Box sx={{ 
                              color: '#999999', 
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                            }}>
                              Filter by role
                            </Box>
                          );
                        }
                        return selected.join(', ');
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'white',
                            border: '1px solid #e7e7e7',
                            borderRadius: 1,
                            mt: 0.5,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            maxHeight: 240,
                          },
                        },
                      }}
                      sx={{
                        height: '100%',
                        '& .MuiSelect-select': {
                          py: 1,
                          px: 1.25,
                          display: 'flex',
                          alignItems: 'center',
                          minHeight: 'unset',
                          fontSize: '0.875rem',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '& .MuiSelect-icon': {
                          right: 6,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: filters.role.length > 0 ? '#1340ff' : 'text.secondary',
                          transition: 'color 0.2s ease',
                        },
                      }}
                    >
                      {!isLoading &&
                        roles.map((role) => (
                          <MenuItem
                            key={role.name}
                            value={role.name}
                            sx={{
                              mx: 0.5,
                              my: 0.25,
                              borderRadius: 0.75,
                              fontSize: '0.875rem',
                              '&.Mui-selected': {
                                bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                                color: '#1340ff',
                                '&:hover': {
                                  bgcolor: 'rgba(19, 64, 255, 0.12)',
                                },
                              },
                              '&:hover': {
                                bgcolor: 'rgba(19, 64, 255, 0.04)',
                              },
                            }}
                          >
                            <Checkbox
                              disableRipple
                              size="small"
                              checked={filters.role.includes(role.name)}
                              sx={{
                                mr: 1,
                                '&.Mui-checked': {
                                  color: '#1340ff',
                                },
                              }}
                            />
                            {role.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Results Count - Only show when filters are active */}
                {canReset && (
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <strong style={{ color: '#374151' }}>{dataFiltered?.length || 0}</strong> results
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Active Filters Display */}
            {canReset && (
              <Box sx={{ mt: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {/* Search Term Chip */}
                  {filters.name && (
                    <Chip
                      label={`Search: "${filters.name}"`}
                      size="small"
                      onDelete={() => handleFilters('name', '')}
                      sx={{
                        bgcolor: '#f0f9ff',
                        color: '#1340ff',
                        border: '1px solid rgba(19, 64, 255, 0.2)',
                        height: '32px',
                        '& .MuiChip-deleteIcon': {
                          color: '#1340ff',
                          '&:hover': {
                            color: '#0f35d1',
                          },
                        },
                      }}
                    />
                  )}

                  {/* Status Chip */}
                  {filters.status !== 'all' && (
                    <Chip
                      label={`Status: ${filters.status}`}
                      size="small"
                      onDelete={() => handleFilters('status', 'all')}
                      sx={{
                        bgcolor: '#f0f9ff',
                        color: '#1340ff',
                        border: '1px solid rgba(19, 64, 255, 0.2)',
                        height: '32px',
                        '& .MuiChip-deleteIcon': {
                          color: '#1340ff',
                          '&:hover': {
                            color: '#0f35d1',
                          },
                        },
                      }}
                    />
                  )}

                  {/* Role Chips */}
                  {filters.role.map((role) => (
                    <Chip
                      key={role}
                      label={`Role: ${role}`}
                      size="small"
                      onDelete={() => {
                        const newRoles = filters.role.filter((roleItem) => roleItem !== role);
                        handleFilters('role', newRoles);
                      }}
                      sx={{
                        bgcolor: '#f0f9ff',
                        color: '#1340ff',
                        border: '1px solid rgba(19, 64, 255, 0.2)',
                        height: '32px',
                        '& .MuiChip-deleteIcon': {
                          color: '#1340ff',
                          '&:hover': {
                            color: '#0f35d1',
                          },
                        },
                      }}
                    />
                  ))}

                  {/* Clear All Button */}
                  <Button
                    size="small"
                    onClick={handleResetFilters}
                    startIcon={<Iconify icon="heroicons:trash-20-solid" width={14} height={14} />}
                    sx={{
                      color: '#dc3545',
                      bgcolor: 'rgba(220, 53, 69, 0.08)',
                      border: '1px solid rgba(220, 53, 69, 0.2)',
                      borderRadius: 0.75,
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      height: '32px',
                      '&:hover': {
                        bgcolor: 'rgba(220, 53, 69, 0.12)',
                        borderColor: 'rgba(220, 53, 69, 0.3)',
                      },
                    }}
                  >
                    Clear
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        </Box>



        <Card
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <StyledTableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <TableSelectedAction
                dense={table.dense}
                numSelected={table.selected.length}
                rowCount={dataFiltered?.length}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    dataFiltered.map((row) => row.id)
                  )
                }
                action={
                  <Tooltip title="Delete">
                    <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="heroicons:trash-20-solid" />
                    </IconButton>
                  </Tooltip>
                }
              />

              <Scrollbar>
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headLabel={TABLE_HEAD}
                    rowCount={dataFiltered?.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        dataFiltered.map((row) => row.id)
                      )
                    }
                  sx={{
                    '& .MuiTableCell-head': {
                      backgroundColor: '#fafafa',
                      color: '#666666',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      borderBottom: '1px solid #f0f0f0',
                      padding: '12px 16px',
                      height: '44px',
                    },
                  }}
                  />

                  <TableBody>
                    {dataFiltered
                      ?.slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row) => (
                        <UserTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onDeleteRow={() => handleDeleteRow(row.id)}
                          onEditRow={() => handleEditRow(row.id)}
                        />
                      ))}

                    <TableEmptyRows
                      height={denseHeight}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered?.length)}
                    />

                    <TableNoData notFound={notFound} />
                  </TableBody>
                </Table>
              </Scrollbar>
          </StyledTableContainer>

            <TablePaginationCustom
              count={dataFiltered?.length}
              page={table.page}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
              dense={table.dense}
              onChangeDense={table.onChangeDense}
            />
          </Card>
      </Container>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
      <Toaster />
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, role } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis?.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (user) => user?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
  }

  if (role.length) {
    inputData = inputData.filter((user) => role.includes(user?.admin?.role?.name));
  }

  return inputData;
}
