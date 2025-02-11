import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import {
  Card,
  Table,
  TableRow,
  TableBody,
  TableHead,
  TableCell,
  TableContainer,
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
  { id: 'type', label: 'Type', width: 220 },
  { id: 'value', label: 'Value', width: 180 },
  { id: 'UgcCredits', label: 'Total credits', width: 100 },
  { id: 'remaining credits', label: 'Credits Remaining', width: 88 },
  { id: 'Validity', label: 'Validity', width: 100 },
  { id: 'status', label: 'Status ', width: 50 },
];

const PackageHistoryList = ({ dataFiltered }) => {
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

  const notFound = (!filteredData?.length && canReset) || !filteredData?.length;

  return (
    <Card>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Scrollbar>
          <Table>
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((item) => (
                  <TableCell key={item.id} align="left">
                    {item.label}
                  </TableCell>
                ))}
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
                  {dataFiltered?.map((e) => (
                    <PackageHistoryRow
                      row={e}
                      key={e.id}
                      selected={table.selected.includes(e.type)}
                    />
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TableSelectedAction selected={table.selected.length} onDelete={() => confirm.onTrue()} />
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
