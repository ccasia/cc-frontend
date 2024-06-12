import React from 'react';
import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

const CustomChip = ({ label, sx, color }) => (
  <Box
    sx={{
      bgcolor: (theme) => color || theme.palette.info.main,
      borderRadius: 1,
      px: 1.5,
      py: 0.1,
      color: 'whitesmoke',
      display: 'inline-flex',
      ...sx,
    }}
  >
    <Typography variant="caption">{label}</Typography>
  </Box>
);

export default CustomChip;

CustomChip.propTypes = {
  label: PropTypes.string,
  sx: PropTypes.object,
  color: PropTypes.string,
};
