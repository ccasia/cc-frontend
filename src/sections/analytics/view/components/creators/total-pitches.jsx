import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts';

export default function TotalPitches() {
    
    
      const activeCreatorsWithoutCampaigns = 180; 
    
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Creator Pitches
            </Typography>
    
           <Typography> Will be  total pitches made in platform. 
            then totat no. 
            of creators who made pitch and lastly creators who have not made any pitches </Typography>
           
          </CardContent>

          <CardContent>

      

        <Box mt={3} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="h6">Active Creators Not in Any Campaigns</Typography>
          <Typography variant="h4" color="primary">
            {activeCreatorsWithoutCampaigns}
          </Typography>
        </Box>
      </CardContent>
        </Card>
    
  );
}
