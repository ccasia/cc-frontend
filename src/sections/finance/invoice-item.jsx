import dayjs from 'dayjs';
import React from 'react';
import PropTypes from 'prop-types';

import { Box, Button, TableRow, Checkbox, TableCell, Typography } from '@mui/material';

import { formatCurrencyAmount } from 'src/utils/currency';

import Label from 'src/components/label';

const InvoiceItem = ({ invoice, selected, onSelectRow, openEditInvoice }) => (
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
        <Typography variant="subtitle2">
          {formatCurrencyAmount(invoice?.amount, invoice?.currency || 'MYR')}
        </Typography>
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
        <Button size="small" variant="contained" onClick={openEditInvoice}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );

export default InvoiceItem;

InvoiceItem.propTypes = {
  invoice: PropTypes.object,
  selected: PropTypes.string,
  onSelectRow: PropTypes.func,
  openEditInvoice: PropTypes.func,
};
