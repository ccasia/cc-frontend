import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
} from '@mui/material';

const V3PitchActions = ({ pitch, onViewPitch }) => (
    <Button
      variant="outlined"
      size="small"
      onClick={() => onViewPitch(pitch)}
      sx={{
        cursor: 'pointer',
        px: 1.5,
        py: 2,
        border: '1px solid #e7e7e7',
        borderBottom: '3px solid #e7e7e7',
        borderRadius: 1,
        color: '#203ff5',
        fontSize: '0.85rem',
        fontWeight: 600,
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        textTransform: 'none',
        bgcolor: 'transparent',
        whiteSpace: 'nowrap',
        '&:hover': {
          bgcolor: 'rgba(32, 63, 245, 0.04)',
          border: '1px solid #e7e7e7',
          borderBottom: '3px solid #e7e7e7',
        },
      }}
    >
      View Pitch
    </Button>
  );

export default V3PitchActions;

V3PitchActions.propTypes = {
  pitch: PropTypes.object.isRequired,
  onViewPitch: PropTypes.func.isRequired,
}; 