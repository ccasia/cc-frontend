import { useState } from 'react';
import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { Box, Stack, Avatar, styled, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { countries } from 'src/assets/data';
import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { AdminLogsModal } from './adminLog';
// eslint-disable-next-line import/no-cycle
import UserQuickEditForm from './user-quick-edit-form';

// ----------------------------------------------------------------------

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#fafafa',
  },
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #f5f5f5',
    padding: '12px 16px',
    fontSize: '0.875rem',
  },
  '&:last-child .MuiTableCell-root': {
    borderBottom: 'none',
  },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  width: '30px',
  height: '30px',
  borderRadius: '6px',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

export default function UserTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {
  const { name, admin, country, phoneNumber, status, photoURL } = row;

  const { user } = useAuthContext();

  const confirm = useBoolean();

  const quickEdit = useBoolean();

  const popover = usePopover();
  const [logs, setLogs] = useState([]);
  const [openLogs, setOpenLogs] = useState(false);

  const fetchAdminLogs = async (id) => {
    try {
      const response = await axiosInstance.get(endpoints.users.getAdminlogs(id));;
      return response.data;
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      return [];
    }
  };

  const handleViewLogs = async () => {
    if (admin?.userId) {
      const adminLogs = await fetchAdminLogs(admin.userId);
      setLogs(adminLogs);
      setOpenLogs(true);
    } else {
      console.warn("Admin ID is missing!");
    }
  };

  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case 'active':
        return '#1DBF66';
      case 'pending':
        return '#FFC704';
      case 'banned':
      case 'rejected':
      case 'blacklisted':
      case 'suspended':
      case 'spam':
        return '#D4321C';
      default:
        return '#6b7280';
    }
  };

  const renderStatusBadge = (statusValue) => {
    const statusColor = getStatusColor(statusValue);
    
    return (
      <Label
        sx={{
          bgcolor: '#FFFFFF',
          color: statusColor,
          border: '1px solid',
          borderColor: statusColor,
          borderBottom: 2,
          borderBottomColor: statusColor,
          borderRadius: 0.75,
          py: 0.375,
          px: 1,
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        {statusValue}
      </Label>
    );
  };

  return (
    <>
      <StyledTableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox 
            checked={selected} 
            onClick={onSelectRow}
            sx={{
              '&.Mui-checked': {
                color: '#1340ff',
              },
            }}
          />
        </TableCell>

        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={photoURL} 
            alt={name} 
            sx={{ 
              mr: 2,
              width: 38,
              height: 38,
              bgcolor: '#f3f4f6',
              color: '#9ca3af',
            }} 
          />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#111827',
                fontSize: '0.875rem',
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {name || 'null'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#6b7280',
                fontSize: '0.75rem',
                lineHeight: 1.2,
                display: 'block',
              }}
            >
              {row.email || 'No email'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', color: '#374151', fontSize: '0.8rem' }}>
          {`+${countries.find((item) => item.label === country)?.phone} ${phoneNumber}` || 'null'}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', color: '#374151', fontSize: '0.8rem' }}>
          {admin?.role?.name || 'null'}
        </TableCell>
        
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {country && (
            <Stack direction="row" alignItems="center">
              <Iconify
                key={country.label}
                icon={`circle-flags:${countries.find((item) => item.label === country).code.toLowerCase()}`}
                sx={{ mr: 1, width: 18, height: 18 }}
              />
              <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.8rem' }}>
                {country}
              </Typography>
            </Stack>
          )}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', color: '#374151', fontSize: '0.8rem' }}>
          {admin?.role?.name || 'null'}
        </TableCell>

        <TableCell>
          {renderStatusBadge(status)}
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="View Logs" placement="top" arrow>
              <StyledIconButton
                onClick={handleViewLogs}
                disabled={user?.role === 'admin'}
                sx={{
                  color: '#666666',
                  bgcolor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  '&:hover': {
                    bgcolor: '#e9ecef',
                    color: '#495057',
                    borderColor: '#dee2e6',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                  },
                }}
              >
                <Iconify icon="heroicons:document-text-20-solid" width={15} height={15} />
              </StyledIconButton>
            </Tooltip>

            <Tooltip title="Quick Edit" placement="top" arrow>
              <StyledIconButton
                onClick={quickEdit.onTrue}
                disabled={user?.role === 'admin'}
                sx={{
                  color: quickEdit.value ? '#1340ff' : '#666666',
                  bgcolor: quickEdit.value ? 'rgba(19, 64, 255, 0.08)' : '#f8f9fa',
                  border: '1px solid',
                  borderColor: quickEdit.value ? '#1340ff' : '#e9ecef',
                  '&:hover': {
                    bgcolor: 'rgba(19, 64, 255, 0.12)',
                    color: '#1340ff',
                    borderColor: '#1340ff',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                  },
                }}
              >
                <Iconify icon="heroicons:pencil-square-20-solid" width={15} height={15} />
              </StyledIconButton>
            </Tooltip>

            <Tooltip title="Delete" placement="top" arrow>
              <StyledIconButton
                onClick={() => {
                  confirm.onTrue();
                  popover.onClose();
                }}
                disabled={user?.role === 'admin'}
                sx={{
                  color: '#dc3545',
                  bgcolor: 'rgba(220, 53, 69, 0.08)',
                  border: '1px solid rgba(220, 53, 69, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(220, 53, 69, 0.12)',
                    color: '#dc3545',
                    borderColor: '#dc3545',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                  },
                }}
              >
                <Iconify icon="heroicons:trash-20-solid" width={15} height={15} />
              </StyledIconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </StyledTableRow>

      <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete ${name}?`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
      <AdminLogsModal
        open={openLogs}
        logs={logs}
        adminName={name}
        onClose={() => setOpenLogs(false)}
      />
    </>
  );
}

UserTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
