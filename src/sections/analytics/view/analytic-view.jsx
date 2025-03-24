import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axiosInstance, {endpoints} from 'src/utils/axios';
import { Tab, Tabs, Typography, Grid, Container, CircularProgress, Box } from '@mui/material';
import { useAuthContext } from 'src/auth/hooks';

import TotalCreators from './components/creators/totalcreators';
import ShortlistedCreators from './components/creators/shortlisted-creators';
import CampaignParticipation from './components/creators/campaign-participants';
import TotalPitches from './components/creators/total-pitches';
import ApprovePitch from './components/admins/PitchAnalytics.jsx';
import SendAgreementsAnalytics from "./components/admins/SendAgreementsAnalytics.jsx";
import ApproveAgreementsAnalytics from "./components/admins/ApproveAgreementsAnalytics.jsx";
import ApproveDraftsAnalytics from "./components/admins/DraftsAnalytics";



export default function AnalyticsView() {
  const [creators, setCreators] = useState([]);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creatorsRes, usersRes, adminsRes] = await Promise.all([
          axiosInstance.get(endpoints.creators.getCreators),
          axiosInstance.get(endpoints.users.allusers),
          axiosInstance.get(endpoints.users.admins),
        ]);

        setCreators(creatorsRes.data);
        setUsers(usersRes.data);
        setAdmins(adminsRes.data)
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  console.log("users", users)
  console.log("admins", admins);

  // Show loading indicator while data is being fetched
  if (loading) return <CircularProgress />;
  return (
    <>
      <Helmet>
        <title>Analytics</title>
      </Helmet>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Platform Analytics
        </Typography>

        {/* Tabs for switching between Creators and Admin analytics */}
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Creators Analytics" />
          <Tab label="Admin Analytics" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Total Creators Analytics */}
              <Grid item xs={12} md={6}>
                <TotalCreators creators={creators} />
              </Grid>

              {/* Shortlisted Creators */}
              <Grid item xs={12} md={6}>
                <ShortlistedCreators creators={creators} />
              </Grid>

              {/* Total Pitches */}
              <Grid item xs={12} md={6}>
                <TotalPitches users={users} />
              </Grid>

              {/* Campaign Participation */}
              <Grid item xs={12} md={6}>
                <CampaignParticipation creators={creators} />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <>
              <Typography variant="h6">Admin Analytics Coming Soon...</Typography>
              <ApprovePitch/>
              <SendAgreementsAnalytics/>
              <ApproveAgreementsAnalytics/>
              <ApproveDraftsAnalytics/>
            </>
          
          )}
        </Box>
      </Container>
    </>
  );
}
