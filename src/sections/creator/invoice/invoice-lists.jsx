import dayjs from 'dayjs';
import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Table,
  Stack,
  styled,
  Button,
  Avatar,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  ListItemText,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatCurrencyAmount } from 'src/utils/currency';

import NewLabel from 'src/components/styleLabel/styleLabel';

const StyledTableCell = styled(TableCell)(() => ({
  fontWeight: 600,
  color: 'black',
}));

const InvoiceLists = ({ invoices }) => {
  const router = useRouter();

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell
                sx={{
                  borderRadius: '10px 0 0 10px',
                }}
              >
                Invoice ID
              </StyledTableCell>
              <StyledTableCell>Campaign</StyledTableCell>
              <StyledTableCell>Issue Date</StyledTableCell>
              <StyledTableCell>Price</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell
                sx={{
                  borderRadius: '0 10px 10px 0',
                }}
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices?.map((invoice) => (
              <TableRow
                key={invoice.id}
                sx={{
                  height: 80,
                }}
              >
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={invoice.campaign.company?.logo ?? invoice.campaign.brand?.logo} />
                    <ListItemText
                      primary={invoice.campaign.name}
                      secondary={invoice.campaign.company?.name ?? invoice.campaign.brand?.name}
                    />
                  </Stack>
                </TableCell>
                <TableCell>{dayjs(invoice.issued).format('LL')}</TableCell>
                <TableCell>
                  {formatCurrencyAmount(invoice.amount, invoice.campaign?.creatorAgreement?.[0]?.currency || 'MYR')}
                </TableCell>
                <TableCell>
                  <NewLabel
                    variant="soft"
                    color={
                      (invoice.status === 'draft' && 'warning') ||
                      (invoice.status === 'overdue' && 'error') ||
                      (invoice.status === 'out of date' && 'error') ||
                      'success'
                    }
                  >
                    {invoice.status === 'draft' ? 'waiting for approval' : invoice.status}
                  </NewLabel>
                </TableCell>
                <TableCell align="right" sx={{ pr: 1 }}>
                  <Button
                    variant="outlined"
                    sx={{
                      boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                    }}
                    onClick={() => router.push(paths.dashboard.creator.invoiceDetail(invoice.id))}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InvoiceLists;

InvoiceLists.propTypes = {
  invoices: PropTypes.array,
};
