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
  TablePagination,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Scrollbar from 'src/components/scrollbar';
import { useTable, TableNoData, TableSelectedAction } from 'src/components/table';

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
  const table = useTable({
    defaultOrderBy: 'packageId',
    defaultOrder: 'desc',
    defaultRowsPerPage: 5,
  });
  const [filters, setFilters] = useState(defaultFilters);
  const confirm = useBoolean();

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset = !isEqual(defaultFilters, filters);

  const filteredData = applyFilter({
    inputData: dataFiltered,
    filters,
  });

  const dataInPage = filteredData.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const notFound = (!filteredData?.length && canReset) || !filteredData?.length;

  const handleEditSuccess = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  return (
    <Card sx={{ border: 'none', boxShadow: 'none' }}>
      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((item, index) => (
                  <TableCell
                    key={item.id}
                    align="left"
                    sx={{
                      bgcolor: '#f5f5f5',
                      color: '#221f20',
                      fontWeight: 600,
                      py: 1.5,
                      whiteSpace: 'nowrap',
                      borderBottom: 'none',
                      ...(index === 0 && { borderRadius: '10px 0 0 10px' }),
                      ...(index === TABLE_HEAD.length - 1 && { borderRadius: '0 10px 10px 0' }),
                    }}
                  >
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
                  {dataInPage?.map((e) => (
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredData.length}
        rowsPerPage={table.rowsPerPage}
        page={table.page}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
      />
      <TableSelectedAction selected={table.selected.length} onDelete={() => confirm.onTrue()} />
    </Card>
  );
};

export default PackageHistoryList;

PackageHistoryList.propTypes = {
  dataFiltered: PropTypes.any,
  onRefresh: PropTypes.func,
};

function applyFilter({ inputData, filters }) {
  const { type } = filters;

  let data = inputData ? [...inputData] : [];

  data.sort((a, b) => {
    const idA = a.id ?? '';
    const idB = b.id ?? '';
    if (idA < idB) return 1;
    if (idA > idB) return -1;
    return 0;
  });

  if (type) {
    data = data.filter((user) => user?.type?.toLowerCase().indexOf(type.toLowerCase()) !== -1);
  }

  return data;
}
