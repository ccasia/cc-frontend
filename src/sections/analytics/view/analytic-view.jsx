import { Helmet } from 'react-helmet-async';
import { Typography } from '@mui/material';
import { useAuthContext } from 'src/auth/hooks';

export default function AnalyticsView() {
  const { user } = useAuthContext();

  return (
    <>
      <Helmet>
        <title>Analytics</title>
      </Helmet>

      <Typography variant="h4">Welcome to the Analytics Page!</Typography>
    </>
  );
}
