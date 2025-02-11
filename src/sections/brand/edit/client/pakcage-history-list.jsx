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
  TableHead,
  TableRow,
  TableCell,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Scrollbar from 'src/components/scrollbar';
import { useTable, TableNoData, getComparator, TableSelectedAction } from 'src/components/table';
import PackageHistoryRow from './package-history-row';

const defaultFilters = {
  name: '',
};

const TABLE_HEAD = [
  { id: 'name', label: '', width: 180 },
  { id: 'id', label: 'id', width: 88 },
  //   { id: 'name', label: '', width: 180 },
  { id: 'type', label: 'Type', width: 220 },
  { id: 'value', label: 'Value', width: 180 },
  //   { id: 'valueSGD', label: 'valueSGD', width: 100 },
  { id: 'UgcCredits', label: 'Total credits', width: 100 },
  { id: 'remaining credits', label: 'remaining', width: 88 },
  { id: 'Validity', label: 'time left ', width: 100 },
  { id: 'status', label: 'status ', width: 50 },
  //   { id: '', label: 'UGC', width: 88 },
];

const PackageHistoryList = ({ dataFiltered }) => {
  const table = useTable();
  const [filters, setFilters] = useState(defaultFilters);
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
    (type, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [type]: value,
      }));
    },
    [table]
  );
  console.log(filteredData);

  //   const handleDeleteRow = useCallback((id) => {
  //     console.log(id);
  //   }, []);

  //   const handleEditRow = useCallback(
  //     (data) => {
  //       setBrandData(data);
  //       editDialog.onTrue();
  //     },
  //     [editDialog]
  //   );

  return (
    <Card>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Scrollbar>
          <Table>
            {/* <TableHeadCustom
              head={TABLE_HEAD}
              denseHeight={denseHeight}
              table={table}
            //   filters={filters}
            //   onFilters={handleFilters}
            /> */}
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((item) => {
                  return (
                    <TableCell
                      key={item.id}
                      align={'left'}
                      // sortDirection={orderBy === headCell.id ? order : false}
                      //   sx={{ width: headCell.width, minWidth: headCell.minWidth }}
                    >
                      {item.label}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {notFound ? (
                <TableNoData
                  numSelected={table.selected.length}
                  numHeaders={TABLE_HEAD.length}
                  denseHeight={denseHeight}
                />
              ) : (
                <>
                  {' '}
                  {dataFiltered?.map((e) => {
                    return (
                      <PackageHistoryRow
                        row={e}
                        key={e.id}
                        selected={table.selected.includes(e.type)}
                      />
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TableSelectedAction selected={table.selected.length} onDelete={() => confirm.onTrue()} />

      {/* <TablePaginationCustom
        count={filteredData.length}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        dense={table.dense}
        onChangeDense={table.onChangeDense}
      /> */}
    </Card>
  );
};

export default PackageHistoryList;

PackageHistoryList.propTypes = {
  dataFiltered: PropTypes.any,
};

function applyFilter({ inputData, comparator, filters }) {
  const { type } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis?.map((el) => el[0]);

  if (type) {
    inputData = inputData.filter(
      (user) => user?.type?.toLowerCase().indexOf(type.toLowerCase()) !== -1
    );
  }

  return inputData;
}
