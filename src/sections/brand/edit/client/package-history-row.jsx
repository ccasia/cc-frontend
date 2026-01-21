import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import { Tooltip, TableRow, TableCell, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

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
      <TableRow
        hover
        selected={selected}
        sx={{
          '&:hover': { bgcolor: 'action.hover' },
          '& td': { borderBottom: '1px solid #EBEBEB' },
        }}
      >
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2" fontWeight={500}>
            {subscriptionId || 'None'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2" fontWeight={500}>
            {packageItem?.name || customPackage?.customName}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2" color="text.secondary">
            {currency === 'MYR'
              ? `RM ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(packagePrice)}`
              : `$ ${new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2 }).format(packagePrice)}`}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {creditsUsed || 0}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Typography variant="body2" fontWeight={600} color="primary.main">
            {totalCredits - creditsUsed || 0}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {validity}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'left' }}>
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
              color: status === 'ACTIVE' ? '#1ABF66' : '#D4321C',
              borderColor: status === 'ACTIVE' ? '#1ABF66' : '#D4321C',
            }}
          >
            {dictionary[status]}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          <Tooltip title="Edit Package">
            <IconButton
              size="small"
              onClick={handleOpenEditDialog}
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
              <Iconify icon="eva:edit-fill" width={18} />
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
