import sumBy from 'lodash/sumBy';
import PropTypes from 'prop-types';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { formatCurrencyAmount } from 'src/utils/currency';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { fDate, fTime, isAfter, isBetween } from 'src/utils/format-time';

import { _invoices } from 'src/_mock';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import NewInvoiceModal from '../new-invoice-modal';
import InvoiceTableFiltersResult from '../invoice-table-filters-result';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'invoiceNumber', label: 'Creator' },
  { id: 'createDate', label: 'Invoice Date' },
  { id: 'dueDate', label: 'Due Date' },
  { id: 'price', label: 'Amount' },
  { id: 'status', label: 'Status' },
  { id: '' },
];

const defaultFilters = {
  name: '',
  service: [],
  status: 'all',
  startDate: null,
  endDate: null,
  campaignName: '',
  currency: '',
};

// ----------------------------------------------------------------------

export default function InvoiceListView({ campId, invoices }) {
  const { enqueueSnackbar } = useSnackbar();

  const { user } = useAuthContext();

  const [openNewInvoiceModal, setOpenNewInvoiceModal] = useState(false);

  const { data } = useGetAgreements(campId);

  const router = useRouter();

  const table = useTable({ defaultOrderBy: 'createDate' });

  const confirm = useBoolean();

  const [tableData, setTableData] = useState(invoices?.campaigns ? invoices.campaigns : _invoices);

  const [filters, setFilters] = useState(defaultFilters);

  const dateError = isAfter(filters.startDate, filters.endDate);

  const [sortDirection, setSortDirection] = useState('asc');
  const [alphabetical, setAlphabetical] = useState(false);

  // Filtering only
  const filteredData = useMemo(
    () =>
      applyFilter({
        inputData: tableData || undefined,
        comparator: getComparator(table.order, table.orderBy),
        filters,
        dateError,
      }),
    [tableData, table, filters, dateError]
  );

  // Sorting (alphabetical or default)
  const dataFiltered = useMemo(() => {
    if (alphabetical) {
      return [...filteredData].sort((a, b) => {
        const nameA = ((a.creator.user.name ?? a.invoiceFrom?.name) || '').toLowerCase();
        const nameB = ((b.creator.user.name ?? b.invoiceFrom?.name) || '').toLowerCase();
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }
    return filteredData;
  }, [filteredData, alphabetical, sortDirection]);

  const dataInPage = dataFiltered?.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset =
    !!filters.name ||
    !!filters.service.length ||
    filters.status !== 'all' ||
    (!!filters.startDate && !!filters.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const getInvoiceLength = (status) => tableData.filter((item) => item.status === status).length;

  const getTotalAmount = (status) =>
    sumBy(
      tableData.filter((item) => item.status === status),
      'totalAmount'
    );

  const getPercentByStatus = (status) => (getInvoiceLength(status) / tableData.length) * 100;

  const TABS = [
    { value: 'all', label: 'All', color: 'default', count: tableData.length },
    {
      value: 'paid',
      label: 'Paid',
      color: 'success',
      count: getInvoiceLength('paid'),
    },
    {
      value: 'approved',
      label: 'Approved',
      color: 'success',
      count: getInvoiceLength('approved'),
    },
    {
      value: 'pending',
      label: 'Pending',
      color: 'warning',
      count: getInvoiceLength('pending'),
    },
    {
      value: 'overdue',
      label: 'Overdue',
      color: 'error',
      count: getInvoiceLength('overdue'),
    },
    {
      value: 'draft',
      label: 'Draft',
      color: 'default',
      count: getInvoiceLength('draft'),
    },
  ];

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleDeleteRow = useCallback(
    async (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      try {
        const res = await axiosInstance.delete(endpoints.invoice.delete(id));
        enqueueSnackbar(res?.data?.message);

        setTableData(deleteRow);
      } catch (err) {
        enqueueSnackbar(err?.message, {
          variant: 'error',
        });
      } finally {
        table.onUpdatePageDeleteRow(dataInPage.length);
      }
    },
    [dataInPage.length, enqueueSnackbar, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const removed = await Promise.all(
        table.selected.map((id) => axiosInstance.delete(endpoints.invoice.delete(id)))
      );

      enqueueSnackbar(`Successfully deleted ${removed.length} items`);

      const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

      setTableData(deleteRows);
    } catch (err) {
      enqueueSnackbar(err?.message, {
        variant: 'error',
      });
    } finally {
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered?.length,
      });
    }
  }, [dataFiltered?.length, dataInPage.length, enqueueSnackbar, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.finance.createInvoice(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.finance.invoiceDetail(id));
    },
    [router]
  );

  const handleOpenNewInvoiceModal = () => {
    setOpenNewInvoiceModal(true);
  };

  const handleCloseNewInvoiceModal = () => {
    setOpenNewInvoiceModal(false);
  };

  const handleCreateInvoice = async (formData) => {
    try {
      // Format the services for the deliverables field
      const deliverables = formData.service
        .map((service) => {
          // If service is 'Other', use the otherService value
          if (service === 'Other' && formData.otherService) {
            return formData.otherService;
          }
          return service;
        })
        .join(', ');

      // Get the selected creator from the data passed from the modal
      console.log('Creator ID:', formData.creatorId);
      console.log('Creator Data:', formData.creatorData);
      console.log('Agreement Data:', formData.agreementData);

      // Use the complete creator data passed from the modal
      let selectedCreator = formData.agreementData;

      if (!selectedCreator && formData.creatorId && Array.isArray(data)) {
        selectedCreator = data.find(
          (agreement) =>
            agreement?.user?.id === formData.creatorId ||
            agreement?.userId === formData.creatorId ||
            agreement?.creatorId === formData.creatorId
        );
      }

      console.log('Selected Creator:', selectedCreator);

      // Debug payment form data
      console.log('User Object:', selectedCreator?.user);
      console.log('Creator Object:', selectedCreator?.user?.creator);
      console.log(
        'Payment Form:',
        selectedCreator?.user?.paymentForm || selectedCreator?.user?.creator?.paymentForm
      );

      // Get the creator details from the data passed from the modal
      const {creatorDetails} = formData;
      console.log('Creator Details:', creatorDetails);

      // Get the payment form from the creator details or other locations
      const paymentForm =
        creatorDetails?.creator?.paymentForm ||
        selectedCreator?.user?.paymentForm ||
        selectedCreator?.user?.creator?.paymentForm ||
        selectedCreator?.creator?.paymentForm ||
        selectedCreator?.paymentForm ||
        {};

      console.log('Payment Form Found:', paymentForm);
      console.log('Bank Name:', paymentForm.bankName);
      console.log('Bank Account Name:', paymentForm.bankAccountName);
      console.log('Bank Account Number:', paymentForm.bankAccountNumber);

      // Currency symbol mapping
      const currencySymbols = {
        MYR: 'RM',
        SGD: 'S$',
        USD: '$',
        AUD: 'A$',
        JPY: '¥',
        IDR: 'Rp',
      };

      // Get the currency symbol based on selected currency
      const currencySymbol = currencySymbols[formData.currency] || '';

      // Prepare invoice data to match the backend's expected structure
      const invoiceData = {
        invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`, // Will be regenerated by the backend
        createDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'draft',
        campaignId: campId,

        // Creator information
        invoiceFrom: {
          id: formData.creatorId,
          name: formData.creator,
          email: selectedCreator?.user?.email || '',
          phoneNumber: selectedCreator?.user?.phoneNumber || '',
          fullAddress: selectedCreator?.user?.creator?.fullAddress || '',
          company: selectedCreator?.user?.creator?.employment || '',
          addressType: 'Home',
          primary: false,
        },

        // Company information
        invoiceTo: {
          id: '1',
          name: 'Cult Creative Sdn. Bhd.',
          fullAddress:
            '5-3A, Block A, Jaya One, No.72A, Jalan Universiti, 46200 Petaling Jaya, Selangor',
          phoneNumber: '(+60)12-849 6499',
          company: 'Cult Creative',
          addressType: 'Hq',
          email: 'support@cultcreative.asia',
          primary: true,
        },

        // Invoice items
        items: [
          {
            title: 'Service',
            description: formData.otherService || deliverables, // Use otherService if available
            service: deliverables,
            quantity: 1,
            price: parseFloat(formData.amount) || 0,
            total: parseFloat(formData.amount) || 0,
            currency: formData.currency, // Add currency to the item
            currencySymbol, // Add currency symbol to the item
          },
        ],

        // Bank information
        bankInfo: {
          // Use the payment form we found
          bankName: paymentForm.bankName || '',
          accountName: paymentForm.bankAccountName || formData.creator,
          payTo: formData.creator,
          accountNumber: paymentForm.bankAccountNumber || '',

          // Email from the creator data
          accountEmail:
            creatorDetails?.email ||
            selectedCreator?.user?.email ||
            selectedCreator?.email ||
            formData.creatorData?.email ||
            '',

          // Add these fields to match what's expected in the invoice PDF
          recipientName: formData.creator,
          recipientEmail:
            creatorDetails?.email ||
            selectedCreator?.user?.email ||
            selectedCreator?.email ||
            formData.creatorData?.email ||
            '',
        },

        subTotal: parseFloat(formData.amount) || 0,
        totalAmount: parseFloat(formData.amount) || 0,
        currency: formData.currency, // Add currency to the invoice
        currencySymbol, // Add currency symbol to the invoice
      };

      // Log the bank information specifically
      console.log('Bank Information:', invoiceData.bankInfo);

      console.log('Creating invoice with data:', invoiceData);

      // Make API call to create the invoice
      const response = await axiosInstance.post(endpoints.invoice.create, invoiceData);

      // Show success message
      enqueueSnackbar('Invoice created successfully', { variant: 'success' });

      // Add the new invoice to the table data
      if (response.data) {
        setTableData((prevData) => [response.data, ...prevData]);
      }

      // Close the modal
      handleCloseNewInvoiceModal();

      return response.data;
    } catch (err) {
      console.error('Error creating invoice:', err);
      enqueueSnackbar('Failed to create invoice', { variant: 'error' });
      return null;
    }
  };

  const smUp = useResponsive('up', 'sm');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  console.log('creatorAgreement Data: ', data);

  const getCreatorAgreementCurrency = useCallback(
    (row) => {
      if (!data || !Array.isArray(data)) return 'MYR';

      const creatorAgreement = data.find(
        (agreement) =>
          agreement?.user?.id === row?.invoiceFrom?.id || agreement?.userId === row?.invoiceFrom?.id
      );

      return (
        creatorAgreement?.user?.shortlisted?.[0]?.currency || creatorAgreement?.currency || 'MYR'
      );
    },
    [data]
  );

  const handleToggleSort = () => {
    setAlphabetical(true);
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <>
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          width: '100%',
          pl: 0,
          pr: 0,
        }}
      >
        <Box
          sx={{
            mb: 2,
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 0.5,
              flexGrow: 1,
              mr: 1,
            }}
          >
            {TABS.map((tab) => (
              <Button
                key={tab.value}
                fullWidth={!smUp}
                onClick={() => handleFilters('status', tab.value)}
                sx={{
                  px: 1.25,
                  py: 1.5,
                  height: '38px',
                  minWidth: 'auto',
                  border: '1px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  borderRadius: 1,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  ...(filters.status === tab.value
                    ? {
                        color: '#203ff5',
                        bgcolor: 'rgba(32, 63, 245, 0.04)',
                      }
                    : {
                        color: '#637381',
                        bgcolor: 'transparent',
                      }),
                  '&:hover': {
                    bgcolor:
                      filters.status === tab.value ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                  },
                }}
              >
                {`${tab.label} (${tab.count})`}
              </Button>
            ))}
            <Button
              onClick={handleToggleSort}
              endIcon={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {sortDirection === 'asc' ? (
                    <Stack direction="column" alignItems="center" spacing={0}>
                      <Typography
                        variant="caption"
                        sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                      >
                        A
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                      >
                        Z
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack direction="column" alignItems="center" spacing={0}>
                      <Typography
                        variant="caption"
                        sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                      >
                        Z
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                      >
                        A
                      </Typography>
                    </Stack>
                  )}
                  <Iconify
                    icon={
                      sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'
                    }
                    width={12}
                  />
                </Stack>
              }
              sx={{
                px: 1.25,
                py: 0.75,
                height: '38px',
                minWidth: 'auto',
                color: '#637381',
                fontWeight: 600,
                fontSize: '0.8rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 1,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(32, 63, 245, 0.04)',
                  color: '#221f20',
                },
              }}
            >
              Alphabetical
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleOpenNewInvoiceModal}
              sx={{
                width: { xs: 'auto', sm: '130px' },
                height: 38,
                py: '8px',
                px: '12px',
                gap: '4px',
                borderRadius: '8px',
                bgcolor: '#1340FF',
                boxShadow: '0px -3px 0px 0px #00000073 inset',
                '&:hover': {
                  bgcolor: '#0035DF',
                },
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
              }}
            >
              New Invoice
            </Button>
            <TextField
              placeholder="Search customer or invoice number"
              value={filters.name}
              onChange={(e) => handleFilters('name', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                sx: {
                  height: '38px',
                  '& input': {
                    py: 0,
                    height: '100%',
                    fontSize: '0.85rem',
                  },
                },
              }}
              sx={{
                width: { xs: '100%', sm: '220px' },
                '& .MuiOutlinedInput-root': {
                  height: '38px',
                  border: '1px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        </Box>

        {canReset && (
          <InvoiceTableFiltersResult
            filters={filters}
            onFilters={handleFilters}
            onResetFilters={handleResetFilters}
            results={dataFiltered?.length}
            sx={{ mb: 2, ml: 0 }}
          />
        )}

        <Box
          sx={{
            mb: 3,
            ml: 0,
            mr: 0,
            mt: 1,
          }}
        >
          <Scrollbar>
            <TableContainer
              sx={{
                width: '100%',
                minWidth: 1000,
                position: 'relative',
                bgcolor: 'transparent',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Table
                sx={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <TableSelectedAction
                  dense={table.dense}
                  numSelected={table.selected.length}
                  rowCount={dataFiltered?.length}
                  onSelectAllRows={(checked) => {
                    table.onSelectAllRows(
                      checked,
                      dataFiltered?.map((row) => row.id)
                    );
                  }}
                  action={
                    <Stack direction="row">
                      <Tooltip title="Download">
                        <IconButton color="primary">
                          <Iconify icon="eva:download-outline" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Print">
                        <IconButton color="primary">
                          <Iconify icon="solar:printer-minimalistic-bold" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton color="primary" onClick={confirm.onTrue} disabled={isDisabled}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                />

                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 300,
                        borderRadius: '10px 0 0 10px',
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Creator
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 120,
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Invoice Date
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 120,
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Due Date
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 100,
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 100,
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 240,
                        borderRadius: '0 10px 10px 0',
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {dataFiltered
                    ?.slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => {
                      const selected = table.selected.includes(row.id);
                      return (
                        <TableRow
                          key={row.id}
                          hover
                          selected={selected}
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
                          <TableCell sx={{ width: 300, display: 'flex', alignItems: 'center' }}>
                            <Avatar alt={row.invoiceFrom?.name} sx={{ mr: 2 }}>
                              {row.creator?.user?.name?.charAt(0).toUpperCase() ??
                                row.invoiceFrom?.name?.charAt(0).toUpperCase()}
                            </Avatar>

                            <ListItemText
                              disableTypography
                              primary={
                                <Typography variant="body2" noWrap sx={{ mt: 1 }}>
                                  {row.creator?.user?.name ?? row.invoiceFrom?.name}
                                </Typography>
                              }
                              secondary={
                                <Link
                                  noWrap
                                  variant="body2"
                                  onClick={() => handleViewRow(row.id)}
                                  sx={{ color: 'text.disabled', cursor: 'pointer', mt: 0.5 }}
                                >
                                  {row.invoiceNumber}
                                </Link>
                              }
                            />
                          </TableCell>

                          <TableCell sx={{ width: 120 }}>
                            <ListItemText
                              primary={fDate(row.createdAt)}
                              secondary={fTime(row.createdAt)}
                              primaryTypographyProps={{ typography: 'body2', noWrap: true }}
                              secondaryTypographyProps={{
                                mt: 0.5,
                                component: 'span',
                                typography: 'caption',
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ width: 120 }}>
                            <ListItemText
                              primary={fDate(row.dueDate)}
                              secondary={fTime(row.dueDate)}
                              primaryTypographyProps={{ typography: 'body2', noWrap: true }}
                              secondaryTypographyProps={{
                                mt: 0.5,
                                component: 'span',
                                typography: 'caption',
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ width: 100 }}>
                            {formatCurrencyAmount(
                              row.amount,
                              row.currency,
                              row.task?.currencySymbol || row.currencySymbol
                            )}
                          </TableCell>

                          <TableCell sx={{ width: 100 }}>
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
                                ...(row.status === 'paid' && {
                                  color: '#2e6b55',
                                  borderColor: '#2e6b55',
                                }),
                                ...(row.status === 'approved' && {
                                  color: '#1ABF66',
                                  borderColor: '#1ABF66',
                                }),
                                ...(row.status === 'pending' && {
                                  color: '#f19f39',
                                  borderColor: '#f19f39',
                                }),
                                ...(row.status === 'overdue' && {
                                  color: '#ff4842',
                                  borderColor: '#ff4842',
                                }),
                                ...(row.status === 'draft' && {
                                  color: '#637381',
                                  borderColor: '#637381',
                                }),
                              }}
                            >
                              {row.status || 'pending'}
                            </Typography>
                          </TableCell>

                          <TableCell
                            sx={{
                              width: 240,
                              py: 2,
                              px: 2,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              verticalAlign: 'middle',
                              height: '100%',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              {/* View Button */}
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
                                onClick={() => handleViewRow(row.id)}
                              >
                                View
                              </Button>

                              {/* Edit Button */}
                              <Button
                                startIcon={<Iconify icon="solar:pen-bold" width={16} />}
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
                                onClick={() => handleEditRow(row.id)}
                              >
                                Edit
                              </Button>

                              {/* Delete Button */}
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
                                  color: '#ff4842',
                                  minWidth: '65px',
                                  height: '32px',
                                }}
                                onClick={() => {
                                  confirm.onTrue();
                                  table.onSelectRow(row.id);
                                }}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData
                    notFound={notFound}
                    sx={{
                      ml: { xs: 0, md: -4 },
                      '& .MuiTableCell-root': {
                        p: 0,
                        height: 300,
                      },
                    }}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          count={dataFiltered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
          sx={{ py: 2, ml: { xs: 0, md: -4 } }}
        />
      </Container>

      <NewInvoiceModal
        open={openNewInvoiceModal}
        onClose={handleCloseNewInvoiceModal}
        onSubmit={handleCreateInvoice}
        campId={campId}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={isDisabled}
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

InvoiceListView.propTypes = {
  campId: PropTypes.string,
  invoices: PropTypes.object,
};

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, status, service, startDate, endDate, currency } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData?.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        invoice.invoiceFrom?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((invoice) => invoice.status === status);
  }

  // Filter by currency
  if (currency) {
    inputData = inputData.filter((invoice) => {
      // Check for currency in different possible locations
      const invoiceCurrency =
        invoice.currency || invoice.task?.currency || (invoice.items && invoice.items[0]?.currency);
      return invoiceCurrency === currency;
    });
  }

  if (service.length) {
    inputData = inputData.filter((invoice) =>
      invoice.items.some((filterItem) => service.includes(filterItem.service))
    );
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((invoice) => isBetween(invoice.createDate, startDate, endDate));
    }
  }

  return inputData;
}
