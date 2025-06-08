import { isEqual } from 'lodash';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Button,
  styled,
  Tooltip,
  Container,
  TableBody,
  InputBase,
  IconButton,
  Typography,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetPackages from 'src/hooks/use-get-packges';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
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

import PackageEdit from '../package-edit';
import PackageCreate from '../package-create';
import PackageTableRow from '../package-table-row';

const pakcagesArray = [
  {
    type: 'Trail',
    valueMYR: 2800,
    valueSGD: 3100,
    totalCredits: 5,
    validityPeriod: 1,
  },
  {
    type: 'Basic',
    valueMYR: 8000,
    valueSGD: 8900,
    totalCredits: 15,
    validityPeriod: 2,
  },
  {
    type: 'Essential',
    valueMYR: 15000,
    valueSGD: 17500,
    totalCredits: 30,
    validityPeriod: 3,
  },
  {
    type: 'Pro',
    valueMYR: 23000,
    valueSGD: 29000,
    totalCredits: 50,
    validityPeriod: 5,
  },
  {
    type: 'Custom',
    valueMYR: 1,
    valueSGD: 1,
    totalCredits: 1,
    validityPeriod: 1,
  },
];

const defaultFilters = {
  name: '',
  role: [],
  status: 'all',
};

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'priceMYR', label: 'Price in MYR', width: 200 },
  { id: 'priceSGD', label: 'Price in SGD', width: 200 },
  { id: 'credits', label: 'UGC Credits', width: 200 },
  { id: 'validityPeriod', label: 'Validity Period', width: 200 },
  { id: 'createdAt', label: 'Created At', width: 200 },
  { id: '', width: 88 },
];

// Styled components for improved UI
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #f0f0f0',
  overflow: 'hidden',
}));

