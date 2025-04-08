import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Chip, TableRow, TableCell } from '@mui/material';

import Label from 'src/components/label';

const dictionary = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  EXPIRED: 'Expired',
};

const PackageHistoryRow = ({ row, selected }) => {
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
  } = row;

  const validity = useMemo(() => {
    if (dayjs().isAfter(dayjs(expiredAt), 'date')) {
      const overdue = dayjs().diff(dayjs(expiredAt), 'days');
      return `${overdue} days overdue`;
    }
    const remainingdays = dayjs(expiredAt).diff(dayjs(), 'days');
    return `${remainingdays} days left`;
  }, [expiredAt]);

  return (
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
    </TableRow>
  );
};

export default PackageHistoryRow;

PackageHistoryRow.propTypes = {
  row: PropTypes.object,
  selected: PropTypes.any,
};
