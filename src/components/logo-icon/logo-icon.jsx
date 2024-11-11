import React from 'react';
import PropTypes from 'prop-types';

import { Box, Avatar } from '@mui/material';

import Image from '../image';

const LogoIcon = ({ bg, icon, sx }) => (
  <Box
    component="div"
    sx={{
      position: 'relative',
      width: 55,
      height: 55,
      borderRadius: 10,
      ...sx,
    }}
  >
    <Image
      src={bg}
      alt="Background Image"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
      }}
    />
    <Avatar
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 40,
        height: 40,
      }}
      src={icon}
    />
  </Box>
);

export default LogoIcon;

LogoIcon.propTypes = {
  bg: PropTypes.string,
  icon: PropTypes.string,
  sx: PropTypes.object,
};
