import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import {
  Stack,
  Avatar,
  Checkbox,
  TableRow,
  TableCell,
  Typography,
  CircularProgress,
} from '@mui/material';

import { formatCurrencyAmount } from 'src/utils/currency';

import { STATUS_COLORS } from './invoice-constants';

// isChild: a receipts-only invoice drawn nested under its main invoice.
// parentInvoiceNumber: a child shown on its own (its main invoice isn't in the current results).
const InvoiceItem = ({
  invoice,
  onChangeStatus,
  selected,
  onSelectRow,
  openEditInvoice,
  isChild = false,
  parentInvoiceNumber,
}) => {
  const [value, setValue] = useState(invoice?.status);

  // Get currency information
  const currencyCode = invoice?.currency || 'MYR';
  const currencySymbol = invoice?.task?.currencySymbol || invoice?.currencySymbol;

  useEffect(() => {
    setValue(invoice?.status);
  }, [setValue, invoice]);

  const isPaid = invoice?.status === 'paid';
  const isProcessing = invoice?.status === 'processing';

  return (
    <TableRow
      key={invoice?.id}
      hover
      selected={selected}
      onClick={openEditInvoice}
      sx={{
        cursor: 'pointer',
        // Children sit on a faint tint so the family reads as one block
        bgcolor: isChild ? '#FAFAFB' : 'transparent',
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
        <Checkbox checked={selected} onClick={onSelectRow} disabled={isPaid} />
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          {/* Tree connector tying the child to the main invoice row above */}
          {isChild && (
            <Typography sx={{ color: '#C7C7CC', lineHeight: '22px', pl: 0.5, flexShrink: 0 }}>└</Typography>
          )}
          <Stack spacing={0.5} alignItems="flex-start">
            <Typography variant="body2" noWrap>
              {invoice?.invoiceNumber}
            </Typography>
            {/* Child invoice: receipts required after the main invoice was sent */}
            {invoice?.invoiceType === 'REIMBURSEMENT' && (
              <Typography
                variant="caption"
                sx={{
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.75,
                  fontWeight: 600,
                  color: '#1340FF',
                  bgcolor: '#1340FF14',
                  whiteSpace: 'nowrap',
                }}
              >
                Receipts only
              </Typography>
            )}
            {parentInvoiceNumber && (
              <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                ↳ Child of {parentInvoiceNumber}
              </Typography>
            )}
          </Stack>
        </Stack>
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
          flexDirection="row"
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'inline-flex',
            gap: 0.75,
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
          {isProcessing && <CircularProgress size={16} sx={{ color: '#8A5AFE' }} />}
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
  isChild: PropTypes.bool,
  parentInvoiceNumber: PropTypes.string,
};
