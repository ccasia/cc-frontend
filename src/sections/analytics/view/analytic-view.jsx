import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { Tab, Box, Tabs, Grid, Container, Typography, CircularProgress } from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';

import CreatorSendDrafts from './components/creators/drafts';
import ApprovePitch from './components/admins/PitchAnalytics';
import TotalPitches from './components/creators/total-pitches';
import CreatorSendPosting from './components/creators/posting';
import TotalCreators from './components/creators/totalcreators';
import CreatorSendAgreement from './components/creators/agreements';
import PostingAnalytics from './components/admins/PostingAnalytics';
import ApproveDraftsAnalytics from './components/admins/DraftsAnalytics';
import ShortlistedCreators from './components/creators/shortlisted-creators';
import CampaignParticipation from './components/creators/campaign-participants';
import SendAgreementsAnalytics from './components/admins/SendAgreementsAnalytics';
import ApproveAgreementsAnalytics from './components/admins/ApproveAgreementsAnalytics';



export default function AnalyticsView() {
  const [activeTab, setActiveTab] = useState(0);

  // OPTIMIZED: Only fetch data for the active tab to reduce initial load time
  const shouldFetchCreatorData = activeTab === 0;

  // OPTIMIZED: Use SWR with caching - only fetch when needed
  const { data: creators, isLoading: creatorsLoading } = useSWR(
    shouldFetchCreatorData ? endpoints.creators.getCreators : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  const { data: users, isLoading: usersLoading } = useSWR(
    shouldFetchCreatorData ? endpoints.users.allusers : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  // OPTIMIZED: Memoize data to prevent unnecessary re-renders
  const creatorsData = useMemo(() => creators || [], [creators]);
  const usersData = useMemo(() => users || [], [users]);

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
            <>
             {creatorsLoading || usersLoading ? (
               <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                 <CircularProgress />
               </Box>
             ) : (
               <>
                 <Grid container spacing={3}>
                   {/* Total Creators Analytics */}
                   <Grid item xs={12} md={6}>
                     <TotalCreators creators={creatorsData} />
                   </Grid>

                   {/* Shortlisted Creators */}
                   <Grid item xs={12} md={6}>
                     <ShortlistedCreators creators={creatorsData} />
                   </Grid>

                   {/* Total Pitches */}
                   <Grid item xs={12} md={6}>
                     <TotalPitches users={usersData} />
                   </Grid>

                   {/* Campaign Participation */}
                   <Grid item xs={12} md={6} mb={2}>
                     <CampaignParticipation creators={creatorsData} />
                   </Grid>
                 </Grid>

                 <CreatorSendAgreement/>

                 <CreatorSendDrafts/>

                 <CreatorSendPosting/>
               </>
             )}
            </>
          )}

          {activeTab === 1 && (
            <>
              <ApprovePitch/>
              <SendAgreementsAnalytics/>
              <ApproveAgreementsAnalytics/>
              <ApproveDraftsAnalytics/>
              <PostingAnalytics/>
            </>
          )}
        </Box>
      </Container>
    </>
  );
}
