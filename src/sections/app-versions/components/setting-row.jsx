import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import { COLORS } from '../utils';

// Label and description on the left, value or control on the right
export default function SettingRow({ label, description, children, controlWidth = 300 }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: `minmax(0, 1fr) minmax(0, ${controlWidth}px)` },
        gap: { xs: 1.5, sm: 4 },
        alignItems: 'start',
        py: 2.25,
        '&:not(:last-of-type)': { borderBottom: `1px solid ${COLORS.border}` },
      }}
    >
      <Box sx={{ pt: 0.25 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{label}</Typography>
        <Box sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
          {description}
        </Box>
      </Box>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

SettingRow.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.node,
  children: PropTypes.node,
  controlWidth: PropTypes.number,
};
