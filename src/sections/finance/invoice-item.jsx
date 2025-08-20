import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Box, Button, TableRow, Checkbox, TableCell, Typography } from '@mui/material';

import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { formatCurrencyAmount } from 'src/utils/currency';

import Label from 'src/components/label';

const InvoiceItem = ({ invoice, selected, onSelectRow, openEditInvoice }) => {
  // Currency mapping
  const CURRENCY_PREFIXES = {
    SGD: '$',
    MYR: 'RM',
    AUD: '$',
    JPY: '¥',
    IDR: 'Rp',
    USD: '$',
  };

  // Fetch creator agreement for the campaign
  const campaignId = invoice?.campaign?.id;
  const { data: agreements } = useGetAgreements(campaignId);

  // Get the currency for this specific invoice
  const invoiceCurrency = useMemo(() => {
    if (!agreements?.length || !invoice?.creator?.user?.id) return 'MYR';

    const creatorId = invoice.creator.user.id;
    const agreement = agreements.find((ag) => ag.user?.id === creatorId);

    return agreement?.user?.shortlisted?.[0]?.currency || agreement?.currency || 'MYR';
  }, [agreements, invoice?.creator?.user?.id]);

  const formatAmount = (amount) => {
    const numericAmount = parseFloat(amount.toString().replace(/[^0-9.-]+/g, ''));
    const currencyPrefix = CURRENCY_PREFIXES[invoiceCurrency] || 'RM';
    return `${currencyPrefix}${numericAmount.toLocaleString()}`;
  };

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
};

export default InvoiceItem;

InvoiceItem.propTypes = {
  invoice: PropTypes.object,
  selected: PropTypes.string,
  onSelectRow: PropTypes.func,
  openEditInvoice: PropTypes.func,
};
