import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { Avatar, Button, Stack, TableRow, TableCell, Typography } from '@mui/material';

import { formatCurrencyAmount } from 'src/utils/currency';
import { STATUS_COLORS } from './invoice-constants';


const InvoiceItem = ({ invoice, onChangeStatus, selected, onSelectRow, openEditInvoice }) => {
  const [value, setValue] = useState(invoice?.status);
  
  // Get currency information
  const currencyCode = invoice?.currency || 'MYR';
  const currencySymbol = invoice?.task?.currencySymbol || invoice?.currencySymbol;
  

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
      <TableCell>
        <Typography variant="body2" noWrap>
          {invoice?.invoiceNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={invoice?.campaign?.campaignBrief?.images?.[0] || invoice?.campaign?.brand?.logo}
            variant="rounded"
            sx={{ width: 32, height: 32, flexShrink: 0 }}
          />
          <Typography variant="body2" noWrap>
            {invoice?.campaign?.name}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {invoice?.creator?.user?.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {dayjs(invoice?.createdAt).format('DD/MM/YYYY')}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          noWrap
          sx={{
            ...(invoice?.dueDate &&
              dayjs(invoice.dueDate).isBefore(dayjs()) &&
              !['paid', 'approved'].includes(invoice?.status) && {
                color: '#ff4842',
                fontWeight: 600,
              }),
          }}
        >
          {invoice?.dueDate ? dayjs(invoice.dueDate).format('DD/MM/YYYY') : '-'}
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
            color: STATUS_COLORS[invoice?.status] || '#637381',
            borderColor: STATUS_COLORS[invoice?.status] || '#637381',
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
