import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { Select, Button, TableRow, MenuItem, Checkbox, TableCell, Typography } from '@mui/material';

import Label from 'src/components/label';

const InvoiceItem = ({ invoice, onChangeStatus, selected, onSelectRow, openEditInvoice }) => {
  const [value, setValue] = useState(invoice?.status);

  useEffect(() => {
    setValue(invoice?.status);
  }, [setValue, invoice]);

  const formatAmount = (amount) => {
    const numericAmount = parseFloat(amount.toString().replace(/[^0-9.-]+/g, ''));
    return `RM${numericAmount.toLocaleString()}`;
  };

  return (
    <TableRow key={invoice?.id}>
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
        <Typography variant="subtitle2">{formatAmount(invoice?.amount)}</Typography>
      </TableCell>
      <TableCell>
        <Select
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChangeStatus(e.target.value);
          }}
        >
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
        </Select>
      </TableCell>
      <TableCell>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            openEditInvoice(invoice?.id);
          }}
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
