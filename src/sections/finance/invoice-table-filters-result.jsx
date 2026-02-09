import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function InvoiceTableFiltersResult({
  filters,
  onFilters,
  //
  onResetFilters,
  //
  results,
  dateRange,
  onRemoveCampaign,
  ...other
}) {
  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  const handleRemoveStatus = useCallback(() => {
    onFilters('status', 'all');
  }, [onFilters]);

  const handleRemoveRole = useCallback(
    (inputValue) => {
      const newValue = filters.role.filter((item) => item !== inputValue);

      onFilters('role', newValue);
    },
    [filters.role, onFilters]
  );

  return (
    <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={1} {...other}>
      <Box sx={{ typography: 'body2', whiteSpace: 'nowrap' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>
        {filters.status !== 'all' && (
          <Block label="Status:">
            <Chip size="small" label={filters.status} onDelete={handleRemoveStatus} />
          </Block>
        )}

        {!!filters.campaigns?.length && (
          <Block label="Campaigns:">
            {filters.campaigns.map((campaign) => (
              <Chip
                key={campaign}
                label={campaign}
                size="small"
                onDelete={() => onRemoveCampaign(campaign)}
              />
            ))}
          </Block>
        )}

        {dateRange?.selected && (
          <Block label="Date:">
            <Chip
              label={dateRange.shortLabel}
              size="small"
              onDelete={dateRange.onReset}
            />
          </Block>
        )}

        {!!filters.role.length && (
          <Block label="Role:">
            {filters.role.map((item) => (
              <Chip key={item} label={item} size="small" onDelete={() => handleRemoveRole(item)} />
            ))}
          </Block>
        )}

        {!!filters.name && (
          <Block label="Keyword:">
            <Chip label={filters.name} size="small" onDelete={handleRemoveKeyword} />
          </Block>
        )}

      <Button
        color="error"
        onClick={onResetFilters}
        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        sx={{ whiteSpace: 'nowrap' }}
      >
        Clear
      </Button>
    </Stack>
  );
}

InvoiceTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  results: PropTypes.number,
  dateRange: PropTypes.object,
  onRemoveCampaign: PropTypes.func,
};

// ----------------------------------------------------------------------

function Block({ label, children, sx, ...other }) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
        ...sx,
      }}
      {...other}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}

Block.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  sx: PropTypes.object,
};
