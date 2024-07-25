import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

import {
  Chip,
  Stack,
  Radio,
  Drawer,
  Divider,
  TextField,
  IconButton,
  Typography,
  RadioGroup,
  Autocomplete,
  FormControlLabel,
} from '@mui/material';

import { useGetCampaignBrandOption } from 'src/hooks/use-get-company-brand';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

const CampaignFilter = ({ open, onOpen, onClose, brands, filters, onFilters, reset }) => {
  const { options } = useGetCampaignBrandOption();

  const handleFilterStatus = useCallback(
    (e) => {
      onFilters('status', e.target.value);
    },
    [onFilters]
  );

  const handleFilterBrand = useCallback(
    (e) => {
      onFilters('brands', e);
    },
    [onFilters]
  );

  const renderHead = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ py: 2, pr: 1, pl: 2.5 }}
    >
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Filters
      </Typography>

      <IconButton onClick={reset}>
        <Iconify icon="carbon:reset" />
      </IconButton>

      <IconButton onClick={onClose}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Stack>
  );

  const renderStatus = (
    <Stack>
      <Typography variant="h6">Status</Typography>
      <RadioGroup
        aria-labelledby="demo-controlled-radio-buttons-group"
        name="controlled-radio-buttons-group"
        value={filters.status}
        onChange={handleFilterStatus}
      >
        <FormControlLabel value="active" control={<Radio />} label="Active" />
        <FormControlLabel value="completed" control={<Radio />} label="Completed" />
      </RadioGroup>
    </Stack>
  );

  const renderBrand = (
    <Stack>
      <Typography variant="h6">Brand</Typography>
      {options && (
        <Autocomplete
          multiple
          options={options}
          getOptionLabel={(option) => option?.name}
          value={filters.brands}
          onChange={(event, newValue) => handleFilterBrand(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  variant="contained"
                  size="small"
                  label={option?.name}
                  key={key}
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(props) => <TextField {...props} label="Brand" />}
        />
      )}
    </Stack>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { invisible: true },
      }}
      PaperProps={{
        sx: { width: 280 },
      }}
    >
      {renderHead}

      <Divider />

      <Scrollbar sx={{ px: 2.5, py: 3 }}>
        <Stack spacing={3}>
          {renderStatus}

          {renderBrand}
        </Stack>
      </Scrollbar>
    </Drawer>
  );
};

export default CampaignFilter;

CampaignFilter.propTypes = {
  open: PropTypes.bool,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  brands: PropTypes.array,
  onFilters: PropTypes.func,
  filters: PropTypes.object,
  reset: PropTypes.func,
};
