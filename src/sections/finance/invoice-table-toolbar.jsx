import PropTypes from 'prop-types';
import { memo, useMemo, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import {
  MenuItem,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

function InvoiceTableToolbar({ filters, onFilters, campaigns }) {
  const popover = usePopover();

  // OPTIMIZED: Memoize currency options to prevent recreation on every render
  const currencyOptions = useMemo(
    () => [
      { code: 'MYR', symbol: 'RM', label: 'MYR (RM)' },
      { code: 'SGD', symbol: 'S$', label: 'SGD (S$)' },
      { code: 'USD', symbol: '$', label: 'USD ($)' },
      { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
      { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
      { code: 'IDR', symbol: 'Rp', label: 'IDR (Rp)' },
    ],
    []
  );

  // OPTIMIZED: Memoize campaigns list to prevent unnecessary re-renders
  const campaignOptions = useMemo(
    () => campaigns || [],
    [campaigns]
  );

  // OPTIMIZED: Memoize sx objects to prevent recreation on every render
  const stackSx = useMemo(
    () => ({
      p: 2.5,
      pr: { xs: 2.5, md: 1 },
    }),
    []
  );

  const innerStackSx = useMemo(
    () => ({
      width: 1,
    }),
    []
  );

  // OPTIMIZED: Memoize FormControl sx styles
  const campaignFormControlSx = useMemo(
    () => ({
      width: 180,
      '& .MuiOutlinedInput-root': {
        height: '38px',
        border: '1px solid #e7e7e7',
        borderBottom: '3px solid #e7e7e7',
        borderRadius: 1,
        fontSize: '0.85rem',
        '& .MuiSelect-select': {
          py: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        },
      },
    }),
    []
  );

  const currencyFormControlSx = useMemo(
    () => ({
      width: 140,
      '& .MuiOutlinedInput-root': {
        height: '38px',
        border: '1px solid #e7e7e7',
        borderBottom: '3px solid #e7e7e7',
        borderRadius: 1,
        fontSize: '0.85rem',
        '& .MuiSelect-select': {
          py: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        },
      },
    }),
    []
  );

  const textFieldSx = useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        height: '38px',
        border: '1px solid #e7e7e7',
        borderBottom: '3px solid #e7e7e7',
        borderRadius: 1,
      },
    }),
    []
  );

  const iconButtonSx = useMemo(
    () => ({
      width: 38,
      height: 38,
      border: '1px solid #e7e7e7',
      borderBottom: '3px solid #e7e7e7',
      borderRadius: 1,
    }),
    []
  );

  const menuItemSx = useMemo(() => ({ fontSize: '0.85rem' }), []);
  const inputLabelSx = useMemo(() => ({ fontSize: '0.85rem' }), []);

  // OPTIMIZED: Memoize InputProps to prevent recreation on every render
  const textFieldInputProps = useMemo(
    () => ({
      startAdornment: (
        <InputAdornment position="start">
          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
        </InputAdornment>
      ),
      sx: {
        height: '38px',
        '& input': {
          py: 0,
          height: '100%',
          fontSize: '0.85rem',
        },
      },
    }),
    []
  );

  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterCampaignName = useCallback(
    (e) => {
      onFilters('campaignName', e.target.value);
    },
    [onFilters]
  );
  
  const handleFilterCurrency = useCallback(
    (e) => {
      onFilters('currency', e.target.value);
    },
    [onFilters]
  );

  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{
          xs: 'column',
          md: 'row',
        }}
        sx={stackSx}
      >
        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={innerStackSx}>
          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder="Search by Creator Name, Campaign Name or Invoice ID"
            InputProps={textFieldInputProps}
            sx={textFieldSx}
          />

          <IconButton onClick={popover.onOpen} sx={iconButtonSx}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
          }}
        >
          <Iconify icon="solar:printer-minimalistic-bold" />
          Print
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
          }}
        >
          <Iconify icon="solar:import-bold" />
          Import
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export
        </MenuItem>
      </CustomPopover>
    </>
  );
}

InvoiceTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  campaigns: PropTypes.array,
};

// OPTIMIZED: Memoize component to prevent unnecessary re-renders when props haven't changed
export default memo(InvoiceTableToolbar);
