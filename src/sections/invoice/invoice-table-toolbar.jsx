import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';

import { Box, Button, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';
// import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function InvoiceTableToolbar({
  filters,
  onFilters,
  //
  dateError,
  serviceOptions,
  onSortDirectionChange,
}) {
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleToggleSort = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    if (onSortDirectionChange) {
      onSortDirectionChange(newDirection);
    }
  };

  const smUp = useResponsive('up', 'sm');

  return (
    <Box
      // spacing={2}
      // alignItems={{ xs: 'flex-end', md: 'center' }}
      // direction={{
      //   xs: 'column',
      //   md: 'row',
      // }}
      sx={{
        p: 2.5,
        pr: { xs: 2.5, md: 1 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <TextField
          fullWidth={!smUp}
          sx={{
            minWidth: '30%',
          }}
          value={filters.name}
          onChange={handleFilterName}
          placeholder="Search customer or invoice number"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        
        {/* Alphabetical Sort Button */}
        <Button
          onClick={handleToggleSort}
          endIcon={
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {sortDirection === 'asc' ? (
                <Stack direction="column" alignItems="center" spacing={0}>
                  <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                    A
                  </Typography>
                  <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                    Z
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="column" alignItems="center" spacing={0}>
                  <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                    Z
                  </Typography>
                  <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                    A
                  </Typography>
                </Stack>
              )}
              <Iconify 
                icon={sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'} 
                width={12}
              />
            </Stack>
          }
          sx={{
            px: 1.5,
            py: 0.75,
            height: '42px',
            color: '#637381',
            fontWeight: 600,
            fontSize: '0.875rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 1,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#221f20',
            },
          }}
        >
          Alphabetical
        </Button>
      </Stack>
    </Box>
  );
}

InvoiceTableToolbar.propTypes = {
  dateError: PropTypes.bool,
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  serviceOptions: PropTypes.array,
  onSortDirectionChange: PropTypes.func,
};
