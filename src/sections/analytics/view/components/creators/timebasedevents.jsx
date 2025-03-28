import { Card, CardContent, Typography, Box } from '@mui/material';

export default function TimeBasedEvents() {
  // Example data: Time spent (in minutes) on different onboarding sections
  const onboardingData = [
    { section: 'Personal Info', time: 5 },
    { section: 'Profile Setup', time: 8 },
    { section: 'Payment Setup', time: 4 },
    { section: 'Final Review', time: 3 },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Time Spent on Onboarding
        </Typography>

        {onboardingData.map((item, index) => (
          <Box key={index} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 2, mb: 1 }}>
            <Typography variant="body1">{item.section}</Typography>
            <Typography variant="h6" color="primary">{item.time} min</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
