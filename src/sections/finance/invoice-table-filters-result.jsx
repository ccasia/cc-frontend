import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

import { STATUS_COLORS } from './invoice-constants';

// ----------------------------------------------------------------------

export default function InvoiceTableFiltersResult({
  filters,
  onFilters,
  onResetFilters,
  results,
  dateRange,
  onRemoveCampaign,
  campaignImages,
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
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      spacing={1.5}
      {...other}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#637381', whiteSpace: 'nowrap' }}>
        <Box component="span" sx={{ color: '#212b36', fontWeight: 700 }}>{results}</Box>
        {' '}results found
      </Typography>

      <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', flexShrink: 0 }} />

      {filters.status !== 'all' && (
        <FilterChip
          label={filters.status}
          color={STATUS_COLORS[filters.status]}
          onDelete={handleRemoveStatus}
        />
      )}

      {!!filters.campaigns?.length &&
        filters.campaigns.map((campaign) => (
          <FilterChip
            key={campaign}
            label={campaign}
            avatar={campaignImages?.[campaign]}
            color="#1340FF"
            onDelete={() => onRemoveCampaign(campaign)}
          />
        ))}

      {dateRange?.selected && (
        <FilterChip
          label={dateRange.presetLabel || dateRange.shortLabel}
          prefix="Date"
          color="#8E33FF"
          onDelete={dateRange.onReset}
        />
      )}

      {!!filters.role.length &&
        filters.role.map((item) => (
          <FilterChip
            key={item}
            label={item}
            prefix="Role"
            color="#00B8D9"
            onDelete={() => handleRemoveRole(item)}
          />
        ))}

      {!!filters.name && (
        <FilterChip
          label={filters.name}
          prefix="Search"
          color="#212b36"
          onDelete={handleRemoveKeyword}
        />
      )}

      <Button
        size="small"
        onClick={onResetFilters}
        startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
        sx={{
          ml: 0.5,
          fontWeight: 600,
          fontSize: '0.8rem',
          textTransform: 'none',
          color: '#ff5630',
          '&:hover': { bgcolor: '#ff563014' },
        }}
      >
        Clear all
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
  campaignImages: PropTypes.object,
};

// ----------------------------------------------------------------------

function FilterChip({ label, prefix, icon, avatar, color = '#637381', onDelete }) {
  const formatted = label.replace('_', ' ');
  const displayLabel = prefix
    ? `${prefix}: ${label}`
    : formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        height: 32,
        px: 1.5,
        border: '1px solid',
        borderBottom: '3px solid',
        borderRadius: 0.8,
        bgcolor: 'white',
        borderColor: color,
      }}
    >
      {avatar && (
        <Box
          component="img"
          src={avatar}
          alt=""
          sx={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      )}
      {icon && !avatar && <Iconify icon={icon} width={16} sx={{ color, flexShrink: 0 }} />}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '0.75rem',
          color,
          lineHeight: 1,
        }}
      >
        {displayLabel}
      </Typography>
      <IconButton
        size="small"
        onClick={onDelete}
        sx={{
          p: 0,
          ml: 0.25,
          width: 16,
          height: 16,
          color,
          '&:hover': { bgcolor: `${color}18` },
        }}
      >
        <Iconify icon="mingcute:close-line" width={14} />
      </IconButton>
    </Box>
  );
}

FilterChip.propTypes = {
  label: PropTypes.string,
  prefix: PropTypes.string,
  icon: PropTypes.string,
  avatar: PropTypes.string,
  color: PropTypes.string,
  onDelete: PropTypes.func,
};
