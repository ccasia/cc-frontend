import { Card, CardContent, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts';

export default function CampaignParticipation() {
    const data = [
        { month: 'Jan', pitches: 150 },
        { month: 'Feb', pitches: 120 },
        { month: 'Mar', pitches: 300 },
        { month: 'Apr', pitches: 80 },
        { month: 'May', pitches: 90 },
      ];

      const CreatorCampaigndata = [
        { campaigns: '0', creators: 350 }, // 350 creators have 0 campaigns
        { campaigns: '1', creators: 200 },
        { campaigns: '2', creators: 500 },
        { campaigns: '3-4', creators: 300 },
        { campaigns: '5+', creators: 150 },
      ];

    return (
    
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Campaign Participation
        </Typography>
        {/* Bar Chart - Number of Campaigns per Creator */}
        <BarChart
          dataset={CreatorCampaigndata} // Correct dataset format
          xAxis={[{ scaleType: 'band', dataKey: 'campaigns' }]} // X-axis: Campaign count
          series={[{ dataKey: 'creators', label: 'Creators' }]} // Y-axis: Number of creators
          width={400}
          height={250}
        />
      </CardContent>
    </Card>
  );
}
