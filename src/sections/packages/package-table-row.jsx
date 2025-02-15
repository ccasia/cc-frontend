import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';

// eslint-disable-next-line import/no-cycle
// import UserQuickEditForm from './user-quick-edit-form';

// ----------------------------------------------------------------------

export default function PackageTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {
  const { validityPeriod, name, credits, createdAt, prices } = row;

  const { user } = useAuthContext();

  const confirm = useBoolean();

  const quickEdit = useBoolean();

  const popover = usePopover();

  const priceMYR = prices.find((price) => price.currency === 'MYR');
  const priceSGD = prices.find((price) => price.currency === 'SGD');

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label>{name}</Label>
        </TableCell>

        <TableCell
          sx={{ whiteSpace: 'nowrap' }}
        >{`RM ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(priceMYR.amount)}`}</TableCell>
        <TableCell
          sx={{ whiteSpace: 'nowrap' }}
        >{`RM ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(priceSGD.amount)}`}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Label>{credits}</Label>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Label>{validityPeriod}</Label>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(createdAt).format('LL')}</TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
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

      {/* <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} /> */}

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
    </>
  );
}

PackageTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
