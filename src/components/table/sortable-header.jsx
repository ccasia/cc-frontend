import React from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';

import Iconify from 'src/components/iconify';

const SortableHeader = ({ column, label, width, minWidth, sortColumn, sortDirection, onSort, sx = {}, align }) => {
  const isActive = sortColumn === column;
  
  // If width/minWidth are provided as props (non-object), use them; otherwise let sx handle it
  const baseStyles = {
    py: { xs: 0.5, sm: 1 },
    px: { xs: 1, sm: 2 },
    color: '#221f20',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    bgcolor: '#f5f5f5',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    '&:hover': {
      bgcolor: '#ebebeb',
    },
  };
  
  // Add width/minWidth if they're simple values (not responsive objects)
  if (width && typeof width !== 'object') {
    baseStyles.width = width;
  }
  if (minWidth && typeof minWidth !== 'object') {
    baseStyles.minWidth = minWidth;
  }
  
  return (
    <TableCell
      onClick={() => onSort(column)}
      sx={{
        ...baseStyles,
        ...sx,
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
  width: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object, // For responsive values like { xs: 100, sm: '15%' }
  ]),
  minWidth: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object, // For responsive values
  ]),
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func,
  sx: PropTypes.object,
  align: PropTypes.string,
};

export default SortableHeader;
