import React from 'react';
import PropTypes from 'prop-types';

import { Chip, TableRow, TableCell, ListItemText } from '@mui/material';

const dictionary = {
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
};

const PackageHistoryRow = ({ row, selected }) => {
  const {
    id,
    type,
    value,
    currency,
    totalUGCCredits,
    availableCredits,
    validityPeriod,
    status,
    invoiceDate,
  } = row;

  console.log(row);

  function getRemainingTime(createdDate, months) {
    const created = new Date(createdDate);
    const expiryDate = new Date(created);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const today = new Date();
    const diffTime = expiryDate - today;

    const remainingDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return remainingDays;
  }

  return (
    <TableRow hover selected={selected}>
      <TableCell sx={{ whiteSpace: 'nowrap' }} />

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{id || 'null'}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <ListItemText
          primary={type || 'null'}
          primaryTypographyProps={{ typography: 'body2' }}
          secondaryTypographyProps={{
            component: 'span',
            color: 'text.disabled',
          }}
        />
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {value} {currency}
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
        {totalUGCCredits || 'null'}
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
        {availableCredits || ''}
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
        {invoiceDate ? getRemainingTime(invoiceDate, validityPeriod) : null} days
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'left' }}>
        <Chip
          label={dictionary[status]}
          variant="outlined"
          color={status === 'active' ? 'success' : 'error'}
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
