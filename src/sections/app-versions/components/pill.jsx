import PropTypes from 'prop-types';

import { Box, Stack } from '@mui/material';

import { COLORS } from '../utils';

// Small outlined status label; `color` adds a leading dot
export default function Pill({ color, children }) {
  return (
    <Stack
      component="span"
      direction="row"
      alignItems="center"
      spacing={0.6}
      sx={{
        px: 0.9,
        py: 0.2,
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        color: 'text.secondary',
      }}
    >
      {color && (
        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
      )}
      <span>{children}</span>
    </Stack>
  );
}

Pill.propTypes = { color: PropTypes.string, children: PropTypes.node };
