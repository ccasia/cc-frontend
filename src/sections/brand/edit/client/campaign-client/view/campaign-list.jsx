import dayjs from 'dayjs';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import { Table, Tooltip, TableBody, IconButton, TableContainer } from '@mui/material';

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

import CampaignToolBar from '../campaign-toolbar';
import CampaignTableRow from '../campaign-table-row';

const defaultFilters = {
  name: '',
  status: 'all',
};

const TABLE_HEAD = [
  { id: 'title', label: 'Campaign Title', width: 180 },
  { id: 'campaignId', label: 'Campaign ID', width: 100 },
  { id: 'ugcCredits', label: 'UGC Credits', width: 100 },
  { id: 'industries', label: 'Industries', width: 100 },
  { id: 'deliverable', label: 'Deliverables', width: 100 },
  { id: 'startDate', label: 'Start date', width: 100 },
  { id: 'status', label: 'status', width: 100 },
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

const CampaignClientList = ({ campaigns }) => {
  const table = useTable();
  const [filters, setFilters] = useState(defaultFilters);

  const denseHeight = table.dense ? 56 : 56 + 20;
  const canReset = !isEqual(defaultFilters, filters);

  const dataFiltered = applyFilter({
    inputData: campaigns,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

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

  const notFound = (!dataFiltered?.length && canReset) || !dataFiltered?.length;

  return (
    <>
      <CampaignToolBar onFilters={handleFilters} filters={filters} />
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
          <Table
            size={table.dense ? 'small' : 'medium'}
            sx={{ minWidth: 960, borderRadius: 1, overflow: 'hidden' }}
          >
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headLabel={TABLE_HEAD}
              rowCount={dataFiltered.length}
              numSelected={table.selected.length}
            />

            <TableBody>
              {dataFiltered
                ?.slice(
                  table.page * table.rowsPerPage,
                  table.page * table.rowsPerPage + table.rowsPerPage
                )
                .map((row) => (
                  <CampaignTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    filter={filters.name}
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
    </>
  );
};

export default CampaignClientList;

CampaignClientList.propTypes = {
  campaigns: PropTypes.array,
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

  // if (status === 'unlinkPackage') {
  //   inputData = inputData?.filter((client) => findLatestPackage(client?.subscriptions) === null);
  // }

  // if (status !== 'all' && status !== 'unlinkPackage') {
  //   inputData = inputData?.filter(
  //     (client) => findLatestPackage(client.subscriptions)?.status === status
  //   );
  // }

  return inputData;
}
