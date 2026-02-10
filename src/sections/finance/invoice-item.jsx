import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Button,
  Checkbox,
  TableRow,
  TableCell,
  Typography,
  Tooltip,
} from '@mui/material';

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
      onClick={openEditInvoice}
      sx={{
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
      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {invoice?.invoiceNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={invoice?.campaign?.campaignBrief?.images?.[0] || invoice?.campaign?.brand?.logo}
            variant="circular"
            sx={{ width: 36, height: 36, flexShrink: 0 }}
          />
          <Typography variant="body2">{invoice?.campaign?.name}</Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {invoice?.creator?.user?.paymentForm?.bankAccountName ||
            invoice?.bankAcc?.payTo ||
            invoice?.creator?.user?.name ||
            'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {dayjs(invoice?.createdAt).format('DD MMM YYYY')}
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
          {invoice?.dueDate ? dayjs(invoice.dueDate).format('DD MMM YYYY') : '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {formatCurrencyAmount(invoice?.amount, currencyCode, currencySymbol)}
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
