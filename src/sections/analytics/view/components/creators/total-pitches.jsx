import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts';

export default function TotalPitches({ users }) {
  // Filter only creators
  const creators = users.filter(user => user.role === "creator");

  // Total pitches made in the platform
  const totalPitches = creators.reduce((acc, creator) => acc + (creator.pitch ? creator.pitch.length : 0), 0);

  // Count creators who have made at least one pitch
  const creatorsWithPitches = creators.filter(creator => creator.pitch && creator.pitch.length > 0).length;

  // Count creators who have not made any pitches
  const creatorsWithoutPitches = creators.length - creatorsWithPitches;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
        Creator Pitches
        </Typography>
      </CardContent>

      <CardContent>
  {/* Total Pitches Made */}
  <Box p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 2, width: '100%' }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h6">Total Pitches Made</Typography>
      <Typography variant="h4" color="primary">
        {totalPitches}
      </Typography>
    </Box>
  </Box>

  {/* Creators Who Have Made a Pitch */}
  <Box p={2} sx={{ backgroundColor: '#e8f5e9', borderRadius: 2, width: '100%', mt: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h6">Creators Who Made a Pitch</Typography>
      <Typography variant="h4" color="secondary">
        {creatorsWithPitches}
      </Typography>
    </Box>
  </Box>

  {/* Creators Who Have Not Made Any Pitches */}
  <Box p={2} sx={{ backgroundColor: '#ffebee', borderRadius: 2, width: '100%', mt: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h6">Creators Without a Pitch</Typography>
      <Typography variant="h4" color="error">
        {creatorsWithoutPitches}
      </Typography>
    </Box>
  </Box>
</CardContent>

    </Card>
    
  );
}
