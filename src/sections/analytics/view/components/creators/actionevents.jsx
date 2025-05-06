import { Box, Card, Typography, CardContent } from '@mui/material';

export default function ActionEvents() {
  // Example data: Frequency of notification openings per week
  const notificationData = [
    { label: 'Daily Openers', count: 120 },
    { label: 'Weekly Openers', count: 300 },
    { label: 'Rare Openers (Monthly)', count: 50 },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Engagement
        </Typography>

        {notificationData.map((item, index) => (
          <Box key={index} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 2, mb: 1 }}>
            <Typography variant="body1">{item.label}</Typography>
            <Typography variant="h6" color="primary">{item.count} creators</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
