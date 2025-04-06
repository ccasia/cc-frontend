/* eslint-disable react/prop-types */

import PropTypes from "prop-types";

import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import { PieChart } from "@mui/x-charts";

export default function CampaignParticipation({ creators }) {
  const campaignCounts = {
    "0": 0,
    "1": 0,
    "2": 0,
    "3-4": 0,
    "5+": 0,
    "10+": 0,
    "50+": 0,
    "100+": 0,
  };

  creators.forEach((creator) => {
    const numCampaigns = creator.shortlisted?.length || 0;

    if (numCampaigns === 0) campaignCounts["0"] += 1;
    else if (numCampaigns === 1) campaignCounts["1"] += 1;
    else if (numCampaigns === 2) campaignCounts["2"] += 1;
    else if (numCampaigns >= 3 && numCampaigns <= 4) campaignCounts["3-4"] += 1;
    else if (numCampaigns >= 5 && numCampaigns <= 9) campaignCounts["5+"] += 1;
    else if (numCampaigns >= 10 && numCampaigns <= 49) campaignCounts["10+"] += 1;
    else if (numCampaigns >= 50 && numCampaigns <= 99) campaignCounts["50+"] += 1;
    else campaignCounts["100+"] += 1;
  });

  const dataForChart = Object.entries(campaignCounts)
    .filter(([_, count]) => count > 0) // Remove empty categories
    .map(([label, value], index) => ({
      id: index + 1,
      label,
      value,
    }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h3" gutterBottom 
        style={{ fontFamily: 'Instrument Serif', fontWeight: 550 }}
        >
          Campaign Participation Overview
        </Typography>

        {/* Stat Cards */}
      <Grid
        marginTop={2}
        container
        spacing={2}
        justifyContent="center" // Center items horizontally
        alignItems="center" // Center items vertically
      >
        {Object.entries(campaignCounts).map(([label, count]) => (
          <Grid item xs={12} sm={6} md={6} key={label}> 
            <Box
              sx={{
                p: 3,
                backgroundColor: "#f5f5f5",
                borderRadius: 2,
                width: "100%", 
                maxWidth: "500px", 
                margin: "auto", 
                boxShadow: 2, 
              }}
            >
              <Typography textAlign="start" variant="subtitle1" fontWeight="bold">
               In {label} Campaigns
              </Typography>
              <Typography  textAlign= "center" variant="h4" color="primary">
                {count}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      </CardContent>
    </Card>
  );
}

// ShortlistedCreators.propTypes = {
//   creators: PropTypes.arrayOf(
//     PropTypes.shape({
//       shortlisted: PropTypes.array.isRequired, // Ensures 'shortlisted' is an array
//     })
//   ).isRequired, // Ensures 'creators' is an array and required
// };