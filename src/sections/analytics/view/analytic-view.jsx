import { Helmet } from 'react-helmet-async';
import { Typography, Grid, Container } from '@mui/material';
import { useAuthContext } from 'src/auth/hooks';
import TotalCreators from './components/creators/totalcreators';
import ShortlistedCreators from './components/creators/shortlisted-creators';
import CampaignParticipation from './components/creators/campaign-participants';
import TotalPitches from './components/creators/total-pitches';

export default function AnalyticsView() {
  const { user } = useAuthContext();

  return (
    <>
      <Helmet>
        <title>Analytics</title>
      </Helmet>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Platform Analytics
        </Typography>

        <Grid container spacing={3}>
          {/* Total Creators Analytics */}
          <Grid item xs={12} md={6}>
            <TotalCreators />
          </Grid>

          {/* Shortlisted Creators */}
          <Grid item xs={12} md={6}>
            <ShortlistedCreators />
          </Grid>

          {/* Total Pitches */}
          <Grid item xs={12} md={6}>
            <TotalPitches />
          </Grid>

          {/* Campaign Participation */}
          <Grid item xs={12} md={6}>
            <CampaignParticipation />
          </Grid>
        </Grid> 
      </Container>
    </>
  );
}
