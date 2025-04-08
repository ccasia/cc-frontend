import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';

import {
  Card,
  Table,
  Dialog,
  Tooltip,
  TableBody,
  IconButton,
  DialogContent,
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

import EditBrand from './edit/edit-brand';
import BrandsToolBar from './brands-edit-toolbar';
import BrandTableRow from './brands-edit-table-row';

const defaultFilters = {
  name: '',
};

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: 180 },
  { id: 'email', label: 'Email', width: 220 },
  { id: 'phoneNumber', label: 'Phone Number', width: 180 },
  { id: 'website', label: 'Website', width: 100 },
  { id: 'instagram', label: 'Instagram', width: 100 },
  { id: 'tiktok', label: 'Tiktok', width: 100 },
  { id: '', label: 'UGC', width: 88 },
  { id: '', width: 88 },
];

const BrandEditLists = ({ dataFiltered }) => {
  const table = useTable();
  const [filters, setFilters] = useState(defaultFilters);
  const [brandData, setBrandData] = useState(null);
  const confirm = useBoolean();
  const editDialog = useBoolean();

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset = !isEqual(defaultFilters, filters);

  const filteredData = applyFilter({
    inputData: dataFiltered,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const notFound = (!filteredData?.length && canReset) || !filteredData?.length;

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

  const handleEditRow = useCallback(
    (data) => {
      setBrandData(data);
      editDialog.onTrue();
    },
    [editDialog]
  );

  // const handleEdit = useCallback(
  //   (data) => {
  //     setBrandData(data);
  //     editDialog.onTrue();
  //   },
  //   [editDialog]
  // );

  return (
    <Card>
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
                    onEditRow={() => handleEditRow(row)}
                    brandData={brandData}
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

      {/* Edit Existing brand dialog */}
      <Dialog open={brandData && editDialog.value}>
        <DialogContent>
          <EditBrand
            brand={brandData}
            onClose={() => {
              editDialog.onFalse();
              setBrandData(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BrandEditLists;

BrandEditLists.propTypes = {
  dataFiltered: PropTypes.array,
};

function applyFilter({ inputData, comparator, filters }) {
  const { name } = filters;

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

  return inputData;
}