const Packages = () => {
  const { data, isLoading } = useGetPackages();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const theme = useTheme();

  const [tableData, setTableData] = useState([]);

  const table = useTable();

  const [filters, setFilters] = useState(defaultFilters);

  // Search input ref for keyboard shortcut focus
  const searchInputRef = useRef(null);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for CMD+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

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
  }, []);

  const handleFilterName = useCallback(
    (event) => {
      handleFilters('name', event.target.value);
    },
    [handleFilters]
  );

  useEffect(() => {
    if (!isLoading) {
      setTableData(data || []);
    }
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <CustomBreadcrumbs
          heading="Packages Information"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Packages' },
            { name: 'Lists' },
          ]}
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />
      <Box
        sx={{
          position: 'relative',
          top: 200,
          textAlign: 'center',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
              color: theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Packages Information"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Packages' },
          { name: 'Lists' },
        ]}
        action={
          <Button
            size="small"
            variant="contained"
            onClick={() => setOpen(true)}
            startIcon={<Iconify icon="heroicons:plus-20-solid" width={18} />}
            sx={{
              bgcolor: '#1340ff',
              color: '#ffffff',
              borderRadius: 1,
              px: 2,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#0f35d1',
              },
            }}
          >
            Create Package
          </Button>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {/* Search Controls */}
      <Box sx={{ mb: 2.5 }}>
        <Box
          sx={{
            border: '1px solid #e7e7e7',
            borderRadius: 1,
            p: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 1.5, md: 1.5 },
            }}
          >
            {/* Search Box */}
            <Box
              sx={{
                width: { xs: '100%', sm: '240px', md: '320px' },
                border: '1px solid #e7e7e7',
                borderRadius: 0.75,
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                height: '38px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&:hover': {
                  borderColor: '#1340ff',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(19, 64, 255, 0.1)',
                },
                '&:focus-within': {
                  borderColor: '#1340ff',
                  boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.1)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <InputBase
                inputRef={searchInputRef}
                value={filters.name}
                onChange={handleFilterName}
                placeholder="Search packages..."
                startAdornment={
                  <Iconify
                    icon="heroicons:magnifying-glass-20-solid"
                    sx={{
                      width: 18,
                      height: 18,
                      color: 'text.disabled',
                      ml: 1.5,
                      mr: 1,
                      transition: 'color 0.2s ease',
                    }}
                  />
                }
                endAdornment={
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      gap: 0.25,
                      mr: 1.5,
                      ml: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        bgcolor: '#f5f5f5',
                        borderRadius: 0.5,
                        border: '1px solid #e0e0e0',
                        minHeight: '22px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#eeeeee',
                          borderColor: '#d0d0d0',
                          transform: 'scale(1.05)',
                        },
                        '&:active': {
                          transform: 'scale(0.95)',
                        },
                      }}
                      onClick={() => searchInputRef.current?.focus()}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#666666',
                          lineHeight: 1,
                          fontFamily: 'monospace',
                        }}
                      >
                        {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#666666',
                          lineHeight: 1,
                          fontFamily: 'monospace',
                        }}
                      >
                        K
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{
                  width: '100%',
                  color: 'text.primary',
                  fontSize: '0.95rem',
                  '& input': {
                    py: 1,
                    px: 1,
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&::placeholder': {
                      color: '#999999',
                      opacity: 1,
                      transition: 'color 0.2s ease',
                    },
                    '&:focus::placeholder': {
                      color: '#cccccc',
                    },
                  },
                }}
              />
            </Box>

            {/* Right Side Controls */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {/* Results Count - Only show when filters are active */}
              {canReset && (
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <strong style={{ color: '#374151' }}>{dataFiltered?.length || 0}</strong> results
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Active Filters Display */}
        {canReset && (
            <Box sx={{ mt: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {/* Search Term Chip */}
                {filters.name && (
                  <Chip
                    label={`Keyword: "${filters.name}"`}
                    size="small"
                    onDelete={() => handleFilters('name', '')}
                    sx={{
                      bgcolor: '#f0f9ff',
                      color: '#1340ff',
                      border: '1px solid rgba(19, 64, 255, 0.2)',
                      height: '32px',
                      '& .MuiChip-deleteIcon': {
                        color: '#1340ff',
                        '&:hover': {
                          color: '#0f35d1',
                        },
                      },
                    }}
                  />
                )}

                {/* Clear All Button */}
                <Button
                  size="small"
                  onClick={handleResetFilters}
                  startIcon={<Iconify icon="heroicons:trash-20-solid" width={14} height={14} />}
                  sx={{
                    color: '#dc3545',
                    bgcolor: 'rgba(220, 53, 69, 0.08)',
                    border: '1px solid rgba(220, 53, 69, 0.2)',
                    borderRadius: 0.75,
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    height: '32px',
                    '&:hover': {
                      bgcolor: 'rgba(220, 53, 69, 0.12)',
                      borderColor: 'rgba(220, 53, 69, 0.3)',
                    },
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </Box>
          )}
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
            rowCount={dataFiltered.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                dataFiltered.map((row) => row.id)
              )
            }
            action={
              <Tooltip title="Delete">
                <IconButton color="primary">
                  <Iconify icon="heroicons:trash-20-solid" />
                </IconButton>
              </Tooltip>
            }
          />

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    dataFiltered.map((row) => row.id)
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
                {dataFiltered
                  ?.slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <PackageTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      // onDeleteRow={() => handleDeleteRow(row.id)}
                      // onEditRow={() => handleEditRow(row.id)}
                    />
                  ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </StyledTableContainer>

        <TablePaginationCustom
          count={dataFiltered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>

      <PackageCreate open={open} onClose={() => setOpen(false)} />
      <PackageEdit open={edit} onClose={() => setEdit(false)} />
    </Container>
  );
};

export default Packages;

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, role } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis?.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (pkg) => pkg?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((pkg) => pkg.status === status);
  }

  if (role.length) {
    inputData = inputData.filter((pkg) => role.includes(pkg?.admin?.role?.name));
  }

  return inputData;
}
