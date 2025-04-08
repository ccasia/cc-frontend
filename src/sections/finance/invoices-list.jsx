import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Tab,
  Card,
  Tabs,
  Table,
  alpha,
  Dialog,
  TableBody,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Label from 'src/components/label';
import Scrollbar from 'src/components/scrollbar';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import InvoiceItem from './invoice-item';
import InvoiceTableToolbar from './invoice-table-toolbar';
import InvoiceNewEditForm from '../invoice/invoice-new-edit-form';
import InvoiceTableFiltersResult from './invoice-table-filters-result';

const defaultFilters = {
  name: '',
  campaignName: '',
  role: [],
  status: 'all',
};

const TABLE_HEAD = [
  { id: 'invoiceNumber', label: 'Invoice ID', width: 180, hideSortIcon: false },
  { id: 'campaignName', label: 'Campaign Name', width: 220, hideSortIcon: true },
  { id: 'creatorName', label: 'Creator Name', width: 180, hideSortIcon: true },
  { id: 'createdAt', label: 'Created At', width: 100, hideSortIcon: true },
  { id: 'amount', label: 'Amount', width: 100, hideSortIcon: true },
  { id: 'status', label: 'Status', width: 100, hideSortIcon: true },
  { id: '', width: 80, hideSortIcon: true },
];

const InvoiceLists = ({ invoices }) => {
  const [filters, setFilters] = useState(defaultFilters);

  const editDialog = useBoolean();
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState();

  const campaigns = useMemo(() => {
    const data = invoices?.map((invoice) => invoice?.campaign?.name);
    return data.filter((item, index) => data.indexOf(item) === index);
  }, [invoices]);

  const table = useTable();
  const denseHeight = table.dense ? 56 : 56 + 20;

  const dataFiltered = applyFilter({
    inputData: invoices,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

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

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      handleFilters('status', newValue);
    },
    [handleFilters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const changeInvoiceStatus = useCallback((data) => {
    console.log(data);
  }, []);

  const filter = useCallback(
    (name) => {
      if (!name) return [];

      return invoices?.filter((invoice) => invoice?.status === name)?.length;
    },
    [invoices]
  );

  const openEditInvoice = useCallback(
    (id, data) => {
      setSelectedId(id);
      setSelectedData(data);
      editDialog.onTrue();
    },
    [editDialog]
  );

  const closeEditInvoice = useCallback(() => {
    setSelectedId('');
    setSelectedData();
    editDialog.onFalse();
  }, [editDialog]);

  return (
    <Box>
      <Card>
        <Tabs
          value={filters.status}
          onChange={handleFilterStatus}
          sx={{
            px: 2.5,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          <Tab
            value="all"
            label="All"
            iconPosition="end"
            icon={<Label variant="filled">{invoices?.length}</Label>}
          />
          <Tab
            value="draft"
            label="Draft"
            iconPosition="end"
            icon={<Label color="warning">{filter('draft')}</Label>}
          />
          <Tab
            value="approved"
            label="Approved"
            iconPosition="end"
            icon={<Label color="success">{filter('approved')}</Label>}
          />
          <Tab
            value="paid"
            label="Paid"
            iconPosition="end"
            icon={<Label color="success">{filter('paid')}</Label>}
          />
        </Tabs>

        <InvoiceTableToolbar filters={filters} onFilters={handleFilters} campaigns={campaigns} />

        {canReset && (
          <InvoiceTableFiltersResult
            filters={filters}
            onFilters={handleFilters}
            //
            onResetFilters={handleResetFilters}
            //
            results={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <TableContainer sx={{ position: 'relative', overflow: 'auto' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={(columnId) => {
                  const column = TABLE_HEAD.find((col) => col.id === columnId);
                  if (column && !column.hideSortIcon) {
                    table.onSort(columnId);
                  }
                }}
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
                  .map((invoice) => (
                    <InvoiceItem
                      key={invoice.id}
                      invoice={invoice}
                      onChangeStatus={changeInvoiceStatus}
                      selected={table.selected.includes(invoice.id)}
                      onSelectRow={() => table.onSelectRow(invoice.id)}
                      openEditInvoice={openEditInvoice}
                    />
                  ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />
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

        <TableNoData notFound={notFound} />
      </Card>

      <Dialog open={editDialog.value} onClose={closeEditInvoice} fullWidth maxWidth="md">
        <DialogContent sx={{ p: 2 }}>
          <InvoiceNewEditForm id={selectedId} creators={selectedData} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default InvoiceLists;

InvoiceLists.propTypes = {
  invoices: PropTypes.array,
};

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function descendingComparator(a, b, orderBy) {
  if (orderBy === 'invoiceNumber') {
    const aNum = a[orderBy];
    const bNum = b[orderBy];

    if (aNum < bNum) return -1;
    if (aNum > bNum) return 1;
    return 0;
  }

  const aValue = a[orderBy];
  const bValue = b[orderBy];
  if (aValue < bValue) return -1;
  if (aValue > bValue) return 1;
  return 0;
}

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, campaignName } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis?.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) =>
        item?.creator?.user?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.campaign?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.invoiceNumber?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (campaignName) {
    inputData = inputData.filter(
      (item) => item?.campaign?.name?.toLowerCase().indexOf(campaignName.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((item) => item.status === status);
  }

  return inputData;
}
