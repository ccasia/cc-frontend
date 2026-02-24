import dayjs from 'dayjs';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useRef, useMemo, useState, useCallback } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import {
  Box,
  Menu,
  Table,
  Button,
  Dialog,
  Checkbox,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
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
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';
import { useTable, TableNoData, TablePaginationCustom } from 'src/components/table';
import { enqueueSnackbar, useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { LoadingButton } from '@mui/lab';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { getBankCode, getPaymentMode } from 'src/contants/bank-codes';

import InvoiceItem from './invoice-item';
import InvoiceTableToolbar from './invoice-table-toolbar';
import InvoiceNewEditForm from '../invoice/invoice-new-edit-form';
import InvoiceTableFiltersResult from './invoice-table-filters-result';

import { STATUS_COLORS } from './invoice-constants';

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
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportData, setExportData] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSelected, setExportSelected] = useState(new Set());
  const [exportStatuses, setExportStatuses] = useState([]);
  const [addStatusAnchor, setAddStatusAnchor] = useState(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportFormatAnchor, setExportFormatAnchor] = useState(null);

  const xeroLoading = useBoolean();
  const xeroDialog = useBoolean();

  const smUp = useResponsive('up', 'sm');
  const { mainRef } = useMainContext();
  const savedScrollPos = useRef(0);
  const table = useTable({ defaultRowsPerPage: 25 });

  const dateRange = useDateRangePicker(null, null);

  // Expose presetLabel on dateRange for the toolbar
  const dateRangeWithPreset = useMemo(
    () => ({ ...dateRange, presetLabel: datePresetLabel }),
    [dateRange, datePresetLabel]
  );

  const handleDateApply = useCallback(
    (start, end, presetLabel) => {
      table.onResetPage();
      dateRange.onChangeStartDate(start);
      dateRange.onChangeEndDate(end);
      setDatePresetLabel(presetLabel || null);
    },
    [dateRange, table]
  );

  const handleDateClear = useCallback(() => {
    table.onResetPage();
    dateRange.onReset();
    setDatePresetLabel(null);
  }, [dateRange, table]);

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

  const campaignImages = useMemo(() => {
    const map = {};
    invoices?.forEach((inv) => {
      const name = inv?.campaign?.name;
      if (name && !map[name]) {
        map[name] = inv?.campaign?.campaignBrief?.images?.[0] || inv?.campaign?.brand?.logo || '';
      }
    });
    return map;
  }, [invoices]);

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
    const allData = exportData?.length ? exportData : dataFiltered;
    if (!allData?.length) return { count: 0, totalCount: 0, totals: [] };
    const selected = allData.filter((inv) => exportSelected.has(inv.id));
    const grouped = {};
    selected.forEach((inv) => {
      const code = inv?.currency || 'MYR';
      const symbol = inv?.task?.currencySymbol || inv?.currencySymbol;
      if (!grouped[code]) grouped[code] = { currencyCode: code, currencySymbol: symbol, total: 0 };
      grouped[code].total += inv?.amount || 0;
    });
    return { count: selected.length, totalCount: allData.length, totals: Object.values(grouped) };
  }, [exportData, dataFiltered, exportSelected]);

  const statusCounts = useMemo(() => {
    const source = exportData?.length ? exportData : dataFiltered;
    const counts = {};
    source?.forEach((inv) => {
      const s = inv?.status || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [exportData, dataFiltered]);

  const canReset = !isEqual(defaultFilters, filters) || dateRange.selected;

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

  const handleExportCSV = useCallback(async () => {
    const source = (exportData?.length ? exportData : dataFiltered).filter((inv) =>
      exportSelected.has(inv.id)
    );
    if (!source?.length) return;

    // Alliance Bank BizSmart Bulk Payment format (59 columns)
    const headers = [
      'Payment Mode',
      'Beneficiary Name',
      'Beneficiary Account',
      'Beneficiary Bank Code',
      'Amount',
      'Payment Description',
      'Payment Reference',
      'Beneficiary New IC No',
      'Beneficiary Old IC No',
      'Beneficiary Business Registration',
      'Beneficiary Others',
      'Payment Advice Indicator',
      'Mobile Phone No',
      'Beneficiary Email 1',
      'Beneficiary Email 2',
      'Generic Payment Information',
      'Invoice Date 1',
      'Invoice Amount 1',
      'Payment Amount 1',
      'Payment Description 1',
      'Invoice Date 2',
      'Invoice Amount 2',
      'Payment Amount 2',
      'Payment Description 2',
      'Invoice Date 3',
      'Invoice Amount 3',
      'Payment Amount 3',
      'Payment Description 3',
      'Invoice Date 4',
      'Invoice Amount 4',
      'Payment Amount 4',
      'Payment Description 4',
      'Invoice Date 5',
      'Invoice Amount 5',
      'Payment Amount 5',
      'Payment Description 5',
      'Invoice Date 6',
      'Invoice Amount 6',
      'Payment Amount 6',
      'Payment Description 6',
      'Invoice Date 7',
      'Invoice Amount 7',
      'Payment Amount 7',
      'Payment Description 7',
      'Invoice Date 8',
      'Invoice Amount 8',
      'Payment Amount 8',
      'Payment Description 8',
      'Invoice Date 9',
      'Invoice Amount 9',
      'Payment Amount 9',
      'Payment Description 9',
      'Invoice Date 10',
      'Invoice Amount 10',
      'Payment Amount 10',
      'Payment Description 10',
      'Batch Reference No.',
      'Payment Date',
      'Beneficiary Address',
    ];

    const rows = source.map((invoice) => {
      const paymentForm = invoice?.creator?.user?.paymentForm;
      const bankName = paymentForm?.bankName || '';
      const bankCode = getBankCode(bankName);
      const paymentMode = getPaymentMode(bankCode);
      const beneficiaryName = paymentForm?.bankAccountName || invoice?.creator?.user?.name || '';
      const beneficiaryAccount = paymentForm?.bankAccountNumber || '';
      const amount = invoice?.amount != null ? Number(invoice.amount).toFixed(2) : '0.00';
      const description =
        invoice?.task?.service || invoice?.task?.description || 'Content Creation';
      const campaignName = invoice?.campaign?.name || '';
      const paymentRef = campaignName.replace(/\s/g, '').substring(0, 20);
      const phone = invoice?.creator?.user?.phoneNumber || '';
      const email = invoice?.creator?.user?.email || '';

      return [
        paymentMode,
        beneficiaryName,
        beneficiaryAccount,
        bankCode,
        amount,
        description,
        paymentRef,
        paymentForm?.icNumber || '', // Beneficiary New IC No
        '', // Beneficiary Old IC No
        '', // Beneficiary Business Registration
        '', // Beneficiary Others
        'E', // Payment Advice Indicator
        phone,
        email,
        '', // Beneficiary Email 2
        'Email For Notification', // Generic Payment Information
        '',
        '',
        '',
        '', // Invoice Date 1, Invoice Amount 1, Payment Amount 1, Payment Description 1
        '',
        '',
        '',
        '', // Invoice Date 2, Invoice Amount 2, Payment Amount 2, Payment Description 2
        '',
        '',
        '',
        '', // Invoice Date 3, Invoice Amount 3, Payment Amount 3, Payment Description 3
        '',
        '',
        '',
        '', // Invoice Date 4, Invoice Amount 4, Payment Amount 4, Payment Description 4
        '',
        '',
        '',
        '', // Invoice Date 5, Invoice Amount 5, Payment Amount 5, Payment Description 5
        '',
        '',
        '',
        '', // Invoice Date 6, Invoice Amount 6, Payment Amount 6, Payment Description 6
        '',
        '',
        '',
        '', // Invoice Date 7, Invoice Amount 7, Payment Amount 7, Payment Description 7
        '',
        '',
        '',
        '', // Invoice Date 8, Invoice Amount 8, Payment Amount 8, Payment Description 8
        '',
        '',
        '',
        '', // Invoice Date 9, Invoice Amount 9, Payment Amount 9, Payment Description 9
        '',
        '',
        '',
        '', // Invoice Date 10, Invoice Amount 10, Payment Amount 10, Payment Description 10
        '', // Batch Reference No.
        '', // Payment Date
        '', // Beneficiary Address
      ];
    });

    const workbook = new ExcelJS.Workbook();
    const sheetName = `BP_${dayjs().format('DDMMMYYYY')}`;
    const worksheet = workbook.addWorksheet(sheetName);

    const redHeaders = new Set([
      'Payment Mode',
      'Beneficiary Name',
      'Beneficiary Account',
      'Beneficiary Bank Code',
      'Amount',
      'Payment Description',
      'Generic Payment Information',
      'Beneficiary Address',
    ]);

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
      };
      cell.font = {
        bold: true,
        color: redHeaders.has(String(cell.value)) ? { argb: 'FFFF0000' } : undefined,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    rows.forEach((row) => worksheet.addRow(row));

    // Auto-fit column widths based on header and data content
    worksheet.columns.forEach((column, i) => {
      const headerLen = String(headers[i] || '').length;
      let maxLen = headerLen;
      rows.forEach((row) => {
        const cellLen = String(row[i] || '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      column.width = Math.min(maxLen + 2, 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `BP_${dayjs().format('DDMMMYYYY')}.xlsx`);
  }, [exportData, dataFiltered, exportSelected]);

  const handleExportPlainCSV = useCallback(async () => {
    const source = (exportData?.length ? exportData : dataFiltered).filter((inv) =>
      exportSelected.has(inv.id)
    );
    if (!source?.length) return;

    const headers = [
      'Payment Mode',
      'Beneficiary Name',
      'Beneficiary Account',
      'Beneficiary Bank Code',
      'Amount',
      'Payment Description',
      'Payment Reference',
      'Beneficiary New IC No',
      'Beneficiary Old IC No',
      'Beneficiary Business Registration',
      'Beneficiary Others',
      'Payment Advice Indicator',
      'Mobile Phone No',
      'Beneficiary Email 1',
      'Beneficiary Email 2',
      'Generic Payment Information',
      'Invoice Date 1',
      'Invoice Amount 1',
      'Payment Amount 1',
      'Payment Description 1',
      'Invoice Date 2',
      'Invoice Amount 2',
      'Payment Amount 2',
      'Payment Description 2',
      'Invoice Date 3',
      'Invoice Amount 3',
      'Payment Amount 3',
      'Payment Description 3',
      'Invoice Date 4',
      'Invoice Amount 4',
      'Payment Amount 4',
      'Payment Description 4',
      'Invoice Date 5',
      'Invoice Amount 5',
      'Payment Amount 5',
      'Payment Description 5',
      'Invoice Date 6',
      'Invoice Amount 6',
      'Payment Amount 6',
      'Payment Description 6',
      'Invoice Date 7',
      'Invoice Amount 7',
      'Payment Amount 7',
      'Payment Description 7',
      'Invoice Date 8',
      'Invoice Amount 8',
      'Payment Amount 8',
      'Payment Description 8',
      'Invoice Date 9',
      'Invoice Amount 9',
      'Payment Amount 9',
      'Payment Description 9',
      'Invoice Date 10',
      'Invoice Amount 10',
      'Payment Amount 10',
      'Payment Description 10',
      'Batch Reference No.',
      'Payment Date',
      'Beneficiary Address',
    ];

    const escapeCSV = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = source.map((invoice) => {
      const paymentForm = invoice?.creator?.user?.paymentForm;
      const bankName = paymentForm?.bankName || '';
      const bankCode = getBankCode(bankName);
      const paymentMode = getPaymentMode(bankCode);
      const beneficiaryName = paymentForm?.bankAccountName || invoice?.creator?.user?.name || '';
      const beneficiaryAccount = paymentForm?.bankAccountNumber || '';
      const amount = invoice?.amount != null ? Number(invoice.amount).toFixed(2) : '0.00';
      const description =
        invoice?.task?.service || invoice?.task?.description || 'Content Creation';
      const campaignName = invoice?.campaign?.name || '';
      const paymentRef = campaignName.replace(/\s/g, '').substring(0, 20);
      const phone = invoice?.creator?.user?.phoneNumber || '';
      const email = invoice?.creator?.user?.email || '';

      return [
        paymentMode,
        beneficiaryName,
        beneficiaryAccount,
        bankCode,
        amount,
        description,
        paymentRef,
        paymentForm?.icNumber || '',
        '',
        '',
        '',
        'E',
        phone,
        email,
        '',
        'Email For Notification',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `BP_${dayjs().format('DDMMMYYYY')}.csv`);
  }, [exportData, dataFiltered, exportSelected]);

  const handleOpenExportPreview = useCallback(async () => {
    if (!dataFiltered?.length) return;
    setExportLoading(true);
    exportPreview.onTrue();
    const currentStatus = filters.status !== 'all' ? filters.status : 'all';
    setExportStatuses(currentStatus === 'all' ? ['all'] : [currentStatus]);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '10000');
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.currency) queryParams.append('currency', filters.currency);
      if (filters.name) queryParams.append('search', filters.name);
      if (filters.campaignName) queryParams.append('campaignName', filters.campaignName);
      if (dateRange.startDate)
        queryParams.append('startDate', dayjs(dateRange.startDate).toISOString());
      if (dateRange.endDate) queryParams.append('endDate', dayjs(dateRange.endDate).toISOString());
      const res = await axiosInstance.get(`${endpoints.invoice.getAll}?${queryParams.toString()}`);
      let data = res.data?.data || [];
      // Apply client-side filters the API doesn't support
      if (filters.campaigns?.length) {
        data = data.filter((inv) => filters.campaigns.includes(inv?.campaign?.name));
      }
      setExportData(data);
      setExportSelected(new Set(data.map((inv) => inv.id)));
    } catch (err) {
      console.error('Failed to fetch all invoices for export:', err);
      enqueueSnackbar('Failed to load all invoices for export', { variant: 'error' });
      setExportData(dataFiltered);
      setExportSelected(new Set(dataFiltered.map((inv) => inv.id)));
    } finally {
      setExportLoading(false);
    }
  }, [dataFiltered, exportPreview, filters, dateRange]);

  const handleConfirmExport = useCallback(
    async (format = 'xlsx') => {
      setExportingCSV(true);
      try {
        if (format === 'csv') {
          await handleExportPlainCSV();
        } else {
          await handleExportCSV();
        }
      } catch (err) {
        console.error(`Failed to generate ${format.toUpperCase()} export:`, err);
        enqueueSnackbar(`Failed to generate ${format.toUpperCase()} export`, { variant: 'error' });
      } finally {
        setExportingCSV(false);
        exportPreview.onFalse();
        setExportData([]);
        setExportSelected(new Set());
        setExportStatuses([]);
      }
    },
    [handleExportCSV, handleExportPlainCSV, exportPreview]
  );

  const handleAddStatus = useCallback(
    async (statusValue) => {
      setAddStatusAnchor(null);
      setExportLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', '10000');
        queryParams.append('status', statusValue);
        if (filters.currency) queryParams.append('currency', filters.currency);
        if (filters.name) queryParams.append('search', filters.name);
        if (filters.campaignName) queryParams.append('campaignName', filters.campaignName);
        if (dateRange.startDate)
          queryParams.append('startDate', dayjs(dateRange.startDate).toISOString());
        if (dateRange.endDate)
          queryParams.append('endDate', dayjs(dateRange.endDate).toISOString());
        const res = await axiosInstance.get(
          `${endpoints.invoice.getAll}?${queryParams.toString()}`
        );
        let newData = res.data?.data || [];
        // Apply client-side filters the API doesn't support
        if (filters.campaigns?.length) {
          newData = newData.filter((inv) => filters.campaigns.includes(inv?.campaign?.name));
        }
        setExportData((prev) => {
          const existingIds = new Set(prev.map((inv) => inv.id));
          const unique = newData.filter((inv) => !existingIds.has(inv.id));
          return [...prev, ...unique];
        });
        setExportSelected((prev) => {
          const next = new Set(prev);
          newData.forEach((inv) => next.add(inv.id));
          return next;
        });
        setExportStatuses((prev) => [...prev, statusValue]);
      } catch (err) {
        console.error('Failed to fetch invoices for status:', statusValue, err);
        enqueueSnackbar(`Failed to load ${statusValue} invoices`, { variant: 'error' });
      } finally {
        setExportLoading(false);
      }
    },
    [filters, dateRange]
  );

  const handleExportSelectAll = useCallback(
    (checked) => {
      const allData = exportData?.length ? exportData : dataFiltered;
      if (checked) {
        setExportSelected(new Set(allData.map((inv) => inv.id)));
      } else {
        setExportSelected(new Set());
      }
    },
    [exportData, dataFiltered]
  );

  const handleExportSelectRow = useCallback((id) => {
    setExportSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleRemoveStatus = useCallback((statusToRemove) => {
    setExportData((prev) => {
      const filtered = prev.filter((inv) => inv?.status !== statusToRemove);
      setExportSelected((prevSel) => {
        const removedIds = new Set(
          prev.filter((inv) => inv?.status === statusToRemove).map((inv) => inv.id)
        );
        const next = new Set(prevSel);
        removedIds.forEach((id) => next.delete(id));
        return next;
      });
      return filtered;
    });
    setExportStatuses((prev) => prev.filter((s) => s !== statusToRemove));
  }, []);

  const changeInvoiceStatus = useCallback(() => {}, []);

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
      if (mainRef?.current) {
        savedScrollPos.current = mainRef.current.scrollTop;
      }
      setSelectedId(id);
      setSelectedData(data);
      editDialog.onTrue();
    },
    [editDialog, mainRef]
  );

  const closeEditInvoice = useCallback(() => {
    setSelectedId('');
    setSelectedData();
    editDialog.onFalse();
  }, [editDialog]);

  const handleDialogExited = useCallback(() => {
    if (mainRef?.current) {
      mainRef.current.scrollTop = savedScrollPos.current;
    }
  }, [mainRef]);

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
  }, [xeroLoading]);

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
                  bgcolor: filters.status === tab.value ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
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
        onDateApply={handleDateApply}
        onDateClear={handleDateClear}
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
          campaignImages={campaignImages}
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

      <Dialog
        open={editDialog.value}
        onClose={closeEditInvoice}
        fullWidth
        maxWidth="lg"
        disableRestoreFocus
        TransitionProps={{ onExited: handleDialogExited }}
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
        maxWidth="xl"
        PaperProps={{ sx: { borderRadius: 1.5, height: '90vh' } }}
      >
        <DialogTitle
          sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <img
              src="/logo/Alliance_Bank_Malaysia_logo.png"
              alt="Alliance Bank"
              style={{ height: 24 }}
            />
            Bulk Payment Export
          </Box>
          <IconButton onClick={exportPreview.onFalse} size="small">
            <Iconify icon="mingcute:close-line" width={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Preview table — shows key columns from the 59-column XLSX export */}
          <TableContainer
            sx={{
              flex: 1,
              mt: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              pb: 0.75,
              '&::-webkit-scrollbar': { height: 6, width: 6 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#c4cdd5',
                borderRadius: 3,
              },
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    padding="checkbox"
                    sx={{
                      py: 1,
                      bgcolor: '#f5f5f5',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Checkbox
                      indeterminate={
                        exportSelected.size > 0 &&
                        exportSelected.size < (exportData?.length || dataFiltered?.length || 0)
                      }
                      checked={
                        (exportData?.length || dataFiltered?.length || 0) > 0 &&
                        exportSelected.size === (exportData?.length || dataFiltered?.length || 0)
                      }
                      onChange={(e) => handleExportSelectAll(e.target.checked)}
                      size="small"
                    />
                  </TableCell>
                  {[
                    'Payment Mode',
                    'Beneficiary Name',
                    'Beneficiary Account',
                    'Beneficiary Bank Code',
                    'Amount',
                    'Payment Description',
                    'Payment Reference',
                    'Beneficiary New IC No',
                    'Beneficiary Old IC No',
                    'Beneficiary Business Registration',
                    'Beneficiary Others',
                    'Payment Advice Indicator',
                    'Mobile Phone No',
                    'Beneficiary Email 1',
                    'Batch Reference No.',
                    'Payment Date',
                    'Beneficiary Address',
                  ].map((label) => (
                    <TableCell
                      key={label}
                      sx={{
                        py: 1,
                        fontSize: '0.85rem',
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
                {exportLoading ? (
                  <TableRow>
                    <TableCell colSpan={18} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : (
                  (exportData?.length ? exportData : dataFiltered)?.map((inv) => {
                    const paymentForm = inv?.creator?.user?.paymentForm;
                    const bankName = paymentForm?.bankName || '';
                    const bankCode = getBankCode(bankName);
                    const paymentMode = getPaymentMode(bankCode);
                    const beneficiaryName =
                      paymentForm?.bankAccountName || inv?.creator?.user?.name || '';
                    const campaignName = inv?.campaign?.name || '';
                    const paymentRef = campaignName.replace(/\s/g, '').substring(0, 20);

                    const cellSx = { py: 0.75, fontSize: '0.875rem', whiteSpace: 'nowrap' };

                    return (
                      <TableRow
                        key={inv.id}
                        sx={{
                          '&:last-child td': { borderBottom: 0 },
                          opacity: exportSelected.has(inv.id) ? 1 : 0.45,
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ py: 0.75 }}>
                          <Checkbox
                            checked={exportSelected.has(inv.id)}
                            onChange={() => handleExportSelectRow(inv.id)}
                            size="small"
                            sx={{
                              color: STATUS_COLORS[inv?.status] || '#637381',
                              '&.Mui-checked': {
                                color: STATUS_COLORS[inv?.status] || '#637381',
                              },
                            }}
                          />
                        </TableCell>
                        {/* 1. Payment Mode */}
                        <TableCell sx={cellSx}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              display: 'inline-block',
                              px: 1,
                              py: 0.25,
                              fontSize: '0.75rem',
                              border: '1px solid',
                              borderBottom: '2px solid',
                              borderRadius: 0.6,
                              bgcolor: 'white',
                              color: paymentMode ? '#1340FF' : '#637381',
                              borderColor: paymentMode ? '#1340FF' : '#637381',
                            }}
                          >
                            {paymentMode || 'N/A'}
                          </Typography>
                        </TableCell>
                        {/* 2. Beneficiary Name */}
                        <TableCell sx={{ ...cellSx, maxWidth: 200 }}>
                          <Typography variant="inherit" noWrap>
                            {beneficiaryName || '-'}
                          </Typography>
                        </TableCell>
                        {/* 3. Beneficiary Account */}
                        <TableCell sx={cellSx}>{paymentForm?.bankAccountNumber || '-'}</TableCell>
                        {/* 4. Beneficiary Bank Code */}
                        <TableCell sx={cellSx}>{bankCode || '-'}</TableCell>
                        {/* 5. Amount */}
                        <TableCell sx={cellSx}>
                          {formatCurrencyAmount(
                            inv?.amount,
                            inv?.currency || 'MYR',
                            inv?.task?.currencySymbol || inv?.currencySymbol
                          )}
                        </TableCell>
                        {/* 6. Payment Description */}
                        <TableCell sx={{ ...cellSx, maxWidth: 180 }}>
                          <Typography variant="inherit" noWrap>
                            {inv?.task?.service || inv?.task?.description || 'Content Creation'}
                          </Typography>
                        </TableCell>
                        {/* 7. Payment Reference */}
                        <TableCell sx={{ ...cellSx, maxWidth: 160 }}>
                          <Typography variant="inherit" noWrap>
                            {paymentRef || '-'}
                          </Typography>
                        </TableCell>
                        {/* 8. Beneficiary New IC No */}
                        <TableCell sx={cellSx}>{paymentForm?.icNumber || '-'}</TableCell>
                        {/* 9. Beneficiary Old IC No */}
                        <TableCell sx={cellSx}>-</TableCell>
                        {/* 10. Beneficiary Business Registration */}
                        <TableCell sx={cellSx}>-</TableCell>
                        {/* 11. Beneficiary Others */}
                        <TableCell sx={cellSx}>-</TableCell>
                        {/* 12. Payment Advice Indicator */}
                        <TableCell sx={cellSx}>E</TableCell>
                        {/* 13. Mobile Phone No */}
                        <TableCell sx={cellSx}>{inv?.creator?.user?.phoneNumber || '-'}</TableCell>
                        {/* 14. Beneficiary Email 1 */}
                        <TableCell sx={{ ...cellSx, maxWidth: 200 }}>
                          <Typography variant="inherit" noWrap>
                            {inv?.creator?.user?.email || '-'}
                          </Typography>
                        </TableCell>
                        {/* 15. Batch Reference No. */}
                        <TableCell sx={cellSx}>-</TableCell>
                        {/* 16. Payment Date */}
                        <TableCell sx={cellSx}>-</TableCell>
                        {/* 17. Beneficiary Address */}
                        <TableCell sx={cellSx}>-</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ height: 12, flexShrink: 0 }} />
        </DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, md: 1 },
            px: { xs: 2, md: 3 },
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Left side: status badges + add status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <Box
                key={status}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  height: 32,
                  px: 1.5,
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  borderColor: STATUS_COLORS[status] || '#637381',
                }}
              >
                <Typography
                  sx={{
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: STATUS_COLORS[status] || '#637381',
                    lineHeight: 1,
                  }}
                >
                  {count} {status.replace('_', ' ')}
                </Typography>
                {exportStatuses.length > 1 && !exportStatuses.includes('all') && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveStatus(status)}
                    sx={{
                      p: 0,
                      ml: 0.25,
                      width: 16,
                      height: 16,
                      color: STATUS_COLORS[status] || '#637381',
                      '&:hover': { bgcolor: `${STATUS_COLORS[status] || '#637381'}18` },
                    }}
                  >
                    <Iconify icon="mingcute:close-line" width={14} />
                  </IconButton>
                )}
              </Box>
            ))}
            {!exportStatuses.includes('all') &&
              TABS.some((tab) => tab.value !== 'all' && !exportStatuses.includes(tab.value)) && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => setAddStatusAnchor(e.currentTarget)}
                    disabled={exportLoading}
                    startIcon={<Iconify icon="mingcute:add-line" width={16} />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderColor: '#c4cdd5',
                      color: '#637381',
                      '&:hover': { borderColor: '#919eab', bgcolor: '#f5f5f5' },
                    }}
                  >
                    Add Status
                  </Button>
                  <Menu
                    anchorEl={addStatusAnchor}
                    open={Boolean(addStatusAnchor)}
                    onClose={() => setAddStatusAnchor(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  >
                    {TABS.filter(
                      (tab) => tab.value !== 'all' && !exportStatuses.includes(tab.value)
                    ).map((tab) => (
                      <MenuItem
                        key={tab.value}
                        onClick={() => handleAddStatus(tab.value)}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: STATUS_COLORS[tab.value] || '#637381',
                            mr: 1.5,
                            flexShrink: 0,
                          }}
                        />
                        {tab.label}
                        <Typography
                          variant="caption"
                          sx={{ ml: 1, color: '#919eab', fontWeight: 600 }}
                        >
                          ({tab.count})
                        </Typography>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
          </Box>

          {/* Right side: selection summary + actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: { xs: 1, md: 2 },
              flexShrink: 0,
              justifyContent: { xs: 'space-between', md: 'flex-end' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
              <Typography
                variant="body2"
                sx={{ color: '#637381', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {exportSummary.count}/{exportSummary.totalCount} selected
              </Typography>
              <Box sx={{ width: '1px', height: 20, bgcolor: 'divider' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                {exportSummary.totals
                  .map((t) => formatCurrencyAmount(t.total, t.currencyCode, t.currencySymbol))
                  .join(' \u00B7 ')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Button
                variant="outlined"
                onClick={exportPreview.onFalse}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Cancel
              </Button>
              <LoadingButton
                variant="contained"
                onClick={(e) => setExportFormatAnchor(e.currentTarget)}
                loading={exportingCSV}
                disabled={exportSelected.size === 0}
                endIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={16} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 120,
                  bgcolor: '#203ff5',
                  '&:hover': { bgcolor: '#1a33c4' },
                }}
              >
                Export
              </LoadingButton>
            </Box>
            <Menu
              anchorEl={exportFormatAnchor}
              open={Boolean(exportFormatAnchor)}
              onClose={() => setExportFormatAnchor(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <MenuItem
                onClick={() => {
                  setExportFormatAnchor(null);
                  handleConfirmExport('xlsx');
                }}
                sx={{ fontSize: '0.875rem' }}
              >
                <Iconify icon="vscode-icons:file-type-excel" width={20} sx={{ mr: 1 }} />
                Export as XLSX
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setExportFormatAnchor(null);
                  handleConfirmExport('csv');
                }}
                sx={{ fontSize: '0.875rem' }}
              >
                <Iconify icon="mdi:file-delimited-outline" width={20} sx={{ mr: 1 }} />
                Export as CSV
              </MenuItem>
            </Menu>
          </Box>
        </Box>
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
