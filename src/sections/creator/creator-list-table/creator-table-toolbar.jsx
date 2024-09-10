import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function CreatorTableToolbar({
  filters,
  onFilters,
  ageRange,
  onAgeRangeChange,
  pronounceOptions
}) {

  const popover = usePopover();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleAgeRangeChange = (event, newValue) => {
    onAgeRangeChange(newValue);
  };

  const handleOpenFilters = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilters = () => {
    setAnchorEl(null);
  };

  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterRole = useCallback(
    (event) => {
      onFilters(
        'role',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
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
        <Button
          variant="outlined"
          onClick={handleOpenFilters}
          endIcon={<Iconify icon="eva:chevron-down-fill" />}
        >
          Filters
        </Button>
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder="Search..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseFilters}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: { width: 300, p: 3 },
          }}
        >
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>

          <Typography gutterBottom>Age Range</Typography>
          <Slider
            value={ageRange}
            onChange={handleAgeRangeChange}
            valueLabelDisplay="auto"
            min={18}
            max={100}
          />
          <Divider sx={{ my: 2 }} />
          <Typography gutterBottom>Gender</Typography>
          <FormControl fullWidth>
            <Select
              multiple
              value={filters.pronounce}
              onChange={(event) => onFilters('pronounce', event.target.value)}
              renderValue={(selected) => selected.join(', ')}
            >
              {pronounceOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  <Checkbox checked={filters.pronounce.indexOf(option) > -1} />
                  <ListItemText primary={option} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Popover>
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

CreatorTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  ageRange: PropTypes.array,
  onAgeRangeChange: PropTypes.func,
};
