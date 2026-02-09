import dayjs from 'dayjs';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Table,
  Button,
  Dialog,
  Checkbox,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TableSortLabel,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetAllInvoiceStats from 'src/hooks/use-get-all-invoice-stats';

import { useGetAllInvoices } from 'src/api/invoices';
import { formatCurrencyAmount } from 'src/utils/currency';

import Scrollbar from 'src/components/scrollbar';
import useDateRangePicker from 'src/components/custom-date-range-picker/use-date-range-picker';
import CustomDateRangePicker from 'src/components/custom-date-range-picker/custom-date-range-picker';
import { useTable, TableNoData, TablePaginationCustom } from 'src/components/table';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { LoadingButton } from '@mui/lab';
import axiosInstance, { endpoints } from 'src/utils/axios';

import InvoiceItem from './invoice-item';
import InvoiceTableToolbar from './invoice-table-toolbar';
import InvoiceNewEditForm from '../invoice/invoice-new-edit-form';
import InvoiceTableFiltersResult from './invoice-table-filters-result';

export const STATUS_COLORS = {
  paid: '#1340FF',
  approved: '#1ABF66',
  pending: '#f19f39',
  pending_approval: '#f19f39',
  pending_payment: '#f19f39',
  overdue: '#ff4842',
  draft: '#637381',
  rejected: '#ff4842',
};

const defaultFilters = {
  name: '',
  campaignName: '',
  campaigns: [],
  role: [],
  status: 'all',
  currency: '',
};

const TABLE_HEAD = [
  { id: 'checkbox', label: '', width: 48, hideSortIcon: true },
  { id: 'invoiceNumber', label: 'Invoice ID', width: 150, hideSortIcon: false },
  { id: 'campaignName', label: 'Campaign Name', width: 220, hideSortIcon: true },
  { id: 'creatorName', label: 'Recepient', width: 180, hideSortIcon: true },
  { id: 'createdAt', label: 'Invoice Date', width: 120, hideSortIcon: true },
  { id: 'dueDate', label: 'Due Date', width: 120, hideSortIcon: false },
  { id: 'amount', label: 'Amount', width: 120, hideSortIcon: true },
  { id: 'status', label: 'Status', width: 120, hideSortIcon: true },
];

