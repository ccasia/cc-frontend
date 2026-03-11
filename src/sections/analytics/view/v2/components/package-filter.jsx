import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Box, Menu, Button, Divider, Checkbox, MenuItem, Typography } from '@mui/material';
import Iconify from 'src/components/iconify';

import useGetPackages from 'src/hooks/use-get-packges';
import { UI_COLORS } from '../chart-config';

const KNOWN_PACKAGE_COLORS = {
  Basic: '#1340FF',
  Essential: '#5B5FC7',
  Pro: '#22C55E',
  Custom: '#FFAB00',
};

const DEFAULT_PACKAGE_COLOR = '#919EAB';

function PackageFilterSelect({ value, onChange }) {
  const { data: packages } = useGetPackages();
  const [anchorEl, setAnchorEl] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const menuOpen = Boolean(anchorEl);

  // Build dynamic package type list from API + 'Custom' catch-all
  const packageTypes = useMemo(() => {
    const apiNames = (packages || []).map((p) => p.name).filter(Boolean);
    if (!apiNames.includes('Custom')) apiNames.push('Custom');
    return apiNames;
  }, [packages]);

  // Re-sync selected packages when packageTypes changes (e.g. on initial load)
  useEffect(() => {
    if (!initialized && packages !== undefined) {
      // Only set to "All" if the current value is empty (initial state)
      if (value.length === 0) {
        onChange(packageTypes);
      }
      setInitialized(true);
    }
  }, [initialized, packageTypes, value.length, onChange]);

  const handleMenuOpen = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleToggle = useCallback(
    (pkg) => {
      const next = value.includes(pkg) ? value.filter((p) => p !== pkg) : [...value, pkg];
      onChange(next);
    },
    [value, onChange]
  );

  const handleToggleAll = useCallback(() => {
    onChange(value.length === packageTypes.length ? [] : [...packageTypes]);
  }, [value, packageTypes, onChange]);

  const isLoading = packages === undefined;

  // Label Logic
  let filterLabel = '';

  if (isLoading || (!initialized && value.length === 0)) {
    filterLabel = 'All Packages';
  } else if (value.length === packageTypes.length) {
    filterLabel = 'All Packages';
  } else if (value.length === 0) {
    filterLabel = 'No Packages';
  } else {
    filterLabel = `${value.length} of ${packageTypes.length}`;
  }

  return (
    <>
      <Button
        size="small"
        onClick={handleMenuOpen}
        endIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={16} />}
        sx={{
          textTransform: 'none',
          color: '#333',
          fontWeight: 600,
          fontSize: '0.8rem',
          bgcolor: menuOpen ? '#F4F6F8' : 'transparent',
          border: '1px solid',
          borderColor: menuOpen ? '#C4CDD5' : UI_COLORS.border,
          borderRadius: 1.5,
          px: 1.5,
          py: 0.5,
          minWidth: 0,
          '&:hover': { bgcolor: '#F4F6F8', borderColor: '#C4CDD5' },
        }}
      >
        {filterLabel}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 180,
              borderRadius: 1.5,
              border: `1px solid ${UI_COLORS.border}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        {/* Select all toggle */}
        <MenuItem dense onClick={handleToggleAll} sx={{ py: 0.75, px: 1.5 }}>
          <Checkbox
            size="small"
            checked={value.length === packageTypes.length}
            indeterminate={value.length > 0 && value.length < packageTypes.length}
            sx={{ p: 0.5, mr: 1 }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            All
          </Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Individual package items */}
        {packageTypes.map((pkg) => (
          <MenuItem key={pkg} dense onClick={() => handleToggle(pkg)} sx={{ py: 0.75, px: 1.5 }}>
            <Checkbox size="small" checked={value.includes(pkg)} sx={{ p: 0.5, mr: 1 }} />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: KNOWN_PACKAGE_COLORS[pkg] || DEFAULT_PACKAGE_COLOR,
                mr: 1,
                flexShrink: 0,
              }}
            />
            <Typography variant="body2">{pkg}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

PackageFilterSelect.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default memo(PackageFilterSelect);
