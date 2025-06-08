/* eslint-disable no-unused-vars */
import { mutate } from 'swr';
import isEqual from 'lodash/isEqual';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import { 
  Box, 
  Stack, 
  styled, 
  Divider, 
  TableRow, 
  TableBody, 
  TableCell,
  LinearProgress 
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCreators from 'src/hooks/use-get-creators';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { USER_STATUS_OPTIONS } from 'src/_mock';
import { useAuthContext } from 'src/auth/hooks';
import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import CreatorTableRow from '../creator-table-row';
import CreatorTableToolbar from '../creator-table-toolbar';

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_STATUS_OPTIONS];

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: 180 },
  { id: 'pronounce', label: 'Pronounce', width: 100 },
  { id: 'country', label: 'Country', width: 100 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'paymentFormStatus', label: 'Payment Form Status', width: 180 },
  { id: '', label: '', width: 88 },
];

const defaultFilters = {
  name: '',
  status: 'all',
  ageRange: [0, 100],
  pronounce: [],
};

// Styled components for improved UI
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #f0f0f0',
  overflow: 'hidden',
}));

// ----------------------------------------------------------------------

function CreatorTableView() {
  const { data: creators, isLoading } = useGetCreators();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [ageRange, setAgeRange] = useState(defaultFilters.ageRange);
  const { user: admin } = useAuthContext();
  const [isExporting, setIsExporting] = useState(false);

  const handleAgeRangeChange = (newValue) => {
    setAgeRange(newValue);
  };

  const handleClickOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };
  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleClickOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportToSpreadsheet = async () => {
    try {
      setIsExporting(true);
      const response = await axiosInstance.get(endpoints.creators.exportCreators);
      
      if (response.data && response.data.url) {
        // Open the spreadsheet in a new tab
        const a = document.createElement('a');
        a.href = response.data.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        enqueueSnackbar('Creators exported to spreadsheet successfully', { variant: 'success' });
      }
    } catch (error) {
      console.log(`Spreadsheet url: ${process.env.REGISTERED_CREATORS_SPREADSHEET_ID}`);
      console.error('Error exporting creators to spreadsheet: ', error);
      enqueueSnackbar('Failed to export creators to spreadsheet', { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const table = useTable();

  const settings = useSettingsContext();

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState(creators || []);

  const [filters, setFilters] = useState(defaultFilters);

  const dataFiltered = applyFilter({
    inputData: tableData || [],
    comparator: getComparator(table.order, table.orderBy),
    filters,
    ageRange,
  });

  const dataInPage = dataFiltered?.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered?.length && canReset) || !dataFiltered?.length;

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
    setAgeRange([0, 100]);
  }, []);

  const handleFilterStatus = useCallback(
    (status) => {
      handleFilters('status', status);
    },
    [handleFilters]
  );

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await axiosInstance.delete(`${endpoints.creators.deleteCreator}/${id}`);
        const deleteRows = tableData.filter((row) => row.id !== id);
        confirm.onFalse();
        mutate(endpoints.creators.getCreators);
        enqueueSnackbar('Successfully deleted Creator');
      } catch (error) {
        enqueueSnackbar('Error delete Creator', { variant: 'error' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    enqueueSnackbar('Delete success!');
    mutate(endpoints.creators.getCreators);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage?.length,
      totalRowsFiltered: dataFiltered?.length,
    });
  }, [dataFiltered?.length, dataInPage?.length, enqueueSnackbar, table, tableData]);

  useEffect(() => {
    if (!isLoading) {
      setTableData(creators);
    }
  }, [creators, isLoading]);

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="List Creators"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Creators' },
            { name: 'List' },
          ]}
          action={
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="heroicons:arrow-top-right-on-square-20-solid" width={16} />}
              onClick={handleExportToSpreadsheet}
              disabled={isExporting}
              sx={{
                bgcolor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 1,
                px: 2,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  bgcolor: '#f9fafb',
                  borderColor: '#9ca3af',
                },
                '&:disabled': {
                  bgcolor: '#f3f4f6',
                  color: '#9ca3af',
                  borderColor: '#e5e7eb',
                },
              }}
            >
              {isExporting ? 'Exporting...' : 'Google Spreadsheet'}
            </Button>
          }
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />

        <Box
          sx={{
            mb: 2.5,
          }}
        >
          {/* Combined Controls Container */}
          <Box
            sx={{
              border: '1px solid #e7e7e7',
              borderRadius: 1,
              p: 2,
              bgcolor: 'background.paper',
            }}
          >
            {/* Status Filter Buttons */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                mb: 2,
              }}
            >
              {STATUS_OPTIONS.map((option) => {
                const isActive = filters.status === option.value;
                const count = option.value === 'all'
                  ? (tableData?.length || 0)
                  : (tableData?.filter((item) => item.status.toLowerCase() === option.value.toLowerCase()).length || 0);

                return (
                  <Button
                    key={option.value}
                    onClick={() => handleFilterStatus(option.value)}
                    sx={{
                      px: 2,
                      py: 1,
                      minHeight: '38px',
                      height: '38px',
                      minWidth: 'fit-content',
                      color: isActive ? '#ffffff' : '#666666',
                      bgcolor: isActive ? '#1340ff' : 'transparent',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      borderRadius: 0.75,
                      textTransform: 'none',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '1px',
                        left: '1px',
                        right: '1px',
                        bottom: '1px',
                        borderRadius: 0.75,
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.2s ease',
                        zIndex: -1,
                      },
                      '&:hover::before': {
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
                      },
                      '&:hover': {
                        bgcolor: isActive ? '#1340ff' : 'transparent',
                        color: isActive ? '#ffffff' : '#1340ff',
                        transform: 'scale(0.98)',
                      },
                      '&:focus': {
                        outline: 'none',
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <span>{option.label}</span>
                      <Box
                        sx={{
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          bgcolor: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f5f5f5',
                          color: isActive ? '#ffffff' : '#666666',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minWidth: 20,
                          textAlign: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {count}
                      </Box>
                    </Stack>
                  </Button>
                );
              })}
            </Stack>

            <Divider sx={{ borderColor: '#f0f0f0', mb: 2 }} />

            {/* Toolbar Section */}
            <CreatorTableToolbar
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              ageRange={ageRange}
              onAgeRangeChange={handleAgeRangeChange}
              pronounceOptions={['he/him', 'she/her', 'they/them', 'others']}
              results={dataFiltered?.length || 0}
            />
          </Box>
        </Box>

        <Card
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <StyledTableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered?.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered?.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="heroicons:trash-20-solid" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  user={admin}
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered?.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered?.map((row) => row.id)
                    )
                  }
                  sx={{
                    '& .MuiTableCell-head': {
                      backgroundColor: '#fafafa',
                      color: '#666666',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      borderBottom: '1px solid #f0f0f0',
                      padding: '12px 16px',
                      height: '44px',
                    },
                  }}
                />

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_HEAD.length + 1} align="center">
                        <LinearProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {dataFiltered
                        ?.slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <CreatorTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onDeleteRow={() => handleDeleteRow(row.id)}
                            onEditRow={() => handleEditRow(row.id)}
                          />
                        ))}
                      <TableEmptyRows
                        height={denseHeight}
                        emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered?.length)}
                      />
                      <TableNoData notFound={notFound} />
                    </>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </StyledTableContainer>

          <TablePaginationCustom
            count={dataFiltered?.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
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
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
      <Toaster />
    </>
  );
}

export default withPermission(['list:creator'], CreatorTableView);

function applyFilter({ inputData, comparator, filters, ageRange }) {
  const { name, status } = filters;

  // Handle undefined or null inputData
  if (!inputData || !Array.isArray(inputData)) {
    return [];
  }

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData = stabilizedThis.map((el) => el[0]);

  if (name) {
    filteredData = filteredData.filter(
      (user) => user?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    filteredData = filteredData.filter((user) => user.status.toLowerCase() === status.toLowerCase());
  }

  if (filters.pronounce.length) {
    filteredData = filteredData.filter((user) => filters.pronounce.includes(user.creator.pronounce));
  }

  return filteredData;
}
