import React from 'react';

import { Box, TextField } from '@mui/material';

import Iconify from 'src/components/iconify';
import { alpha } from '@mui/system';

const CreatorSubmissionsToolbar = () => (
  <Box>
    <TextField
      size="small"
      placeholder="Search creators..."
      InputProps={{
        startAdornment: <Iconify icon="bi:search" sx={{ mr: 1.5, color: 'grey' }} />,
        sx: {
          width: 280,
          height: 40,
          '& .MuiOutlinedInput-notchedOutline': {
            border: '1.5px solid rgba(231, 231, 231, 1)',
          },
          boxShadow: '0px -3px 0px 0px rgba(231, 231, 231, 1) inset',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (theme) => theme.palette.divider,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: 1.5,
            borderColor: alpha('#1304FF', 0.7),
            boxShadow: '0 0 0 3px #EDEBFF',
          },
        },
      }}
      InputLabelProps={{
        shrink: true,
      }}
    />
  </Box>
);

export default CreatorSubmissionsToolbar;
