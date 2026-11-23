import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import { formatCount } from './use-metrics-review';

const COLORS = { down: '#D4321C', up: '#118D57' };

// Matches the big numbers on the creator rows.
export const NUMBER_FONT_SX = { fontFamily: 'Instrument Serif, serif', fontWeight: 400 };

const changeDirection = (value, current) => {
  if (typeof value !== 'number' || typeof current !== 'number' || value === current) return null;
  return value > current ? 'up' : 'down';
};

/** The new number: red when it dropped, green when it rose. */
export default function NewNumber({ value, current, sx }) {
  const direction = changeDirection(value, current);

  return (
    <Box
      component="span"
      sx={{
        ...NUMBER_FONT_SX,
        color: direction ? COLORS[direction] : '#231F20',
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      {formatCount(value)}
    </Box>
  );
}

NewNumber.propTypes = {
  value: PropTypes.number,
  current: PropTypes.number,
  sx: PropTypes.object,
};
