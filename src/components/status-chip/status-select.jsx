import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { Box, Popover, CircularProgress } from '@mui/material';

import Iconify from '../iconify';
import StatusChip from './status-chip';

// ----------------------------------------------------------------------

/**
 * A status chip that opens a dropdown of `options` ({ value, label, color }).
 *
 * `onChange(value)` does the save and should reject when it fails (after showing its own
 * error), so the chip can switch back. The picked value is shown from the moment it's chosen
 * until `value` updates from the refetch, so the old status never flashes back.
 *
 * When `disabled` the chip is read-only: no arrow, and clicks pass through to the row.
 */
export default function StatusSelect({
  value,
  options,
  onChange,
  disabled,
  placeholder = 'Not set',
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingValue, setPendingValue] = useState(null);

  // Fresh data from the server supersedes whatever was picked.
  useEffect(() => {
    setPendingValue(null);
  }, [value]);

  const current = pendingValue ?? value;
  const config = options.find((option) => option.value === current);
  const isEditable = !disabled;

  const handleSelect = async (next) => {
    setAnchorEl(null);
    if (next === current) return;

    setPendingValue(next);
    setIsSaving(true);
    try {
      await onChange(next);
    } catch (error) {
      setPendingValue(null);
    } finally {
      setIsSaving(false);
    }
  };

  let trailingIcon = null;
  if (isSaving) {
    trailingIcon = <CircularProgress size={12} sx={{ color: config?.color || '#8E8E93' }} />;
  } else if (isEditable) {
    trailingIcon = <Iconify icon="eva:chevron-down-fill" width={14} sx={{ flexShrink: 0 }} />;
  }

  return (
    <>
      <StatusChip
        color={config?.color}
        empty={!config}
        // Read-only chips let the click through to the row.
        onClick={(e) => {
          if (!isEditable || isSaving) return;
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        sx={{
          cursor: isEditable ? 'pointer' : 'inherit',
          transition: 'background-color 0.15s',
          ...(isEditable && { '&:hover': { bgcolor: '#F5F5F5' } }),
        }}
      >
        {config?.label || placeholder}
        {trailingIcon}
      </StatusChip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        // The popover is portalled, but React still bubbles its clicks up to the table row.
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              p: 1.25,
              bgcolor: 'white',
              boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
              borderRadius: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            },
          },
        }}
      >
        {options.map((option) => {
          const isSelected = current === option.value;

          return (
            <StatusChip
              key={option.value}
              color={option.color}
              onClick={() => handleSelect(option.value)}
              sx={{
                display: 'flex',
                px: 1.5,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                ...(isSelected && { boxShadow: `0 0 0 2px ${option.color}20` }),
                '&:hover': { bgcolor: '#F5F5F5' },
              }}
            >
              <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                {option.label}
              </Box>
              {isSelected && (
                <Iconify icon="eva:checkmark-fill" width={14} sx={{ ml: 1, flexShrink: 0 }} />
              )}
            </StatusChip>
          );
        })}
      </Popover>
    </>
  );
}

StatusSelect.propTypes = {
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};
