import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Table,
  Paper,
  Select,
  Button,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableHead,
  TableCell,
  Typography,
  FormControl,
  TableContainer,
  InputAdornment,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const InvoiceHistoryCampaignList = ({ data, onDataUpdate, searchQuery, onSearchChange }) => {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [statusFilter, setStatusFilter] = useState('All');
  const [amountFilter, setAmountFilter] = useState('All');
  const [localData, setLocalData] = useState(data);

  const handleSearch = (e) => {
    onSearchChange(e);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleAmountFilterChange = (e) => {
    setAmountFilter(e.target.value);
  };

  const formatAmount = (amount) => {
    const numericAmount = parseFloat(amount.toString().replace(/[^0-9.-]+/g, ''));
    return `RM${numericAmount.toLocaleString()}`;
  };

  const filteredData = localData?.filter((item) => {
    const matchesQuery =
      item.campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    // Amount filter logic
    const amount = parseFloat(item.amount.toString().replace(/[^0-9.-]+/g, ''));
    const amountMatches =
      amountFilter === 'All' ||
      (amountFilter === 'RM0 - RM1,000' && amount <= 1000) ||
      (amountFilter === 'RM1,001 - RM5,000' && amount > 1000 && amount <= 5000) ||
      (amountFilter === 'RM5,001 - RM10,000' && amount > 5000 && amount <= 10000) ||
      (amountFilter === 'RM10,001 - RM25,000' && amount > 10000 && amount <= 25000) ||
      (amountFilter === 'RM25,001 and above' && amount > 25000);

    return matchesQuery && matchesStatus && amountMatches;
  });

  const handleStatusChangeInTable = (id, newStatus) => {
    const updatedData = localData.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setLocalData(updatedData);
    onDataUpdate(updatedData);
  };

  const handleDownload = (invoice) => {
    console.log(`Downloading PDF for ${invoice}`);
  };

  const handleSendReminder = (invoice) => {
    console.log(`Sending reminder for ${invoice}`);
    enqueueSnackbar(`Reminder sent for ${invoice}`, { variant: 'success' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Iconify icon="eva:search-outline" width={20} />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 2, flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            displayEmpty
            inputProps={{ 'aria-label': 'Filter by status' }}
          >
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Overdue">Overdue</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={amountFilter}
            onChange={handleAmountFilterChange}
            displayEmpty
            inputProps={{ 'aria-label': 'Filter by amount' }}
          >
            <MenuItem value="All">All Amounts</MenuItem>
            <MenuItem value="RM0 - RM1,000">RM0 - RM1,000</MenuItem>
            <MenuItem value="RM1,001 - RM5,000">RM1,001 - RM5,000</MenuItem>
            <MenuItem value="RM5,001 - RM10,000">RM5,001 - RM10,000</MenuItem>
            <MenuItem value="RM10,001 - RM25,000">RM10,001 - RM25,000</MenuItem>
            <MenuItem value="RM25,001 and above">RM25,001 and above</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                <strong>Campaign</strong>
              </TableCell>
              <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                <strong>Creator</strong>
              </TableCell>
              <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                <strong>Invoice ID</strong>
              </TableCell>
              <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                <strong>Date</strong>
              </TableCell>
              <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                <strong>Amount (RM)</strong>
              </TableCell>
              <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                <strong>Status</strong>
              </TableCell>
              <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                <strong>Action</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: 250 }}
                  >
                    {item.campaign.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                  {item.user.name}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                  {item.invoiceNumber}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                  {dayjs(item.date).format('LL')}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                  {formatAmount(item.amount)}
                </TableCell>
                <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={item.status}
                      onChange={(e) => handleStatusChangeInTable(item.id, e.target.value)}
                      sx={{ textAlign: 'center' }}
                    >
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ textAlign: 'center', paddingLeft: '20px' }}>
                  {item.status === 'Overdue' && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<Iconify icon="eva:eye-outline" width={20} />}
                        onClick={() => console.log(`Viewing ${item.invoice}`)}
                        sx={{
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                          borderColor: theme.palette.grey[150],
                          mr: 1,
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{ color: '#fbc02d', borderColor: '#fbc02d' }}
                        startIcon={<Iconify icon="eva:alert-circle-outline" width={20} />}
                        onClick={() => handleSendReminder(item.invoice)}
                      >
                        Notify
                      </Button>
                    </>
                  )}
                  {item.status === 'Pending' && (
                    <>
                      <Button
                        variant="outlined"
                        sx={{
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                          borderColor: theme.palette.grey[150],
                          mr: 1,
                        }}
                        startIcon={<Iconify icon="eva:eye-outline" width={20} />}
                        onClick={() => console.log(`Viewing ${item.invoice}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<Iconify icon="eva:checkmark-outline" width={20} />}
                        onClick={() => handleStatusChangeInTable(item.id, 'Paid')}
                      >
                        Paid
                      </Button>
                    </>
                  )}
                  {item.status !== 'Overdue' && item.status !== 'Pending' && (
                    <>
                      <Button
                        variant="outlined"
                        sx={{
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                          borderColor: theme.palette.grey[150],
                          mr: 1,
                        }}
                        startIcon={<Iconify icon="eva:eye-outline" width={20} />}
                        onClick={() => console.log(`Viewing ${item.invoice}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<Iconify icon="eva:download-outline" width={20} />}
                        onClick={() => handleDownload(item.invoice)}
                      >
                        PDF
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

InvoiceHistoryCampaignList.propTypes = {
  data: PropTypes.array.isRequired,
  onDataUpdate: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
};

export default InvoiceHistoryCampaignList;
