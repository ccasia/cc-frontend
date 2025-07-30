import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import useGetV3Pitches from 'src/hooks/use-get-v3-pitches';

const V3PitchesTest = ({ campaignId }) => {
  const { pitches, isLoading, isError, mutate } = useGetV3Pitches(campaignId);

  if (isLoading) {
    return <Typography>Loading V3 pitches...</Typography>;
  }

  if (isError) {
    return <Typography color="error">Error loading V3 pitches</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6">V3 Pitches Test</Typography>
      <Typography>Campaign ID: {campaignId}</Typography>
      <Typography>Number of pitches: {pitches.length}</Typography>
      
      <Button onClick={() => mutate()}>Refresh</Button>
      
      {pitches.map((pitch) => (
        <Box key={pitch.id} sx={{ mb: 2, p: 2, border: '1px solid #ccc' }}>
          <Typography><strong>Pitch ID:</strong> {pitch.id}</Typography>
          <Typography><strong>Creator:</strong> {pitch.user?.name}</Typography>
          <Typography><strong>Status:</strong> {pitch.status}</Typography>
          <Typography><strong>Display Status:</strong> {pitch.displayStatus || 'N/A'}</Typography>
          <Typography><strong>Type:</strong> {pitch.type}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default V3PitchesTest; 