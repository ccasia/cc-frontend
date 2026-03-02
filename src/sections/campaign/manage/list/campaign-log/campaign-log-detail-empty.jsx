import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

// ---------------------------------------------------------------------------

export default function CampaignLogDetailEmpty() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        px: 3,
      }}
    >
      <Iconify
        icon="solar:document-text-linear"
        width={48}
        sx={{ color: '#c7c7cc', mb: 2 }}
      />

      <Typography
        sx={{
          fontFamily: 'fontSecondaryFamily',
          fontSize: 20,
          fontWeight: 400,
          color: '#8e8e93',
          mb: 0.5,
        }}
      >
        Select a log entry
      </Typography>

      <Typography variant="body2" sx={{ color: '#c7c7cc', textAlign: 'center' }}>
        Click on any activity to see details
      </Typography>
    </Box>
  );
}
