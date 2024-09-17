import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function AppNewInvoice({ invoice }) {
  const tableData = invoice?.map((row) => ({
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    category: row.category,
    price: row.amount,
    status: row.status,
    campaign: row.campaign.name,
  }));
  const tableLabels = [
    { id: 'id', label: 'Invoice ID' },
    { id: 'campaign', label: 'Campaign' },
    { id: 'issued', label: 'Issue Date' },
    { id: 'price', label: 'Price' },
    { id: 'status', label: 'Status' },
    { id: '' },
  ];
  return (
    <Card>
      <CardHeader title="History" sx={{ mb: 3 }} />
      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 680 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData?.map((row) => (
                <AppNewInvoiceRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <Divider sx={{ borderStyle: 'dashed' }} />
    </Card>
  );
}

AppNewInvoice.propTypes = {
  invoice: PropTypes.array,
};

// ----------------------------------------------------------------------

function AppNewInvoiceRow({ row }) {
  const popover = usePopover();
  const router = useRouter();

  //   const handleDownload = () => {
  //     popover.onClose();
  //     console.info('DOWNLOAD', row.id);
  //   };

  //   const handlePrint = () => {
  //     popover.onClose();
  //     console.info('PRINT', row.id);
  //   };

  const handleView = () => {
    popover.onClose();
    router.push(paths.dashboard.finance.invoiceDetail(row.id));
  };

  return (
    <>
      <TableRow>
        <TableCell>{row.invoiceNumber}</TableCell>

        <TableCell>{row.campaign}</TableCell>
        <TableCell>{dayjs(row.issued).format('DD MMM YYYY')}</TableCell>

        <TableCell>{fCurrency(row.price)}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'draft' && 'warning') ||
              (row.status === 'overdue' && 'error') ||
              (row.status === 'out of date' && 'error') ||
              'success'
            }
          >
            {row.status === 'draft' ? 'waiting for approval' : row.status}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ pr: 1 }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 160 }}
      >
        {/* <MenuItem onClick={handleDownload}>
          <Iconify icon="eva:cloud-download-fill" />
          Download
        </MenuItem> */}

        {/* <MenuItem onClick={handlePrint}>
          <Iconify icon="solar:printer-minimalistic-bold" />
          Print
        </MenuItem> */}

        <MenuItem onClick={handleView}>
          <Iconify icon="solar:eye-bold" />
          View
        </MenuItem>
      </CustomPopover>
    </>
  );
}

AppNewInvoiceRow.propTypes = {
  row: PropTypes.object,
};
