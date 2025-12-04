import React from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';

import Iconify from 'src/components/iconify';

const SortableHeader = ({ column, label, width, minWidth, sortColumn, sortDirection, onSort, sx, align }) => {
  const isActive = sortColumn === column;
  return (
    <TableCell
      onClick={() => onSort(column)}
      sx={{
        py: 1,
        px: 1,
        color: '#221f20',
        fontWeight: 600,
        width,
        minWidth,
        whiteSpace: 'nowrap',
        bgcolor: '#f5f5f5',
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': {
          bgcolor: '#ebebeb',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <span>{label}</span>
        <Iconify
          icon={isActive && sortDirection === 'desc' ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
          width={16}
          sx={{
            color: isActive ? '#203ff5' : '#8E8E93',
            transition: 'color 0.2s',
          }}
        />
      </Stack>
    </TableCell>
  );
};

SortableHeader.propTypes = {
  column: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func,
  sx: PropTypes.object,
  align: PropTypes.string,
};

export default SortableHeader;
