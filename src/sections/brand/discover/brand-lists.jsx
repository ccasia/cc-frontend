import dayjs from 'dayjs';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Table,
  Stack,
  Button,
  styled,
  Tooltip,
  TableBody,
  InputBase,
  IconButton,
  Typography,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
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

import BrandTableRow from './brand-table-row';

const defaultFilters = {
  name: '',
  status: 'all',
};

const TABLE_HEAD = [
  { id: 'name', label: 'Client name', width: 180 },
  { id: 'brand', label: 'Total linked brands', width: 100 },
  { id: 'campaigns', label: 'Total Campaigns', width: 100 },
  { id: 'packageType', label: 'Package Type', width: 120 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'validity', label: 'Validity', width: 100 },
  { id: '', width: 88 },
];

const STATUS_OPTIONS = [
  {
    value: 'all',
    label: 'All',
  },
  {
    value: 'ACTIVE',
    label: 'Active',
  },
  {
    value: 'INACTIVE',
    label: 'Inactive',
  },
  {
    value: 'unlinkPackage',
    label: 'Unlinked package',
  },
];

// Styled components for improved UI
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #f0f0f0',
  overflow: 'hidden',
}));

const findLatestPackage = (packages) => {
  if (packages.length === 0) {
    return null; // Return null if the array is empty
  }

  const latestPackage = packages.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);

    return currentDate > latestDate ? current : latest;
  });

  return latestPackage;
};

const BrandLists = ({ dataFiltered }) => {
  const table = useTable();
  const [filters, setFilters] = useState(defaultFilters);
  const confirm = useBoolean();

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

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset = !isEqual(defaultFilters, filters);

  const filteredData = applyFilter({
    inputData: dataFiltered,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const totalStatus = useCallback(
    (status) => {
      if (status === 'all') {
        return dataFiltered?.length;
      }

      if (status === 'unlinkPackage') {
        return dataFiltered.filter((client) => findLatestPackage(client?.subscriptions) === null)
          ?.length;
      }

      return (
        dataFiltered.filter((client) => findLatestPackage(client.subscriptions)?.status === status)
          .length || 0
      );
    },
    [dataFiltered]
  );

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
    (status) => {
      handleFilters('status', status);
    },
    [handleFilters]
  );

  const handleFilterName = useCallback(
    (event) => {
      handleFilters('name', event.target.value);
    },
    [handleFilters]
  );

  const handleDeleteRow = useCallback((id) => {
    console.log(id);
  }, []);

  const handleEditRow = useCallback((id) => {
    console.log(id);
  }, []);

  const notFound = (!filteredData?.length && canReset) || !filteredData?.length;

  return (
    <Box sx={{ mb: 2.5 }}>
      {/* Combined Controls Container */}
      <Box
        sx={{
          border: '1px solid #e7e7e7',
          borderRadius: 1,
          p: 2,
          bgcolor: 'background.paper',
          mb: 2.5,
        }}
      >
        {/* Status Filter Buttons and Search Field */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, md: 1.5 },
          }}
        >
          {/* Status Filter Buttons */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: 'wrap',
              flex: { xs: 'none', md: '0 0 auto' },
            }}
          >
            {STATUS_OPTIONS.map((option) => {
              const isActive = filters.status === option.value;
              const count = totalStatus(option.value);

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

          {/* Search Field */}
          <Box
            sx={{
              width: { xs: '100%', sm: '240px', md: '280px' },
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
              placeholder="Search clients..."
              startAdornment={
                <Iconify
                  icon="eva:search-fill"
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
              <IconButton color="primary" onClick={confirm.onTrue}>
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
              {filteredData
                ?.slice(
                  table.page * table.rowsPerPage,
                  table.page * table.rowsPerPage + table.rowsPerPage
                )
                .map((row) => (
                  <BrandTableRow
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
                emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
              />

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>
        </StyledTableContainer>
        
      <TablePaginationCustom
        count={filteredData.length}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        dense={table.dense}
        onChangeDense={table.onChangeDense}
      />
    </Card>
    </Box>
  );
};

export default BrandLists;

BrandLists.propTypes = {
  dataFiltered: PropTypes.array,
};

function applyFilter({ inputData, comparator, filters }) {
  const { name, status } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis
    ?.map((el) => el[0])
    .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1));

  if (name) {
    inputData = inputData.filter(
      (client) => client?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status === 'unlinkPackage') {
    inputData = inputData?.filter((client) => findLatestPackage(client?.subscriptions) === null);
  }

  if (status !== 'all' && status !== 'unlinkPackage') {
    inputData = inputData?.filter(
      (client) => findLatestPackage(client.subscriptions)?.status === status
    );
  }

  return inputData;
}
