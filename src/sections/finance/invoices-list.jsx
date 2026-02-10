import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Table,
  alpha,
  Button,
  Dialog,
  Tooltip,
  Checkbox,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  DialogContent,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetAllInvoiceStats from 'src/hooks/use-get-all-invoice-stats';

import { useGetAllInvoices } from 'src/api/invoices';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TablePaginationCustom,
} from 'src/components/table';

import InvoiceItem from './invoice-item';
import InvoiceTableToolbar from './invoice-table-toolbar';
import InvoiceNewEditForm from '../invoice/invoice-new-edit-form';
import InvoiceTableFiltersResult from './invoice-table-filters-result';
import InvoiceConfirmationDialog from './dialog/invoice-confirmation-dialog';

const defaultFilters = {
  name: '',
  campaignName: '',
  role: [],
  status: 'all',
  currency: '',
};

const TABLE_HEAD = [
  // { id: 'checkbox', label: '', width: 48, hideSortIcon: true },
  { id: 'invoiceNumber', label: 'Invoice ID', width: 180, hideSortIcon: false },
  { id: 'campaignName', label: 'Campaign Name', width: 220, hideSortIcon: true },
  { id: 'creatorName', label: 'Creator Name', width: 180, hideSortIcon: true },
  { id: 'createdAt', label: 'Created At', width: 120, hideSortIcon: true },
  { id: 'amount', label: 'Amount', width: 120, hideSortIcon: true },
  { id: 'status', label: 'Status', width: 120, hideSortIcon: true },
  { id: 'action', label: '', width: 100, hideSortIcon: true },
];

const InvoiceLists = ({ invoices: invoicesProp = [] }) => {
  const [filters, setFilters] = useState(defaultFilters);

  const editDialog = useBoolean();
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState();
  const confirmationDialog = useBoolean();

  const smUp = useResponsive('up', 'sm');
  const table = useTable({ defaultRowsPerPage: 5 }); // Default to 5
  const denseHeight = table.dense ? 56 : 56 + 20;

  // OPTIMIZED: Use paginated endpoint instead of fetching all invoices
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
  });

  // Debug: Log error if API call fails
  if (invoicesError && process.env.NODE_ENV === 'development') {
    console.error('Error fetching invoices:', invoicesError);
  }

  // Use paginated data if available, otherwise fallback to prop
  // Wait for data to load - if invoicesData is undefined, we're still loading
  // Once loaded, invoicesData will be an array (empty or with items)
  const invoices =
    invoicesData !== undefined
      ? invoicesData
      : invoicesProp && invoicesProp.length > 0
        ? invoicesProp
        : [];

  const campaigns = useMemo(() => {
    const data = invoices?.map((invoice) => invoice?.campaign?.name);
    return data.filter((item, index) => data.indexOf(item) === index);
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

  const canReset = !isEqual(defaultFilters, filters);

  // Show "No Data" if:
  // 1. Not loading AND no filtered data AND filters are reset (no active filters)
  // 2. Not loading AND no filtered data (even with filters)
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

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      handleFilters('status', newValue);
    },
    [handleFilters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const changeInvoiceStatus = useCallback((data) => {
    console.log(data);
  }, []);

  // OPTIMIZED: Use invoice stats from backend for accurate counts
  const { stats: invoiceStats, isLoading: statsLoading } = useGetAllInvoiceStats();

  // Create TABS array using backend stats - always use backend stats for accuracy
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

    // Show 0 while loading or if there's an error (prevents showing incorrect counts)
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
      <Card>
        <Box
          sx={{
            mb: 2,
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2.5,
            pt: 2.5,
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

        <InvoiceTableToolbar filters={filters} onFilters={handleFilters} campaigns={campaigns} />

        {canReset && (
          <InvoiceTableFiltersResult
            filters={filters}
            onFilters={handleFilters}
            //
            onResetFilters={handleResetFilters}
            //
            results={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box
          sx={{
            mb: 3,
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
                  <TableRow sx={{ height: 50 }}>
                    {/* Checkbox column */}
                    <TableCell
                      padding="checkbox"
                      sx={{
                        borderRadius: table.selected.length ? '10px 0 0 10px' : '10px 0 0 10px',
                        bgcolor: (theme) =>
                          !table.selected.length
                            ? '#f5f5f5'
                            : alpha(theme.palette.success.light, 0.5),
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Checkbox
                        indeterminate={
                          table.selected.length > 0 && table.selected.length < dataFiltered.length
                        }
                        checked={
                          dataFiltered.length > 0 && table.selected.length === dataFiltered.length
                        }
                        onChange={(event) =>
                          table.onSelectAllRows(
                            event.target.checked,
                            dataFiltered.map((row) => row.id)
                          )
                        }
                      />
                    </TableCell>
                    {/* When rows are selected */}

                    {TABLE_HEAD.map((headCell, index) => (
                      <TableCell
                        key={headCell.id}
                        sx={{
                          py: 1,
                          color: '#221f20',
                          fontWeight: 600,
                          width: headCell.width,
                          bgcolor: (theme) =>
                            !table.selected.length
                              ? '#f5f5f5'
                              : alpha(theme.palette.success.light, 0.5),
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          ...(index === TABLE_HEAD.length - 1 && {
                            borderRadius: '0 10px 10px 0',
                          }),
                        }}
                      >
                        {!table.selected.length
                          ? headCell.label
                          : index === TABLE_HEAD.length - 1 && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyItems: 'center',
                                  gap: 1,
                                  alignItems: 'center',
                                }}
                              >
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={confirmationDialog.onTrue}
                                  >
                                    <Iconify icon="iconamoon:send-fill" width={18} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton size="small" color="success">
                                    <Iconify icon="rivet-icons:ban" width={17} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
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

                      <TableEmptyRows
                        height={denseHeight}
                        emptyRows={emptyRows(
                          table.page,
                          table.rowsPerPage,
                          pagination?.total || dataFiltered.length
                        )}
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
          dense={table.dense}
          onChangeDense={table.onChangeDense}
          sx={{ py: 2, ml: { xs: 0, md: -4 }, px: 2.5 }}
        />
      </Card>

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

      {confirmationDialog.value && (
        <InvoiceConfirmationDialog
          open={confirmationDialog.value}
          onClose={confirmationDialog.onFalse}
          selectedInvoices={table.selected}
        />
      )}
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
  const { name, status, campaignName, currency } = filters;

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
