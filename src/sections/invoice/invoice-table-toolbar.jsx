import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Box, Button, Typography } from '@mui/material';
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
}) {
  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

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
      </Stack>
    </Box>
  );
}

InvoiceTableToolbar.propTypes = {
  dateError: PropTypes.bool,
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  serviceOptions: PropTypes.array,
};
