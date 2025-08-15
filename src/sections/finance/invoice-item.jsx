import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { Box, Button, TableRow, Checkbox, TableCell, Typography } from '@mui/material';

import Label from 'src/components/label';
import { formatCurrencyAmount } from 'src/utils/currency';

const InvoiceItem = ({ invoice, onChangeStatus, selected, onSelectRow, openEditInvoice }) => {
  const [value, setValue] = useState(invoice?.status);

  useEffect(() => {
    setValue(invoice?.status);
  }, [setValue, invoice]);



  return (
    <TableRow
      key={invoice?.id}
      component={Box}
      sx={{
        cursor: 'pointer',
        ':hover': {
          bgcolor: (theme) => theme.palette.background.default,
        },
      }}
      onClick={openEditInvoice}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>
      <TableCell>
        <Label>{invoice?.invoiceNumber}</Label>
      </TableCell>
      <TableCell>
        <Typography variant="subtitle2">{invoice?.campaign?.name}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="subtitle2">{invoice?.creator?.user?.name}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="subtitle2">{dayjs(invoice?.createdAt).format('LL')}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="subtitle2">{formatCurrencyAmount(invoice?.amount, invoice?.currency || 'MYR')}</Typography>
      </TableCell>
      <TableCell>
        <Label
          color={
            // eslint-disable-next-line no-nested-ternary
            invoice?.status === 'approved'
              ? 'success'
              : invoice?.status === 'rejected'
                ? 'error'
                : 'warning'
          }
        >
          {invoice?.status}
        </Label>
      </TableCell>
      <TableCell>
        <Button
          size="small"
          variant="contained"
          // onClick={openEditInvoice}
          sx={{ borderRadius: 1 / 2 }}
        >
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default InvoiceItem;

InvoiceItem.propTypes = {
  invoice: PropTypes.object,
  onChangeStatus: PropTypes.func,
  selected: PropTypes.string,
  onSelectRow: PropTypes.func,
  openEditInvoice: PropTypes.func,
};
