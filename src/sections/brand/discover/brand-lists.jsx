import dayjs from 'dayjs';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';

import {
  Tab,
  Card,
  Tabs,
  Table,
  alpha,
  Tooltip,
  TableBody,
  IconButton,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Label from 'src/components/label';
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

import BrandsToolBar from './brands-toolbar';
import BrandTableRow from './brand-table-row';

const defaultFilters = {
  name: '',
  status: 'all',
};

const TABLE_HEAD = [
  { id: 'name', label: 'Client name', width: 180 },
  { id: 'brand', label: 'Total linked brands', width: 100 },
  { id: 'campaigns', label: 'Total Campaigns', width: 100 },
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

  const handleDeleteRow = useCallback((id) => {
    console.log(id);
  }, []);

  const handleEditRow = useCallback((id) => {
    console.log(id);
  }, []);

  const notFound = (!filteredData?.length && canReset) || !filteredData?.length;

  return (
    <Card>
      <Tabs
        value={filters.status}
        onChange={(e, val) => handleFilters('status', val)}
        sx={{
          px: 2.5,
          boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
        }}
      >
        {STATUS_OPTIONS.map((tab) => (
          <Tab
            key={tab.value}
            iconPosition="end"
            value={tab.value}
            label={tab.label}
            icon={
              <Label
                variant={
                  ((tab.value === 'all' || tab.value === filters.status) && 'filled') || 'soft'
                }
                color={
                  (tab.value === 'ACTIVE' && 'success') ||
                  (tab.value === 'INACTIVE' && 'error') ||
                  'default'
                }
              >
                {totalStatus(tab.value)}
              </Label>
            }
          />
        ))}
      </Tabs>

      <BrandsToolBar filters={filters} onFilters={handleFilters} />

      <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
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
                <Iconify icon="solar:trash-bin-trash-bold" />
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
      </TableContainer>
      <TablePaginationCustom
        count={filteredData.length}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        //
        dense={table.dense}
        onChangeDense={table.onChangeDense}
      />
    </Card>
  );
};

export default BrandLists;

BrandLists.propTypes = {
  dataFiltered: PropTypes.array,
};

function applyFilter({ inputData, comparator, filters }) {
  const { name, status } = filters;

  console.log(status);

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
      (user) => user?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
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
