import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import { getStatusChip } from '../utils';

const StatusDot = ({ status, size = 8 }) => (
  <Box
    component="span"
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: '50%',
      bgcolor: getStatusChip(status).color,
    }}
  />
);

export default StatusDot;

StatusDot.propTypes = {
  status: PropTypes.string,
  size: PropTypes.number,
};
