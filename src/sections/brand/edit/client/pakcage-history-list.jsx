import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';

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
  { id: 'packageId', label: 'Package ID', width: 180 },
  { id: 'type', label: 'Package type', width: 220 },
  { id: 'price', label: 'Package Value', width: 180 },
  { id: 'totalUGCCredits', label: 'Credits Utilized', width: 100 },
  { id: 'remainingCredits', label: 'Available Credits', width: 88 },
  { id: 'Validity', label: 'Validity period', width: 100 },
  { id: 'status', label: 'Status ', width: 50 },
  { id: 'actions', label: 'Actions', width: 80 },
];

const PackageHistoryList = ({ dataFiltered, onRefresh }) => {
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

  const handleEditSuccess = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

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
                      onEditSuccess={handleEditSuccess}
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
  onRefresh: PropTypes.func,
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
