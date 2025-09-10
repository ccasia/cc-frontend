import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import { Chip, Tooltip, TableRow, TableCell, IconButton } from '@mui/material';

import Label from 'src/components/label';

import PackageEditDialog from './package-edit-dialog';

const dictionary = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  EXPIRED: 'Expired',
};

const PackageHistoryRow = ({ row, selected, onEditSuccess }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const {
    subscriptionId,
    creditsUsed,
    totalCredits,
    packagePrice,
    package: packageItem,
    customPackage,
    expiredAt,
    currency,
    status,
    id,
  } = row;

  const validity = useMemo(() => {
    if (dayjs().isAfter(dayjs(expiredAt), 'date')) {
      const overdue = dayjs().diff(dayjs(expiredAt), 'days');
      return `${overdue} days overdue`;
    }
    const remainingdays = dayjs(expiredAt).diff(dayjs(), 'days');
    return `${remainingdays} days left`;
  }, [expiredAt]);

  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleEditSuccess = () => {
    if (onEditSuccess) {
      onEditSuccess();
    }
    handleCloseEditDialog();
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label>{subscriptionId || 'None'}</Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label>{packageItem?.name || customPackage?.customName}</Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label>
            {currency === 'MYR'
              ? `RM ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(packagePrice)}`
              : `$ ${new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2 }).format(packagePrice)}`}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Label>{creditsUsed || 'None'}</Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Label> {totalCredits - creditsUsed || 'None'}</Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Label>{validity}</Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'left' }}>
          <Chip
            label={dictionary[status]}
            variant="outlined"
            color={status === 'ACTIVE' ? 'success' : 'error'}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Tooltip title="Edit Package">
            <IconButton size="small" color="primary" onClick={handleOpenEditDialog}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <PackageEditDialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog} 
        packageData={row}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default PackageHistoryRow;

PackageHistoryRow.propTypes = {
  row: PropTypes.object,
  selected: PropTypes.any,
  onEditSuccess: PropTypes.func,
};
