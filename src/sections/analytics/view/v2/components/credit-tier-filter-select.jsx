import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import Iconify from 'src/components/iconify';
import { CREDIT_TIERS } from 'src/sections/discovery-tool/constants';

// ----------------------------------------------------------------------

function getButtonLabel(selected) {
  if (selected.length === 0) return 'All Tiers';
  if (selected.length === 1) {
    const tier = CREDIT_TIERS.find((t) => t.value === selected[0]);
    return tier?.value || selected[0];
  }
  return `${selected.length} Tiers`;
}

// ----------------------------------------------------------------------

export default function CreditTierFilterSelect({ value, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const isFiltered = value.length > 0;

  const handleOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleToggle = useCallback(
    (tierValue) => {
      const next = value.includes(tierValue)
        ? value.filter((v) => v !== tierValue)
        : [...value, tierValue];
      onChange(next);
    },
    [value, onChange]
  );

  const handleClear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
      <Button
        size="small"
        color="inherit"
        onClick={handleOpen}
        endIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={16} />}
        sx={{
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          px: 1.5,
          py: 0.75,
          fontWeight: 600,
          fontSize: 13,
          whiteSpace: 'nowrap',
          '&:hover': { bgcolor: 'white' },
        }}
      >
        {getButtonLabel(value)}
      </Button>

      {isFiltered && (
        <IconButton size="small" onClick={handleClear} sx={{ width: 28, height: 28 }}>
          <Iconify icon="eva:close-circle-fill" width={18} sx={{ color: 'text.disabled' }} />
        </IconButton>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: { minWidth: 200, maxHeight: 320 },
          },
        }}
      >
        {CREDIT_TIERS.map((tier) => (
          <MenuItem key={tier.value} onClick={() => handleToggle(tier.value)} dense>
            <Checkbox checked={value.includes(tier.value)} size="small" sx={{ mr: 0.5 }} />
            <ListItemText primary={tier.label} primaryTypographyProps={{ fontSize: 13 }} />
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}

CreditTierFilterSelect.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};
