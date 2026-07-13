import React from 'react';

import { Box, Card, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const ClientsTab = () => (
  <Card
    sx={{
      p: 6,
      borderRadius: 2,
      border: '1px solid #e5e7eb',
      boxShadow: 'none',
      textAlign: 'center',
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
      <Iconify icon="hugeicons:building-06" width={28} sx={{ color: '#9ca3af' }} />
    </Box>
    <Typography sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>Clients</Typography>
    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
      Coming soon.
    </Typography>
  </Card>
);

export default ClientsTab;
