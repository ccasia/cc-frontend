import React from 'react';
import PropTypes from 'prop-types';

import { Box, Typography, CircularProgress } from '@mui/material';

const configs = {
  saving: {
    color: '#10B981',
    title: 'Saving Changes',
    description: 'Your edits are being saved...',
  },
  loading: {
    color: '#1340FF',
    title: 'Loading Post Campaign Report',
    description: 'Please wait while we prepare your data...',
  },
};

/**
 * @param {Object} props
 * @param {'saving' | 'loading'} props.type
 */
const Overlay = ({ type }) => (
  <Box
    className="hide-in-pdf"
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      bgcolor: 'rgba(255, 255, 255, 0.95)',
      zIndex: 9999,
      borderRadius: '12px',
      backdropFilter: 'blur(4px)',
    }}
  >
    <CircularProgress size={60} thickness={4} sx={{ color: configs[type].color, mb: 3 }} />
    <Typography
      sx={{
        fontFamily: 'Inter Display',
        fontWeight: 600,
        fontSize: '18px',
        color: '#231F20',
        mb: 1,
      }}
    >
      {configs[type].title}
    </Typography>
    <Typography
      sx={{
        fontFamily: 'Aileron',
        fontWeight: 400,
        fontSize: '14px',
        color: '#636366',
      }}
    >
      {configs[type].description}
    </Typography>
  </Box>
);

export default Overlay;

Overlay.propTypes = {
  type: PropTypes.oneOf(['saving', 'loading']).isRequired,
};
