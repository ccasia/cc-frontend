import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import { Box, Menu, Stack, Button, MenuItem } from '@mui/material';

import Iconify from 'src/components/iconify';

// Matches the filter-pill pattern already used for the Agreement Status filter in
// campaign-agreements.jsx, so status/type filters look the same across every admin campaign tab.
const FILTER_PILL_SX = {
  height: 34,
  minHeight: 34,
  padding: '8px 16px',
  gap: '4px',
  border: 'none',
  borderBottom: 'none',
  borderRadius: '100px',
  fontFamily: 'Inter Display, Inter, sans-serif',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '18px',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  minWidth: 'unset',
  flexShrink: 0,
  boxShadow: 'none',
  '& .MuiButton-endIcon': {
    ml: 0,
    mr: 0,
  },
};

const getFilterPillSx = (isActive) => ({
  ...FILTER_PILL_SX,
  bgcolor: isActive ? 'rgba(19, 64, 255, 0.10)' : '#F5F5F5',
  color: isActive ? '#1340FF' : '#231F20',
  fontWeight: isActive ? 600 : 500,
  '&:hover': {
    bgcolor: isActive ? 'rgba(19, 64, 255, 0.16)' : '#EBEBEB',
    border: 'none',
    borderBottom: 'none',
    boxShadow: 'none',
  },
});

function FilterPillEndIcons({ isActive, isOpen, onClear, clearLabel }) {
  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClear();
  };

  return (
    <Stack direction="row" alignItems="center" spacing={0.25} component="span">
      {isActive && (
        <Box
          component="span"
          role="button"
          tabIndex={0}
          aria-label={clearLabel}
          onClick={handleClear}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              handleClear(event);
            }
          }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: '50%',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'rgba(19, 64, 255, 0.16)',
            },
          }}
        >
          <Iconify icon="eva:close-fill" width={14} />
        </Box>
      )}
      <Iconify
        icon="eva:chevron-down-fill"
        width={20}
        sx={{
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }}
      />
    </Stack>
  );
}

FilterPillEndIcons.propTypes = {
  isActive: PropTypes.bool,
  isOpen: PropTypes.bool,
  onClear: PropTypes.func.isRequired,
  clearLabel: PropTypes.string.isRequired,
};

/**
 * One filter pill: a button showing the currently selected option's label, opening a menu of
 * `options` on click. Selecting `clearValue` (default `'all'`) — either from the menu or via the
 * little "x" that appears once a non-default option is active — resets the filter.
 */
const FilterDropdown = ({ options, value, onChange, clearLabel, fallbackLabel, clearValue }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const isActive = value !== clearValue;
  const label = useMemo(
    () => options.find((option) => option.value === value)?.label || fallbackLabel,
    [options, value, fallbackLabel]
  );

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setAnchorEl(null);
  };
  const handleClear = () => {
    onChange(clearValue);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="text"
        disableElevation
        onClick={handleClick}
        endIcon={
          <FilterPillEndIcons
            isActive={isActive}
            isOpen={Boolean(anchorEl)}
            onClear={handleClear}
            clearLabel={clearLabel}
          />
        }
        sx={getFilterPillSx(isActive)}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 200,
              p: 0.5,
              bgcolor: 'white',
              boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
              borderRadius: 1.5,
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={value === option.value}
            onClick={() => handleSelect(option.value)}
            sx={{
              fontFamily: 'Inter Display, Inter, sans-serif',
              fontSize: 14,
              fontWeight: value === option.value ? 600 : 500,
              color: '#231F20',
              borderRadius: 1,
              py: 0.75,
            }}
          >
            {option.label}
            {value === option.value && (
              <Iconify icon="eva:checkmark-fill" width={16} sx={{ ml: 'auto', flexShrink: 0 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FilterDropdown;

FilterDropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  clearLabel: PropTypes.string.isRequired,
  fallbackLabel: PropTypes.string,
  clearValue: PropTypes.string,
};

FilterDropdown.defaultProps = {
  fallbackLabel: 'Filter',
  clearValue: 'all',
};
