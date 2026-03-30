import React, { useState } from 'react';

import { Box, Stack, Switch, Divider, TextField, ListItemText } from '@mui/material';

import BoxMotion from '../components/BoxMotion';

const Setting = () => {
  const [isActive, setIsActive] = useState(false);
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
      <Stack>
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <ListItemText
              primary="Activate authentication code"
              secondary="Activate this feature to allow sending authentication code via whatsapp"
            />
            <Switch onChange={(_, val) => setIsActive(val)} />
          </Stack>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box>
          <TextField rows={3} multiline fullWidth placeholder="Access Token" disabled={!isActive} />
        </Box>
      </Stack>
    </BoxMotion>
  );
};

export default Setting;
