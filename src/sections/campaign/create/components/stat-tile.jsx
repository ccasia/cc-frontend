import PropTypes from 'prop-types';

import { Box, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { FIELD_HEIGHT } from './field-styles';

// A read-only value in a grey box, sized like a field so it lines up with inputs.
// A bold number with a quiet unit reads as a figure, not as an input.
export default function StatTile({ icon, value, unit, warning }) {
  const tone = warning ? '#B76E00' : '#8E8E93';

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        height: FIELD_HEIGHT,
        px: 1.75,
        borderRadius: 1,
        cursor: 'default',
        bgcolor: warning ? '#FFF8E5' : '#F4F6F8',
      }}
    >
      <Iconify icon={icon} width={16} sx={{ flexShrink: 0, color: tone }} />
      <Typography noWrap sx={{ fontSize: 13, color: tone }}>
        <Box
          component="span"
          sx={{
            mr: 0.5,
            fontSize: 14,
            fontWeight: 600,
            color: warning ? '#B76E00' : '#231F20',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Box>
        {unit}
      </Typography>
    </Stack>
  );
}

StatTile.propTypes = {
  icon: PropTypes.string,
  value: PropTypes.node,
  unit: PropTypes.node,
  warning: PropTypes.bool,
};
