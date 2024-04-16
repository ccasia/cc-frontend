/* eslint-disable react/prop-types */
import React from 'react';

import { Box, Alert } from '@mui/material';

const Alerted = ({ message }) => (
  <Box
    position="absolute"
    top={10}
    left="50%"
    zIndex={10000}
    sx={{
      transform: 'translateX(-50%)',
    }}
  >
    <Alert severity="success">{message}</Alert>
  </Box>
);

export default Alerted;
