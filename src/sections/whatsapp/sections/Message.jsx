import React from 'react';

import { Typography } from '@mui/material';

import BoxMotion from '../components/BoxMotion';

const Message = () => {
  console.log('ASda');
  return (
    <BoxMotion
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut',
      }}
      sx={{ mt: 2 }}
    >
      <Typography>Message</Typography>
    </BoxMotion>
  );
};

export default Message;
