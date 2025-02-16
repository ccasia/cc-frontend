import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Chip, TableRow, TableCell } from '@mui/material';

import Label from 'src/components/label';

const dictionary = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  expired: 'Expired',
};

// {
//   "id": "cm763kw7n0003ry8lxjlc5kqn",
//   "subscriptionId": "P0003",
//   "companyId": "cm763kw7n0000ry8lhtod4iqn",
//   "packageId": "cm74vq6j80001ryv1zc2nbmsq",
//   "customPackageId": null,
//   "currency": "SGD",
//   "creditsUsed": 9,
//   "totalCredits": 15,
//   "packagePrice": 8900,
//   "status": "ACTIVE",
//   "createdAt": "2025-02-15T11:11:37.235Z",
//   "updatedAt": "2025-02-15T13:16:21.541Z",
//   "expiredAt": "2025-04-14T16:00:00.000Z",
//   "package": {
//       "id": "cm74vq6j80001ryv1zc2nbmsq",
//       "name": "Basic",
//       "credits": 15,
//       "validityPeriod": 2,
//       "createdAt": "2025-02-14T14:44:00.788Z",
//       "updatedAt": "2025-02-14T14:44:00.788Z"
//   },
//   "customPackage": null
// }

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
