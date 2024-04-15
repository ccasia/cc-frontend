import React from 'react'
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useSettingsContext } from 'src/components/settings';
import { Button } from '@mui/material';

// ----------------------------------------------------------------------


function managerPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5  }}>
        <Box sx={{ pb: 5 ,display:'flex' ,justifyContent:'space-between' }}>
        <Typography variant="h4" gutterBottom>
          Manager Page
        </Typography>
        <Button>invite</Button>
        </Box>
      </Box>
    </Container>
  )
}

export default managerPage