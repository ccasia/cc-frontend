import PropTypes from 'prop-types';

import { Box, Stack } from '@mui/material';

import Iconify from 'src/components/iconify';

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

export const getFilterPillSx = (isActive) => ({
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

export function FilterPillEndIcons({ isActive, isOpen, onClear, clearLabel }) {
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
