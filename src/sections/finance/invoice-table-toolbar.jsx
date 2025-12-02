import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import {
  Select,
  MenuItem,
  TextField,
  IconButton,
  InputLabel,
  FormControl,
  InputAdornment,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function InvoiceTableToolbar({ filters, onFilters, campaigns }) {
  const popover = usePopover();

  // Currency options
  const currencyOptions = [
    { code: 'MYR', symbol: 'RM', label: 'MYR (RM)' },
    { code: 'SGD', symbol: 'S$', label: 'SGD (S$)' },
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
    { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
    { code: 'IDR', symbol: 'Rp', label: 'IDR (Rp)' },
  ];

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
        sx={{
          p: 2.5,
          pr: { xs: 2.5, md: 1 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <FormControl sx={{ width: 180 }}>
            <InputLabel id="campaign-select-label">Campaign</InputLabel>
            <Select
              labelId="campaign-select-label"
              id="campaign-select"
              label="Campaign"
              value={filters.campaignName}
              onChange={handleFilterCampaignName}
            >
              <MenuItem value="">All Campaigns</MenuItem>
              {campaigns?.map((campaign) => (
                <MenuItem key={campaign} value={campaign}>{campaign}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ width: 140 }}>
            <InputLabel id="currency-select-label">Currency</InputLabel>
            <Select
              labelId="currency-select-label"
              id="currency-select"
              label="Currency"
              value={filters.currency || ''}
              onChange={handleFilterCurrency}
            >
              <MenuItem value="">All Currencies</MenuItem>
              {currencyOptions.map((currency) => (
                <MenuItem key={currency.code} value={currency.code}>
                  {currency.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder="Search by Creator Name, Campaign Name or Invoice ID"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton onClick={popover.onOpen}>
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