const InvoiceLists = ({ invoices: invoicesProp = [] }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState(defaultFilters);
  const [datePresetLabel, setDatePresetLabel] = useState(null);

  const editDialog = useBoolean();
  const exportPreview = useBoolean();
  const xeroDialog = useBoolean();
  const xeroLoading = useBoolean();

  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState();
  const [bulkLoading, setBulkLoading] = useState(false);

  const smUp = useResponsive('up', 'sm');
  const table = useTable({ defaultRowsPerPage: 25 });

  const dateRange = useDateRangePicker(null, null);

  // Expose presetLabel on dateRange for the toolbar
  const dateRangeWithPreset = useMemo(
    () => ({ ...dateRange, presetLabel: datePresetLabel }),
    [dateRange, datePresetLabel]
  );

  const handleDatePreset = useCallback(
    (preset) => {
      const today = dayjs();
      table.onResetPage();

      if (preset === 'week') {
        dateRange.onChangeStartDate(today.startOf('week').toDate());
        dateRange.onChangeEndDate(today.endOf('week').toDate());
        setDatePresetLabel('This Week');
      } else if (preset === 'month') {
        dateRange.onChangeStartDate(today.startOf('month').toDate());
        dateRange.onChangeEndDate(today.endOf('month').toDate());
        setDatePresetLabel('This Month');
      } else if (preset === 'clear') {
        dateRange.onReset();
        setDatePresetLabel(null);
      }
    },
    [dateRange, table]
  );

  const {
    data: invoicesData,
    pagination,
    isLoading: invoicesLoading,
    error: invoicesError,
    mutate: mutateInvoices,
  } = useGetAllInvoices({
    page: table.page + 1,
    limit: table.rowsPerPage,
    status: filters.status !== 'all' ? filters.status : undefined,
    currency: filters.currency || undefined,
    search: filters.name || undefined,
    campaignName: filters.campaignName || undefined,
    startDate: dateRange.startDate ? dayjs(dateRange.startDate).toISOString() : undefined,
    endDate: dateRange.endDate ? dayjs(dateRange.endDate).toISOString() : undefined,
  });

  if (invoicesError && process.env.NODE_ENV === 'development') {
    console.error('Error fetching invoices:', invoicesError);
  }

  const invoices = useMemo(() => {
    if (invoicesData !== undefined) {
      return invoicesData;
    }
    if (invoicesProp && invoicesProp.length > 0) {
      return invoicesProp;
    }
    return [];
  }, [invoicesData, invoicesProp]);

  const campaignOptions = useMemo(() => {
    const names = invoices?.map((inv) => inv?.campaign?.name).filter(Boolean);
    return [...new Set(names)].sort();
  }, [invoices]);

  const dataFiltered = useMemo(() => {
    if (!invoices?.length) return [];
    return applyFilter({
      inputData: invoices,
      comparator: getComparator(table.order, table.orderBy),
      filters: {
        ...filters,
        status: 'all',
        currency: '',
        name: '',
      },
    });
  }, [invoices, table.order, table.orderBy, filters]);

  const exportSummary = useMemo(() => {
    if (!dataFiltered?.length) return { count: 0, totals: [] };
    const grouped = {};
    dataFiltered.forEach((inv) => {
      const code = inv?.currency || 'MYR';
      const symbol = inv?.task?.currencySymbol || inv?.currencySymbol;
      if (!grouped[code]) grouped[code] = { currencyCode: code, currencySymbol: symbol, total: 0 };
      grouped[code].total += inv?.amount || 0;
    });
    return { count: dataFiltered.length, totals: Object.values(grouped) };
  }, [dataFiltered]);

  const canReset = !isEqual(defaultFilters, filters) || dateRange.selected;

  const notFound = !invoicesLoading && !dataFiltered?.length;

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

  const handleFilterCampaigns = useCallback(
    (value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        campaigns: value,
      }));
    },
    [table]
  );

  const handleRemoveCampaign = useCallback(
    (campaignName) => {
      const newCampaigns = filters.campaigns.filter((c) => c !== campaignName);
      handleFilterCampaigns(newCampaigns);
    },
    [filters.campaigns, handleFilterCampaigns]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
    dateRange.onReset();
    setDatePresetLabel(null);
  }, [dateRange]);

  // When custom date range dialog closes, clear preset label since it's a custom selection
  const handleDateRangeClose = useCallback(() => {
    dateRange.onClose();
    if (dateRange.startDate && dateRange.endDate) {
      setDatePresetLabel(null);
    }
  }, [dateRange]);

  const handleExportCSV = useCallback(() => {
    if (!dataFiltered?.length) return;

    const headers = [
      'Invoice ID',
      'Campaign Name',
      'Creator Name',
      'Invoice Date',
      'Due Date',
      'Amount',
      'Currency',
      'Status',
    ];

    const rows = dataFiltered.map((invoice) => [
      invoice?.invoiceNumber || '',
      invoice?.campaign?.name || '',
      invoice?.creator?.user?.name || '',
      invoice?.createdAt ? dayjs(invoice.createdAt).format('DD/MM/YYYY') : '',
      invoice?.dueDate ? dayjs(invoice.dueDate).format('DD/MM/YYYY') : '',
      invoice?.amount ?? '',
      invoice?.currency || 'MYR',
      invoice?.status || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell);
            // Escape cells containing commas, quotes, or newlines
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [dataFiltered]);

  const handleOpenExportPreview = useCallback(() => {
    if (!dataFiltered?.length) return;
    exportPreview.onTrue();
  }, [dataFiltered, exportPreview]);

  const handleConfirmExport = useCallback(() => {
    handleExportCSV();
    exportPreview.onFalse();
  }, [handleExportCSV, exportPreview]);

  const changeInvoiceStatus = useCallback(() => {}, []);

  const { stats: invoiceStats, isLoading: statsLoading } = useGetAllInvoiceStats();

  const TABS = useMemo(() => {
    // Check if stats are loaded and have counts
    if (invoiceStats && invoiceStats.counts) {
      const { counts } = invoiceStats;
      return [
        { value: 'all', label: 'All', count: counts.total ?? 0 },
        { value: 'paid', label: 'Paid', count: counts.paid ?? 0 },
        { value: 'approved', label: 'Approved', count: counts.approved ?? 0 },
        { value: 'pending', label: 'Pending', count: counts.pending ?? 0 },
        { value: 'overdue', label: 'Overdue', count: counts.overdue ?? 0 },
        { value: 'draft', label: 'Draft', count: counts.draft ?? 0 },
        { value: 'rejected', label: 'Rejected', count: counts.rejected ?? 0 },
      ];
    }

    return [
      { value: 'all', label: 'All', count: 0 },
      { value: 'paid', label: 'Paid', count: 0 },
      { value: 'approved', label: 'Approved', count: 0 },
      { value: 'pending', label: 'Pending', count: 0 },
      { value: 'overdue', label: 'Overdue', count: 0 },
      { value: 'draft', label: 'Draft', count: 0 },
      { value: 'rejected', label: 'Rejected', count: 0 },
    ];
  }, [invoiceStats]);

  const openEditInvoice = useCallback(
    (id, data) => {
      setSelectedId(id);
      setSelectedData(data);
      editDialog.onTrue();
    },
    [editDialog]
  );

  const closeEditInvoice = useCallback(() => {
    setSelectedId('');
    setSelectedData();
    editDialog.onFalse();
  }, [editDialog]);

  const handleActivateXero = useCallback(async () => {
    try {
      xeroLoading.onTrue();
      const response = await axiosInstance.get(endpoints.invoice.xero, { withCredientials: true });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      enqueueSnackbar('Failed to initiate Xero connection', { variant: 'error' });
      xeroLoading.onFalse();
    }
  }, [xeroLoading, enqueueSnackbar]);

  const handleBulkUpdate = async () => {
    setBulkLoading(true);

    try {
      const selectedInvoices = dataFiltered.filter((row) => table.selected.includes(row.id));

      const actionableIds = selectedInvoices
        .filter((invoice) => invoice.status === 'pending' || invoice.status === 'draft')
        .map((invoice) => invoice.id);

      if (actionableIds.length === 0) {
        enqueueSnackbar('No Pending or Draft invoices selected.', { variant: 'info' });
        setBulkLoading(false);
        return;
      }

      const res = await axiosInstance.post(endpoints.invoice.bulkUpdateInvoices, {
        invoiceIds: actionableIds,
      });

      if (res.status === 200) {
        enqueueSnackbar(res.data.message, { variant: 'success' });
        if (mutateInvoices) mutateInvoices();
        table.onSelectAllRows(false, []);
      }
    } catch (error) {
      console.error(error);

      const errorMessage = error?.message || error?.error || '';

      if (
        errorMessage.toLowerCase().includes('xero') ||
        errorMessage.toLowerCase().includes('connect')
      ) {
        xeroDialog.onTrue();
      } else {
        enqueueSnackbar(errorMessage || 'Failed to approve invoices', { variant: 'error' });
      }
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2.5,
          pt: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
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
                  bgcolor: filters.status === tab.value ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`${tab.label} (${tab.count})`}
            </Button>
          ))}
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={handleBulkUpdate}
          disabled={bulkLoading || table.selected.length === 0}
          startIcon={
            bulkLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Iconify icon="eva:checkmark-circle-2-fill" />
            )
          }
          sx={{
            width: 'fit-content',
            height: 40,
            padding: { xs: '4px 8px', sm: '6px 10px' },
            borderRadius: '8px',
            boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
            backgroundColor: '#1340FF',
            color: '#FFFFFF',
            fontSize: { xs: 12, md: 14 },
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#133effd3',
              boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
            },
            '&:active': {
              boxShadow: '0px 0px 0px 0px #0c2aa6 inset',
              transform: 'translateY(1px)',
            },
          }}
        >
          Approve & Send ({table.selected.length})
        </Button>
      </Box>

      <InvoiceTableToolbar
        filters={filters}
        onFilters={handleFilters}
        campaignOptions={campaignOptions}
        selectedCampaigns={filters.campaigns}
        onFilterCampaigns={handleFilterCampaigns}
        dateRange={dateRangeWithPreset}
        onDatePreset={handleDatePreset}
        onExportCSV={handleOpenExportPreview}
      />

      {canReset && (
        <InvoiceTableFiltersResult
          filters={filters}
          onFilters={handleFilters}
          onResetFilters={handleResetFilters}
          results={dataFiltered.length}
          dateRange={dateRangeWithPreset}
          onRemoveCampaign={handleRemoveCampaign}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}

      <Box
        sx={{
          ml: 0,
          mr: 0,
          mt: 1,
          px: 2.5,
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
              <TableHead>
                <TableRow>
                  {TABLE_HEAD.map((headCell, index) => {
                    const isSorted = table.orderBy === headCell.id;
                    const reversedOrder = table.order === 'asc' ? 'desc' : 'asc';
                    return (
                      <TableCell
                        key={headCell.id}
                        padding={headCell.id === 'checkbox' ? 'checkbox' : 'normal'}
                        sortDirection={isSorted ? reversedOrder : false}
                        sx={{
                          py: 1,
                          color: '#221f20',
                          fontWeight: 600,
                          width: headCell.width,
                          ...(index === 0 && {
                            borderRadius: '10px 0 0 10px',
                          }),
                          ...(index === TABLE_HEAD.length - 1 && {
                            borderRadius: '0 10px 10px 0',
                          }),
                          bgcolor: '#f5f5f5',
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {headCell.id === 'checkbox' && (
                          <Checkbox
                            indeterminate={
                              table.selected.length > 0 &&
                              table.selected.length < dataFiltered.length
                            }
                            checked={
                              dataFiltered.length > 0 &&
                              table.selected.length === dataFiltered.length
                            }
                            onChange={(event) =>
                              table.onSelectAllRows(
                                event.target.checked,
                                dataFiltered.map((row) => row.id)
                              )
                            }
                          />
                        )}
                        {headCell.id === 'dueDate' ? (
                          <TableSortLabel
                            active
                            direction={isSorted ? reversedOrder : 'desc'}
                            onClick={() => table.onSort('dueDate')}
                            sx={{
                              color: 'inherit !important',
                              '& .MuiTableSortLabel-icon': {
                                opacity: 1,
                                color:
                                  table.orderBy === 'dueDate'
                                    ? '#1340ff !important'
                                    : '#c4cdd5 !important',
                              },
                            }}
                          >
                            {headCell.label}
                          </TableSortLabel>
                        ) : (
                          headCell.label
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>

              <TableBody>
                {invoicesLoading ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {dataFiltered?.map((invoice) => (
                      <InvoiceItem
                        key={invoice.id}
                        invoice={invoice}
                        onChangeStatus={changeInvoiceStatus}
                        selected={table.selected.includes(invoice.id)}
                        onSelectRow={() => table.onSelectRow(invoice.id)}
                        openEditInvoice={() => openEditInvoice(invoice.id)}
                      />
                    ))}

                    <TableNoData
                      notFound={notFound}
                      sx={{
                        '& .MuiTableCell-root': {
                          p: 0,
                          height: 300,
                        },
                      }}
                    />
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Box>

      <TablePaginationCustom
        count={pagination?.total || dataFiltered.length}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        sx={{ py: 2, px: 2.5 }}
      />

      <CustomDateRangePicker
        title="Select Date Range"
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onChangeStartDate={(val) => dateRange.onChangeStartDate(val ? dayjs(val).toDate() : null)}
        onChangeEndDate={(val) => dateRange.onChangeEndDate(val ? dayjs(val).toDate() : null)}
        open={dateRange.open}
        onClose={handleDateRangeClose}
        error={dateRange.error}
      />

      <Dialog
        open={editDialog.value}
        onClose={closeEditInvoice}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 1,
          },
        }}
      >
        <DialogContent sx={{ p: 2, overflow: 'hidden' }}>
          <InvoiceNewEditForm id={selectedId} creators={selectedData} />
        </DialogContent>
      </Dialog>

      {/* Export Preview Dialog */}
      <Dialog
        open={exportPreview.value}
        onClose={exportPreview.onFalse}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 1.5 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Export Preview</DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {/* Summary bar */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: '#f4f6f8',
              borderRadius: 1,
              px: 2,
              py: 1.25,
              mb: 2,
              mt: 1,
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {exportSummary.count} invoice{exportSummary.count !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {exportSummary.totals
                .map((t) => formatCurrencyAmount(t.total, t.currencyCode, t.currencySymbol))
                .join(' \u00B7 ')}
            </Typography>
          </Box>

          {/* Mini-table */}
          <TableContainer
            sx={{ maxHeight: 340, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Invoice ID', 'Campaign', 'Creator', 'Amount', 'Status'].map((label) => (
                    <TableCell
                      key={label}
                      sx={{
                        py: 1,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: '#f5f5f5',
                        color: '#221f20',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dataFiltered?.map((inv) => (
                  <TableRow key={inv.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 0.75, fontSize: '0.8rem' }}>
                      {inv?.invoiceNumber || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.8rem', maxWidth: 200 }}>
                      <Typography variant="inherit" noWrap>
                        {inv?.campaign?.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.8rem' }}>
                      {inv?.creator?.user?.name || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 0.75, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatCurrencyAmount(
                        inv?.amount,
                        inv?.currency || 'MYR',
                        inv?.task?.currencySymbol || inv?.currencySymbol
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <Typography
                        sx={{
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          display: 'inline-block',
                          px: 1,
                          py: 0.25,
                          fontSize: '0.65rem',
                          border: '1px solid',
                          borderBottom: '2px solid',
                          borderRadius: 0.6,
                          bgcolor: 'white',
                          color: STATUS_COLORS[inv?.status] || '#637381',
                          borderColor: STATUS_COLORS[inv?.status] || '#637381',
                        }}
                      >
                        {inv?.status || 'pending'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={exportPreview.onFalse}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmExport}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#203ff5',
              '&:hover': { bgcolor: '#1a33c4' },
            }}
          >
            Export CSV
          </Button>
        </DialogActions>
      </Dialog>

      {/* connect to xero */}
      <Dialog open={xeroDialog.value} onClose={xeroDialog.onFalse}>
        <DialogTitle>Connect to Xero</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You need to be connected to Xero to approve these invoices. Please connect your account
            to proceed.
          </DialogContentText>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <LoadingButton
              variant="contained"
              size="large"
              loading={xeroLoading.value}
              onClick={handleActivateXero}
              startIcon={<Iconify icon="logos:xero" width={24} />}
              sx={{ bgcolor: '#13B5EA', '&:hover': { bgcolor: '#0e9bc7' } }} // Xero Blue
            >
              Connect to Xero
            </LoadingButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={xeroDialog.onFalse} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceLists;

InvoiceLists.propTypes = {
  invoices: PropTypes.array,
};

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function descendingComparator(a, b, orderBy) {
  if (orderBy === 'invoiceNumber') {
    const aNum = a[orderBy];
    const bNum = b[orderBy];

    if (aNum < bNum) return -1;
    if (aNum > bNum) return 1;
    return 0;
  }

  const aValue = a[orderBy];
  const bValue = b[orderBy];
  if (aValue < bValue) return -1;
  if (aValue > bValue) return 1;
  return 0;
}

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, campaignName, currency, campaigns } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis?.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) =>
        item?.creator?.user?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.campaign?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.invoiceNumber?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (campaignName) {
    inputData = inputData.filter(
      (item) => item?.campaign?.name?.toLowerCase().indexOf(campaignName.toLowerCase()) !== -1
    );
  }

  if (campaigns?.length) {
    inputData = inputData.filter((item) => campaigns.includes(item?.campaign?.name));
  }

  if (status !== 'all') {
    inputData = inputData.filter((item) => item.status === status);
  }

  // Filter by currency
  if (currency) {
    inputData = inputData.filter((item) => {
      // Check for currency in different possible locations
      const invoiceCurrency =
        item.currency || item.task?.currency || (item.items && item.items[0]?.currency);
      return invoiceCurrency === currency;
    });
  }

  return inputData;
}
