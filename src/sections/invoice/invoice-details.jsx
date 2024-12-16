import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { fDate } from 'src/utils/format-time';

import { INVOICE_STATUS_OPTIONS } from 'src/_mock';

import Label from 'src/components/label';
import Scrollbar from 'src/components/scrollbar';

import InvoiceToolbar from './invoice-toolbar';

// ----------------------------------------------------------------------

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '& td': {
    textAlign: 'right',
    borderBottom: 'none',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));

// ----------------------------------------------------------------------

export default function InvoiceDetails({ invoice }) {
  const [currentStatus, setCurrentStatus] = useState(invoice?.status);

  const handleChangeStatus = useCallback((event) => {
    setCurrentStatus(event.target.value);
  }, []);

  const renderTotal = (
    <StyledTableRow>
      <TableCell colSpan={3} />
      <TableCell sx={{ typography: 'subtitle1' }}>Total</TableCell>
      <TableCell width={140} sx={{ typography: 'subtitle1' }}>
        {/* {fCurrency(invoice?.task.price)} */}
        {`RM${invoice?.task.price}`}
      </TableCell>
    </StyledTableRow>
  );

  const renderFooter = (
    <Grid container>
      <Grid xs={12} md={9} sx={{ py: 3 }}>
        <Typography variant="subtitle2">NOTES</Typography>

        <Typography variant="body2">
          We appreciate your business. Should you need us to add VAT or extra notes let us know!
        </Typography>
      </Grid>

      <Grid xs={12} md={3} sx={{ py: 3, textAlign: 'right' }}>
        <Typography variant="subtitle2">Have a Question?</Typography>

        <Typography variant="body2">hello@cultcreative.asia</Typography>
      </Grid>
    </Grid>
  );

  const renderList = (
    <TableContainer sx={{ overflow: 'unset', mt: 5 }}>
      <Scrollbar>
        <Table sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>

              <TableCell sx={{ typography: 'subtitle2' }}>Campaign</TableCell>

              <TableCell>Title</TableCell>

              <TableCell align="right">Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow key={invoice?.id}>
              <TableCell>{1}</TableCell>

              <TableCell>
                <Box>
                  <Typography variant="subtitle2">{invoice?.campaign.name}</Typography>
                </Box>
              </TableCell>

              <TableCell>{invoice?.task.title}</TableCell>

              <TableCell align="right">{invoice?.task.description}</TableCell>
              <TableCell align="right">{`RM${invoice?.amount}`}</TableCell>
              <TableCell align="right">{`RM${invoice?.amount}`}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );

  const renderBank = (
    <TableContainer sx={{ overflow: 'unset', mt: 5 }}>
      <Scrollbar>
        <Table sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>

              <TableCell sx={{ typography: 'subtitle2' }}>Recipent Name</TableCell>

              <TableCell>Bank Name</TableCell>

              <TableCell align="right">Account Number</TableCell>
              <TableCell align="right">Recipent Email</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow key={invoice?.id}>
              <TableCell>{1}</TableCell>

              <TableCell>
                <Box sx={{ maxWidth: 560 }}>
                  <Typography variant="subtitle2">{invoice?.bankAcc.payTo}</Typography>
                </Box>
              </TableCell>

              <TableCell>{invoice?.bankAcc.bankName}</TableCell>

              <TableCell align="right">{invoice?.bankAcc.accountNumber}</TableCell>
              <TableCell align="right">{invoice?.bankAcc.accountEmail}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );
  return (
    <>
      <InvoiceToolbar
        invoice={invoice}
        currentStatus={currentStatus || ''}
        onChangeStatus={handleChangeStatus}
        statusOptions={INVOICE_STATUS_OPTIONS}
      />

      <Card sx={{ pt: 5, px: 5 }}>
        <Box
          rowGap={5}
          display="grid"
          alignItems="center"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
          }}
        >
          <Box
            component="img"
            alt="logo"
            src="/logo/cult_logo.png"
            sx={{ width: 100, height: 48 }}
          />

          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Label
              variant="soft"
              color={
                (currentStatus === 'paid' && 'success') ||
                (currentStatus === 'approved' && 'success') ||
                (currentStatus === 'pending' && 'warning') ||
                (currentStatus === 'overdue' && 'error') ||
                (currentStatus === 'draft' && 'default') ||
                'default'
              }
            >
              {currentStatus}
            </Label>

            <Typography variant="h6">{invoice?.invoiceNumber || 'NUll'}</Typography>
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Invoice From
            </Typography>
            {invoice?.invoiceFrom.name}
            <br />
            {invoice?.invoiceFrom.fullAddress}
            <br />
            Phone: {invoice?.invoiceFrom.phoneNumber}
            <br />
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Invoice To
            </Typography>
            {invoice?.invoiceTo.name}
            <br />
            {invoice?.invoiceTo.fullAddress}
            <br />
            Phone: {invoice?.invoiceTo.phoneNumber}
            <br />
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Invoice Date
            </Typography>
            {fDate(invoice?.createdAt)}
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Due Date
            </Typography>
            {fDate(invoice?.dueDate)}
          </Stack>
        </Box>
        {renderBank}

        {renderList}

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} />
        {renderFooter}
      </Card>
    </>
  );
}

InvoiceDetails.propTypes = {
  invoice: PropTypes.object,
};
