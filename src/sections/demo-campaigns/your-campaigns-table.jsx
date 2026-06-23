import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------
// Static, empty-state "Your Campaigns" table shown to demo clients.
// Header + empty message + non-functional demo pagination.

const COLUMNS = ['Campaign Name', 'Start Date', 'End Date', 'Status'];

const HEADER_CELL_SX = {
  flex: 1,
  px: 1.75,
  py: 1,
  color: '#1340FF',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '16px',
};

export default function YourCampaignsTable() {
  return (
    <Stack sx={{ width: '100%' }} spacing={0.5}>
      <Box sx={{ minHeight: 266, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#F5F5F5',
            borderRadius: '8px',
          }}
        >
          {COLUMNS.map((column) => (
            <Typography key={column} sx={HEADER_CELL_SX}>
              {column}
            </Typography>
          ))}
        </Box>

        {/* Empty state */}
        <Box sx={{ px: 1.75, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 16, fontWeight: 500, lineHeight: '20px' }}>
            <Box component="span" sx={{ color: '#0062CD' }}>
              Create a campaign
            </Box>{' '}
            <Box component="span" sx={{ color: '#636366' }}>
              to display information
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* Demo pagination (non-functional) */}
      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1.25}>
        <Iconify icon="eva:chevron-left-fill" width={24} sx={{ color: '#231F20' }} />
        <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#000000' }}>1</Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 400, color: '#8E8E93' }}>2</Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 400, color: '#8E8E93' }}>3</Typography>
        <Iconify icon="eva:chevron-right-fill" width={24} sx={{ color: '#231F20' }} />
      </Stack>
    </Stack>
  );
}
