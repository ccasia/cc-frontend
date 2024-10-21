import React from 'react';

import { Box, Typography } from '@mui/material';

import Image from 'src/components/image';

const MyTasks = () => (
  <Box
    sx={{
      position: 'absolute',
      left: '60%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }}
  >
    <Image src="/assets/development.svg" width={500} />

    <Typography textAlign="center" variant="h5" mt={2}>
      In Development
    </Typography>
  </Box>
);

export default MyTasks;
