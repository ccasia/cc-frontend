import PropTypes from 'prop-types';
import { useState } from 'react';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { Stack, Avatar, Typography } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import { countries } from 'src/assets/data';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';

// eslint-disable-next-line import/no-cycle
import UserQuickEditForm from './user-quick-edit-form';
import { AdminLogsModal } from './adminLog';

// ----------------------------------------------------------------------

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

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={photoURL} alt={name} sx={{ mr: 2 }} />

          <ListItemText
            primary={name || 'null'}
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{
              component: 'span',
              color: 'text.disabled',
            }}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {`+${countries.find((item) => item.label === country)?.phone} ${phoneNumber}` || 'null'}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{admin?.role?.name || 'null'}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {country && (
            <Stack direction="row" alignItems="center">
              <Iconify
                key={country.label}
                icon={`circle-flags:${countries.find((item) => item.label === country).code.toLowerCase()}`}
                sx={{ mr: 1 }}
              />
              {country}
            </Stack>
          )}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{admin?.role?.name || 'null'}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (status === 'active' && 'success') ||
              (status === 'pending' && 'warning') ||
              (status === 'banned' && 'error') ||
              'default'
            }
          >
            {status}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>

          <Tooltip title="View Logs" placement="top" arrow>
            <IconButton
              color="info"
              onClick={handleViewLogs}
              disabled={user?.role === 'admin'}
            >
              <Iconify icon="material-symbols:note-rounded" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Quick Edit" placement="top" arrow>
            <IconButton
              color={quickEdit.value ? 'inherit' : 'default'}
              onClick={quickEdit.onTrue}
              disabled={user?.role === 'admin'}
            >
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete" placement="top" arrow>
            <IconButton
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
              disabled={user?.role === 'admin'}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

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
