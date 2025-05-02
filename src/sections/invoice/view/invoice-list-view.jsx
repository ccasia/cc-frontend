import sumBy from 'lodash/sumBy';
import PropTypes from 'prop-types';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { isAfter, isBetween, fDate, fTime } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { _invoices } from 'src/_mock';

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

import InvoiceTableRow from '../invoice-table-row';
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
};

// ----------------------------------------------------------------------

export default function InvoiceListView({ campId, invoices }) {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const settings = useSettingsContext();

  const { user } = useAuthContext();

  const router = useRouter();

  const table = useTable({ defaultOrderBy: 'createDate' });

  const confirm = useBoolean();

  // const tableData = invoices?.campaigns ? invoices.campaigns : _invoices;
  const [tableData, setTableData] = useState(invoices?.campaigns ? invoices.campaigns : _invoices);

  const [filters, setFilters] = useState(defaultFilters);

  const dateError = isAfter(filters.startDate, filters.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData || undefined,
    comparator: getComparator(table.order, table.orderBy),
    filters,
    dateError,
  });

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
      } catch (error) {
        enqueueSnackbar(error?.message, {
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
    } catch (error) {
      enqueueSnackbar(error?.message, {
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

  const smUp = useResponsive('up', 'sm');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const [sortDirection, setSortDirection] = useState('asc');

  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <>
      <Container 
        maxWidth={settings.themeStretch ? false : 'xl'}
          sx={{
          px: { xs: 2, md: 3, lg: 4 },
          maxWidth: '100%'
        }}
      >
        {/* Filter buttons and search bar in one row */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ 
              width: { xs: '100%', md: 'auto' },
            }}
          >
            {/* Filter buttons container */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'auto' },
                gap: 1,
                width: '100%',
                '@media (min-width: 600px)': {
                  display: 'flex',
                  flexWrap: 'wrap',
                }
              }}
            >
              {TABS.map((tab) => (
                <Button
                  key={tab.value}
                  onClick={() => handleFilters('status', tab.value)}
                  sx={{
                    px: 1.5,
                    py: 2.5,
                    height: '42px',
                    border: '1px solid #e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                    borderRadius: 1,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    width: '100%',
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
                    '@media (min-width: 600px)': {
                      width: 'auto',
                    }
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
                        <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                          A
                        </Typography>
                        <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                          Z
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack direction="column" alignItems="center" spacing={0}>
                        <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                          Z
                        </Typography>
                        <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                          A
                        </Typography>
                      </Stack>
                    )}
                    <Iconify 
                      icon={sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'} 
                      width={12}
                    />
                  </Stack>
                }
                sx={{
                  px: 1.5,
                  py: 0.75,
                  height: '42px',
                  color: '#637381',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 1,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: 'none',
                  width: '100%',
                  gridColumn: { xs: '1 / -1', sm: 'auto' },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#221f20',
                  },
                  '@media (min-width: 600px)': {
                    width: 'auto',
                  }
                }}
              >
                Alphabetical
              </Button>
            </Box>
          </Stack>

          <TextField
            placeholder="Search customer or invoice number"
            value={filters.name}
            onChange={(e) => handleFilters('name', e.target.value)}
            fullWidth={!smUp}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              sx: {
                height: '42px',
                '& input': {
                  py: 3,
                  height: '42px',
                },
              },
            }}
            sx={{
              width: { xs: '100%', md: 260 },
              '& .MuiOutlinedInput-root': {
                height: '42px',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1,
              },
            }}
          />
        </Stack>

          {canReset && (
            <InvoiceTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              results={dataFiltered?.length}
            sx={{ mb: 2, ml: { xs: 0, md: -4 } }}
          />
        )}

        <Box sx={{ mb: 3, ml: { xs: 0, md: -4 }, mt: 1 }}>
          <Scrollbar>
            <TableContainer
              sx={{
                width: '100%',
                minWidth: 1000,
                position: 'relative',
                bgcolor: 'transparent',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2,
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

              <Table sx={{ width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 2,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 300,
                        borderRadius: '10px 0 0 10px',
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                      }}
                    >
                      Creator
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 2,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 120,
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                      }}
                    >
                      Invoice Date
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 2,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 120,
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                      }}
                    >
                      Due Date
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 2,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 100,
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                      }}
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 2,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 100,
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: 2,
                        color: '#221f20',
                        fontWeight: 600,
                        width: 240,
                        borderRadius: '0 10px 10px 0',
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
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
                            '& td': {
                              py: 2,
                              px: 2,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                            },
                          }}
                        >
                          <TableCell sx={{ width: 300, display: 'flex', alignItems: 'center' }}>
                            <Avatar alt={row.invoiceFrom?.name} sx={{ mr: 2 }}>
                              {row.invoiceFrom?.name?.charAt(0).toUpperCase()}
                            </Avatar>

                            <ListItemText
                              disableTypography
                              primary={
                                <Typography variant="body2" noWrap>
                                  {row.invoiceFrom?.name}
                                </Typography>
                              }
                              secondary={
                                <Link
                                  noWrap
                                  variant="body2"
                                  onClick={() => handleViewRow(row.id)}
                                  sx={{ color: 'text.disabled', cursor: 'pointer' }}
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
                          
                          <TableCell sx={{ width: 100 }}>{`RM${row.amount || 0}`}</TableCell>
                          
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
                          
                          <TableCell sx={{ 
                            width: 240, 
                            py: 2,
                            px: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            verticalAlign: 'middle',
                            height: '100%'
                          }}>
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
                      }
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
  const { name, status, service, startDate, endDate } = filters;

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
        invoice.invoiceTo.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((invoice) => invoice.status === status);
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
