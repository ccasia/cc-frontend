import { isEqual } from 'lodash';
import React, { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Table,
  Button,
  Tooltip,
  Container,
  TableBody,
  IconButton,
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
import PackageTableToolbar from '../package-table-toolbar';
import PackageTableFiltersResult from '../package-table-filters-result';

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

const Packages = () => {
  // const { data, isLoading } = useGetPackages();
  const { data, isLoading } = useGetPackages();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  console.log(data);

  const [tableData, setTableData] = useState([]);

  const table = useTable();

  const [filters, setFilters] = useState(defaultFilters);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
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
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setTableData(data);
    }
  }, [data, isLoading]);

  if (isLoading) {
    return (
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
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
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
            startIcon={<Iconify icon="mingcute:add-fill" />}
            sx={{
              borderRadius: 0.5,
            }}
          >
            Create new Package
          </Button>
        }
        sx={{
          mb: 2,
        }}
      />

      <Card>
        <PackageTableToolbar filters={filters} onFilters={handleFilters} />

        {canReset && (
          <PackageTableFiltersResult
            filters={filters}
            onFilters={handleFilters}
            //
            onResetFilters={handleResetFilters}
            //
            results={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

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
                <IconButton color="primary">
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
        </TableContainer>

        <TablePaginationCustom
          count={dataFiltered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          //
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>

      {/* <PackageLists packages={data} /> */}
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
      (user) => user?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
  }

  if (role.length) {
    inputData = inputData.filter((user) => role.includes(user?.admin?.role?.name));
  }

  return inputData;
}
