import PropTypes from "prop-types";

import {  Box,  Card, Typography, CardContent  } from '@mui/material';

export default function TotalPitches({ users }) {


  // Filter only creators
  const creators = users.filter(user => user.role === "creator");

  console.log("creators", creators)
  // Total pitches made in the platform
  const totalPitches = creators.reduce((acc, creator) => acc + (creator.pitch ? creator.pitch.length : 0), 0);

  // Count creators who have made at least one pitch
  const creatorsWithPitches = creators.filter(creator => creator.pitch && creator.pitch.length > 0).length;

  // Count creators who have not made any pitches
  const creatorsWithoutPitches = creators.length - creatorsWithPitches;

  // Count pitch types ('text' and 'video')
  const pitchCounts = { text: 0, video: 0 };

  creators.forEach((creator) => {
    if (creator.pitch) {
      creator.pitch.forEach((p) => {
        if (p.type === "text") {
          pitchCounts.text += 1;
        } else if (p.type === "video") {
          pitchCounts.video += 1;
        }
      });
    }
  });

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

        {/* Pitch Type Breakdown */}
        <Box p={2} sx={{ backgroundColor: "#e3f2fd", borderRadius: 2, width: "100%", mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Text Pitches</Typography>
            <Typography variant="h4" color="info">
              {pitchCounts.text}
            </Typography>
          </Box>
        </Box>

        <Box p={2} sx={{ backgroundColor: "#ede7f6", borderRadius: 2, width: "100%", mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Video Pitches</Typography>
            <Typography variant="h4" color="secondary">
              {pitchCounts.video}
            </Typography>
          </Box>
        </Box>
      </CardContent>

    </Card>

  );
}


TotalPitches.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.string.isRequired,
      pitch: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string,
        })
      ),
    })
  ).isRequired,
};