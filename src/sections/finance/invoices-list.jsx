import dayjs from 'dayjs';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Table,
  Button,
  Dialog,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  TableSortLabel,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetAllInvoiceStats from 'src/hooks/use-get-all-invoice-stats';

import { useGetAllInvoices } from 'src/api/invoices';
import { formatCurrencyAmount } from 'src/utils/currency';

import Scrollbar from 'src/components/scrollbar';
import useDateRangePicker from 'src/components/custom-date-range-picker/use-date-range-picker';
import CustomDateRangePicker from 'src/components/custom-date-range-picker/custom-date-range-picker';
import {
  useTable,
  TableNoData,
  TablePaginationCustom,
} from 'src/components/table';

import InvoiceItem from './invoice-item';
import InvoiceTableToolbar from './invoice-table-toolbar';
import InvoiceNewEditForm from '../invoice/invoice-new-edit-form';
import InvoiceTableFiltersResult from './invoice-table-filters-result';

export const STATUS_COLORS = {
  paid: '#2e6b55',
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
  { id: 'invoiceNumber', label: 'Invoice ID', width: 180, hideSortIcon: false },
  { id: 'campaignName', label: 'Campaign Name', width: 220, hideSortIcon: true },
  { id: 'creatorName', label: 'Creator Name', width: 180, hideSortIcon: true },
  { id: 'createdAt', label: 'Invoice Date', width: 120, hideSortIcon: true },
  { id: 'dueDate', label: 'Due Date', width: 120, hideSortIcon: false },
  { id: 'amount', label: 'Amount', width: 120, hideSortIcon: true },
  { id: 'status', label: 'Status', width: 120, hideSortIcon: true },
  { id: 'action', label: '', width: 100, hideSortIcon: true },
];

const InvoiceLists = ({ invoices: invoicesProp = [] }) => {
  const [filters, setFilters] = useState(defaultFilters);
  const [datePresetLabel, setDatePresetLabel] = useState(null);

  const editDialog = useBoolean();
  const exportPreview = useBoolean();
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState();

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
    page: table.page + 1, // API uses 1-based pagination
    limit: table.rowsPerPage,
    status: filters.status !== 'all' ? filters.status : undefined,
    currency: filters.currency || undefined,
    search: filters.name || undefined,
    campaignName: filters.campaignName || undefined,
    startDate: dateRange.startDate ? dayjs(dateRange.startDate).toISOString() : undefined,
    endDate: dateRange.endDate ? dayjs(dateRange.endDate).toISOString() : undefined,
  });

  // Debug: Log error if API call fails
  if (invoicesError && process.env.NODE_ENV === 'development') {
    console.error('Error fetching invoices:', invoicesError);
  }

  // Use paginated data if available, otherwise fallback to prop
  // Wait for data to load - if invoicesData is undefined, we're still loading
  // Once loaded, invoicesData will be an array (empty or with items)
  const invoices = useMemo(() => {
    if (invoicesData !== undefined) return invoicesData;
    if (invoicesProp && invoicesProp.length > 0) return invoicesProp;
    return [];
  }, [invoicesData, invoicesProp]);

  const campaignOptions = useMemo(() => {
    const names = invoices?.map((inv) => inv?.campaign?.name).filter(Boolean);
    return [...new Set(names)].sort();
  }, [invoices]);

  // OPTIMIZED: Client-side filtering only for display (server already filtered)
  const dataFiltered = useMemo(() => {
    if (!invoices?.length) return [];
    return applyFilter({
      inputData: invoices,
      comparator: getComparator(table.order, table.orderBy),
      filters: {
        ...filters,
        // Don't re-filter status/currency/search as they're already filtered server-side
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

  // Show "No Data" if:
  // 1. Not loading AND no filtered data AND filters are reset (no active filters)
  // 2. Not loading AND no filtered data (even with filters)
  const notFound = (!invoicesLoading && !dataFiltered?.length);

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

    const headers = ['Invoice ID', 'Campaign Name', 'Creator Name', 'Invoice Date', 'Due Date', 'Amount', 'Currency', 'Status'];

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
        row.map((cell) => {
          const str = String(cell);
          // Escape cells containing commas, quotes, or newlines
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
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

  // Create TABS array using backend stats - always use backend stats for accuracy
  const TABS = useMemo(() => {

    // Check if stats are loaded and have counts
    if (invoiceStats && invoiceStats.counts) {
      const {counts} = invoiceStats;
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

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
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
        </Box>
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
                  {TABLE_HEAD.map((headCell, index) => (
                    <TableCell
                      key={headCell.id}
                      padding="normal"
                      sortDirection={table.orderBy === headCell.id ? table.order : false}
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
                      {headCell.id === 'dueDate' ? (
                        <TableSortLabel
                          active
                          direction={table.orderBy === 'dueDate' ? table.order : 'asc'}
                          onClick={() => table.onSort('dueDate')}
                          sx={{
                            color: 'inherit !important',
                            '& .MuiTableSortLabel-icon': {
                              opacity: 1,
                              color: table.orderBy === 'dueDate' ? '#1340ff !important' : '#c4cdd5 !important',
                            },
                          }}
                        >
                          {headCell.label}
                        </TableSortLabel>
                      ) : (
                        headCell.label
                      )}
                    </TableCell>
                  ))}
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
          <TableContainer sx={{ maxHeight: 340, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
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
    inputData = inputData.filter((item) =>
      campaigns.includes(item?.campaign?.name)
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((item) => item.status === status);
  }

  // Filter by currency
  if (currency) {
    inputData = inputData.filter((item) => {
      // Check for currency in different possible locations
      const invoiceCurrency = item.currency ||
                            item.task?.currency ||
                            (item.items && item.items[0]?.currency);
      return invoiceCurrency === currency;
    });
  }

  return inputData;
}
