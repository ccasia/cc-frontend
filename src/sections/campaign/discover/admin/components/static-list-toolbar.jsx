import PropTypes from 'prop-types';

import { Box, Stack, Button, TextField, Typography, InputAdornment } from '@mui/material';

import Iconify from 'src/components/iconify';

// Look-alikes of the list toolbars (Creator Master List, Agreements) for loading frames.
// The real controls are static UI, so they show as-is; only the data under them loads.

const SEARCH_SX = {
  width: { xs: '100%', sm: 300 },
  flexShrink: 0,
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FFFFFF',
    border: '1.5px solid #e7e7e7',
    borderBottom: '3px solid #e7e7e7',
    borderRadius: 1.15,
    height: 44,
    fontSize: '0.85rem',
    '& fieldset': { border: 'none' },
  },
  '& .MuiOutlinedInput-input': {
    py: 1.25,
    px: 0,
    '&::placeholder': { color: '#637381', opacity: 1, fontWeight: 400 },
  },
};

const SORT_SX = {
  px: 1.5,
  py: 0.75,
  height: '42px',
  color: '#637381',
  fontWeight: 600,
  fontSize: '0.875rem',
  borderRadius: 1,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  alignSelf: { xs: 'flex-start', sm: 'center' },
};

const PILL_SX = {
  height: 34,
  minHeight: 34,
  padding: '8px 16px',
  gap: '4px',
  borderRadius: '100px',
  fontFamily: 'Inter Display, Inter, sans-serif',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '18px',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  minWidth: 'unset',
  flexShrink: 0,
  bgcolor: '#F5F5F5',
  color: '#231F20',
  '& .MuiButton-endIcon': { ml: 0, mr: 0 },
};

const letterSx = (weight) => ({ lineHeight: 1, fontSize: '10px', fontWeight: weight });

export function StaticToolbar({ sx, ...other }) {
  return <Stack aria-hidden sx={{ pointerEvents: 'none', ...sx }} {...other} />;
}

StaticToolbar.propTypes = { sx: PropTypes.object };

export function StaticSearchField() {
  return (
    <TextField
      placeholder="Search creators..."
      sx={SEARCH_SX}
      inputProps={{ tabIndex: -1, readOnly: true }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Iconify icon="eva:search-fill" width={18} sx={{ color: '#637381' }} />
          </InputAdornment>
        ),
      }}
    />
  );
}

export function StaticSortButton() {
  return (
    <Button
      tabIndex={-1}
      endIcon={
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Stack alignItems="center">
            <Typography variant="caption" sx={letterSx(700)}>
              A
            </Typography>
            <Typography variant="caption" sx={letterSx(400)}>
              Z
            </Typography>
          </Stack>
          <Iconify icon="eva:arrow-downward-fill" width={12} />
        </Stack>
      }
      sx={SORT_SX}
    >
      Alphabetical
    </Button>
  );
}

export function StaticFilterPill({ children, chevron = true }) {
  return (
    <Button
      tabIndex={-1}
      endIcon={chevron && <Iconify icon="eva:chevron-down-fill" width={20} />}
      sx={PILL_SX}
    >
      {children}
    </Button>
  );
}

StaticFilterPill.propTypes = { children: PropTypes.node, chevron: PropTypes.bool };

// A loading value inside otherwise real text, e.g. the count in "Unread notes · 3".
export function InlineBone({ width = 8, sx }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width,
        height: 12,
        ml: 0.5,
        borderRadius: 0.5,
        bgcolor: 'rgba(145, 158, 171, 0.2)',
        ...sx,
      }}
    />
  );
}

InlineBone.propTypes = { width: PropTypes.number, sx: PropTypes.object };
