import React from 'react';
import PropTypes from 'prop-types';

import { Table, TableRow, TableBody, TableCell, TableHead, TableContainer } from '@mui/material';

import Scrollbar from 'src/components/scrollbar';
import { useTable, TableNoData } from 'src/components/table';

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: 220 },
  { id: 'email', label: 'Email', width: 180 },
  { id: 'designation', label: 'Designation', width: 100 },
];

const PICList = ({ personIncharge }) => {
  const table = useTable();

  const denseHeight = table.dense ? 56 : 56 + 20;

  const notFound = !personIncharge?.length || !personIncharge?.length;

  return (
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
                {personIncharge?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item?.name || 'None'}</TableCell>
                    <TableCell>{item?.email || 'None'}</TableCell>
                    <TableCell>{item?.designation || 'None'}</TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );
};

export default PICList;

PICList.propTypes = {
  personIncharge: PropTypes.array,
};
