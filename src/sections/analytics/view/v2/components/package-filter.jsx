import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const PACKAGES = [
  { value: 'ALL', label: 'All packages', icon: 'eva:layers-outline' },
  { value: 'Trail', label: 'Trial', icon: 'eva:clock-outline' },
  { value: 'Basic', label: 'Basic', icon: 'eva:star-outline' },
  { value: 'Essential', label: 'Essential', icon: 'eva:briefcase-outline' },
  { value: 'Pro', label: 'Pro', icon: 'eva:award-outline' },
  { value: 'Ultra', label: 'Ultra', icon: 'eva:award-outline' },
  { value: 'Custom', label: 'Custom', icon: 'eva:options-2-outline' },
];

export default function PackageFilterSelect({ value, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const isFiltered = value !== 'ALL';

  const handleOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handlePreset = useCallback(
    (preset) => {
      handleClose();
      onChange(preset);
    },
    [handleClose, onChange]
  );

  const handleClear = useCallback(() => {
    onChange('ALL');
  }, [onChange]);

  const getButtonLabel = () => {
    const preset = PACKAGES.find((p) => p.value === value);
    return preset?.label || 'All packages';
  };

  return (
    <>
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
          {getButtonLabel()}
        </Button>

        {isFiltered && (
          <IconButton size="small" onClick={handleClear} sx={{ width: 28, height: 28 }}>
            <Iconify icon="eva:close-circle-fill" width={18} sx={{ color: 'text.disabled' }} />
          </IconButton>
        )}
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        {PACKAGES.map((preset) => (
          <MenuItem
            key={preset.value}
            selected={value === preset.value}
            onClick={() => handlePreset(preset.value)}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Iconify icon={preset.icon} width={18} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
              {preset.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

PackageFilterSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
