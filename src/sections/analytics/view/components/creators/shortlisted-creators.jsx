import { Card, CardContent, Typography } from '@mui/material';
import { PieChart } from '@mui/x-charts';

export default function ShortlistedCreators() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Shortlisted Creators
        </Typography>

        {/* Pie Chart - Shortlisted vs. Not Shortlisted */}
        <PieChart
          series={[
            { 
              data: [
                { id: 1, value: 300, label: 'Shortlisted' },
                { id: 2, value: 700, label: 'Not Shortlisted' }
              ] 
            }
          ]}
          width={300}
          height={200}
        />
      </CardContent>
    </Card>
  );
}
