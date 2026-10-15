import PropTypes from 'prop-types';

import { Box, Menu, Typography } from '@mui/material';

import { OUTREACH_STATUS_OPTIONS } from 'src/contants/outreach';

import Iconify from 'src/components/iconify';

export const OUTREACH_NOT_SET = 'NOT_SET';

const NOT_SET_OPTION = { value: OUTREACH_NOT_SET, label: 'Not Set', color: '#8E8E93' };

const optionSx = (option, isSelected) => {
  const isNotSet = option.value === OUTREACH_NOT_SET;
  const borderStyle = isNotSet ? 'dashed' : 'solid';
  const ringColor = isNotSet ? 'rgba(142, 142, 147, 0.2)' : `${option.color}20`;

  return {
    textTransform: 'uppercase',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    // "Not Set" has no lip, so it takes the lip's 2px as padding to keep the same height.
    pt: 0.75,
    pb: isNotSet ? '8px' : 0.75,
    px: 1.5,
    fontSize: 13,
    border: `1px ${borderStyle}`,
    borderBottom: `${isNotSet ? 1 : 3}px ${borderStyle}`,
    borderRadius: 0.8,
    bgcolor: 'white',
    whiteSpace: 'nowrap',
    color: option.color,
    borderColor: isNotSet ? '#D0D0D0' : option.color,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: isSelected
      ? `0px 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 2px ${ringColor}`
      : '0px 1px 3px rgba(0, 0, 0, 0.08)',
    '&:hover': { bgcolor: '#F5F5F5' },
  };
};

// Multi-select outreach status filter, matching the master list's: "Not Set" plus every status.
const OutreachFilterMenu = ({ anchorEl, onClose, selected, onToggle, onClear }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
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
          '& .MuiList-root': { display: 'flex', flexDirection: 'column', gap: 1, p: 0 },
        },
      },
    }}
  >
    {[NOT_SET_OPTION, ...OUTREACH_STATUS_OPTIONS].map((option) => {
      const isSelected = selected.includes(option.value);

      return (
        <Box
          key={option.value}
          onClick={() => onToggle(option.value)}
          sx={optionSx(option, isSelected)}
        >
          <Box component="span" sx={{ flex: 1, textAlign: 'center' }}>
            {option.label}
          </Box>
          {isSelected && (
            <Iconify icon="eva:checkmark-fill" width={16} sx={{ ml: 1, flexShrink: 0 }} />
          )}
        </Box>
      );
    })}

    {selected.length > 0 && (
      <Typography
        onClick={onClear}
        sx={{
          fontSize: 12,
          fontWeight: 500,
          color: '#637381',
          cursor: 'pointer',
          textAlign: 'center',
          mt: 0.5,
          '&:hover': { color: '#212B36', textDecoration: 'underline' },
        }}
      >
        Clear all
      </Typography>
    )}
  </Menu>
);

OutreachFilterMenu.propTypes = {
  anchorEl: PropTypes.object,
  onClose: PropTypes.func,
  selected: PropTypes.array,
  onToggle: PropTypes.func,
  onClear: PropTypes.func,
};

export default OutreachFilterMenu;
