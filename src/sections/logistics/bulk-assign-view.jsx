import { Box, Button, Typography } from '@mui/material';

export default function BulkAssignView({ onBack }) {
  return (
    <Box sx={{ p: 3, border: '1px dashed grey', borderRadius: 2 }}>
      <Typography variant="h4">Bulk Assign</Typography>
      <Typography sx={{ md: 2 }}>Create/Assign UI</Typography>
      <Button variant="outlined" onClick={onBack}>
        Back to List
      </Button>
    </Box>
  );
}
