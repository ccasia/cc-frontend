import dayjs from 'dayjs';
import { useMemo } from 'react';
import PropTypes from 'prop-types';

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

import CampaignTableRow from '../campaign-table-row';

const TABLE_HEAD = [
  { id: 'title', label: 'Campaign', width: 250 },
  { id: 'campaignId', label: 'ID', width: 80 },
  { id: 'ugcCredits', label: 'Credits', width: 80 },
  { id: 'industries', label: 'Industry', width: 120 },
  { id: 'deliverable', label: 'Deliverables', width: 150 },
  { id: 'startDate', label: 'Start Date', width: 100 },
  { id: 'status', label: 'Status', width: 100 },
];

const CampaignClientList = ({ campaigns, searchFilter = '' }) => {
  const table = useTable();

  const denseHeight = table.dense ? 56 : 56 + 20;

  const dataFiltered = useMemo(() => applyFilter({
    inputData: campaigns,
    comparator: getComparator(table.order, table.orderBy),
    searchFilter,
  }), [campaigns, table.order, table.orderBy, searchFilter]);

  const notFound = !dataFiltered?.length;

  return (
    <>
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
            sx={{ minWidth: 960 }}
          >
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headLabel={TABLE_HEAD}
              rowCount={dataFiltered.length}
              numSelected={table.selected.length}
              sx={{
                '& .MuiTableCell-head': {
                  bgcolor: '#f5f5f5',
                  color: '#221f20',
                  fontWeight: 600,
                  py: 1.5,
                  whiteSpace: 'nowrap',
                  borderBottom: 'none',
                  '&:first-of-type': { borderRadius: '10px 0 0 10px' },
                  '&:last-of-type': { borderRadius: '0 10px 10px 0' },
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
                  <CampaignTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    filter={searchFilter}
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
  searchFilter: PropTypes.string,
};

function applyFilter({ inputData, comparator, searchFilter }) {
  if (!inputData) return [];

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let result = stabilizedThis
    .map((el) => el[0])
    .sort((a, b) => (dayjs(a.createdAt).isBefore(dayjs(b.createdAt)) ? 1 : -1));

  if (searchFilter) {
    result = result.filter(
      (campaign) => campaign?.name?.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1
    );
  }

  return result;
}
