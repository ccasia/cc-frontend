import { Card, CardContent, Typography } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import axiosInstance from 'src/utils/axios';

export default function TotalCreators() {
 
 
    return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Total Creators on Platform
        </Typography>

        {/* Line Graph - Filter by Age Range */}
        <LineChart
          width={400}
          height={200}
          series={[{ data: [10, 50, 80, 120, 150], label: 'Creators by Age' }]}
          xAxis={[{ scaleType: 'point', data: ['18-24', '25-34', '35-44', '45-54', '55+'] }]}
        />

        {/* Pie Chart - Gender Distribution */}
        <PieChart
          series={[
            { data: [{ id: 1, value: 60, label: 'Male' }, { id: 2, value: 40, label: 'Female' }] }
          ]}
          width={300}
          height={200}
        />
      </CardContent>
    </Card>
  );
}
