import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { Box, Button, TableRow, Checkbox, TableCell, Typography } from '@mui/material';

import { formatCurrencyAmount } from 'src/utils/currency';

import Label from 'src/components/label';

const InvoiceItem = ({ invoice, onChangeStatus, selected, onSelectRow, openEditInvoice }) => {
  const [value, setValue] = useState(invoice?.status);
  
  // Get currency information
  const currencyCode = invoice?.currency || 'MYR';
  const currencySymbol = invoice?.task?.currencySymbol || invoice?.currencySymbol;
  
  // Debug log currency information
  console.log('Invoice Currency Info:', {
    invoiceId: invoice?.invoiceNumber,
    currencyCode,
    currencySymbol,
    taskCurrency: invoice?.task?.currency,
    taskCurrencySymbol: invoice?.task?.currencySymbol,
    topLevelCurrencySymbol: invoice?.currencySymbol
  });

  useEffect(() => {
    setValue(invoice?.status);
  }, [setValue, invoice]);

  return (
    <TableRow
      key={invoice?.id}
      hover
      selected={selected}
      sx={{
        cursor: 'pointer',
        bgcolor: 'transparent',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '& td': {
          py: 2,
        },
        '&:last-child': {
          borderBottom: 'none',
        },
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {invoice?.invoiceNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {invoice?.campaign?.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {invoice?.creator?.user?.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {dayjs(invoice?.createdAt).format('LL')}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {formatCurrencyAmount(
            invoice?.amount, 
            currencyCode,
            currencySymbol
          )}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'inline-block',
            px: 1.5,
            py: 0.5,
            fontSize: '0.75rem',
            border: '1px solid',
            borderBottom: '3px solid',
            borderRadius: 0.8,
            bgcolor: 'white',
            ...(invoice?.status === 'paid' && {
              color: '#2e6b55',
              borderColor: '#2e6b55',
            }),
            ...(invoice?.status === 'approved' && {
              color: '#1ABF66',
              borderColor: '#1ABF66',
            }),
            ...(invoice?.status === 'pending' && {
              color: '#f19f39',
              borderColor: '#f19f39',
            }),
            ...(invoice?.status === 'overdue' && {
              color: '#ff4842',
              borderColor: '#ff4842',
            }),
            ...(invoice?.status === 'draft' && {
              color: '#637381',
              borderColor: '#637381',
            }),
            ...(invoice?.status === 'rejected' && {
              color: '#ff4842',
              borderColor: '#ff4842',
            }),
          }}
        >
          {invoice?.status || 'pending'}
        </Typography>
      </TableCell>
      <TableCell>
        <Button
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: 1.5,
            py: 0.5,
            fontSize: '0.85rem',
            border: '1px solid #e0e0e0',
            borderBottom: '3px solid #e0e0e0',
            borderRadius: 0.8,
            bgcolor: 'white',
            color: '#221f20',
            minWidth: '65px',
            height: '32px',
          }}
          onClick={openEditInvoice}
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
