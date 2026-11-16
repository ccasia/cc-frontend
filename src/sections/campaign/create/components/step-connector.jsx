import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import { EASE_IN_OUT } from './motion';

export default function StepConnector({ filled, hidden }) {
  return (
    <Box
      aria-hidden
      sx={{
        visibility: hidden ? 'hidden' : 'visible',
        position: 'relative',
        zIndex: 1,
        height: 2,
        borderRadius: 1,
        overflow: 'hidden',
        flexGrow: 1,
        minWidth: { sm: 8, md: 12, lg: 20 },
        maxWidth: { sm: 16, md: 28, lg: 40 },
        bgcolor: '#E7E7E7',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          bgcolor: '#1340FF',
          transformOrigin: 'left',
          transform: filled ? 'scaleX(1)' : 'scaleX(0)',
          transition: `transform 250ms ${EASE_IN_OUT}`,
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
      }}
    />
  );
}

StepConnector.propTypes = {
  filled: PropTypes.bool,
  hidden: PropTypes.bool,
};
