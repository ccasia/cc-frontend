import React from 'react';
import PropTypes from 'prop-types';

import { Checkbox, TableRow, TableCell, ListItemText, Chip } from '@mui/material';

// import { useBoolean } from 'src/hooks/use-boolean';

// import Iconify from 'src/components/iconify';
// import { usePopover } from 'src/components/custom-popover';
// import { ConfirmDialog } from 'src/components/custom-dialog';

const PackageHistoryRow = ({ row, selected }) => {
  const {
    id,
    type,
    value,
    currency,
    totalUGCCredits,
    creditsUtilized,
    availableCredits,
    validityPeriod,
    states,
    createdAt,
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
    <>
      <TableRow hover selected={selected}>
        {/* {filteredData?.map((row, index) => (
                    <BrandEditListsTableRow
                      key={index}
                      {...row}
                      onEditRow={() => handleEditRow(row)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                    />
                  ))} */}
        {/* <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            //   onClick={onSelectRow}
          />
        </TableCell> */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}></TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{id || 'null'}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {/* <Avatar src={logo} alt={name} sx={{ mr: 2 }} /> */}

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
          {value} {currency}{' '}
        </TableCell>

        {/* <TableCell sx={{ whiteSpace: 'nowrap' }}>{valueSGD || 'null'}</TableCell> */}

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          {totalUGCCredits || 'null'}
        </TableCell>
        {/* <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          {creditsUtilized || ''}
        </TableCell> */}

        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          {availableCredits || ''}
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
          {invoiceDate ? getRemainingTime(invoiceDate, validityPeriod) : null} days
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'left' }}>
          <Chip
            label={states}
            variant="outlined"
            color={states === 'active' ? 'success' : 'error'}
          />
        </TableCell>

        {/* 
        <TableEmptyRows
          numSelected={table.selected.length}
          rowCount={emptyRows(filteredData, 10)}
          numHeaders={TABLE_HEAD.length}
          denseHeight={denseHeight}
        /> */}
      </TableRow>
    </>
  );
};

export default PackageHistoryRow;

PackageHistoryRow.propTypes = {
  row: PropTypes.object,
  selected: PropTypes.any,
};
