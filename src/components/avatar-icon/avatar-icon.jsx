import React from 'react';
import PropTypes from 'prop-types';

import { Avatar } from '@mui/material';

import Iconify from '../iconify';

const AvatarIcon = ({ icon, size }) => (
  <Avatar
    sx={{
      p: 1.5,
      width: 60,
      height: 60,
      background: 'linear-gradient(180deg, rgba(19,64,255,1) 60%, rgba(255,255,255,1) 130%)',
      color: 'rgba(255, 255, 255, 0.9)',
    }}
  >
    <Iconify icon={icon} width={size || 40} />
  </Avatar>
);

export default AvatarIcon;

AvatarIcon.propTypes = {
  icon: PropTypes.string,
  size: PropTypes.number,
};
