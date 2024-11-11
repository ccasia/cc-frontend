import useSWR from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useCallback } from 'react';
 
import { Container, Stack, Typography, Button } from '@mui/material';
import Iconify from 'src/components/iconify';
 
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
 
import { fetcher, endpoints } from 'src/utils/axios';
 
import { useAuthContext } from 'src/auth/hooks';
 
import { LoadingScreen } from 'src/components/loading-screen';
 
import CampaignDetailItem from '../campaign-detail-item';
 
const ManageCampaignDetailView = ({ id }) => {
  const { user } = useAuthContext();
  const router = useRouter();
 
  const { data, isLoading } = useSWR(endpoints.campaign.creator.getCampaign(id), fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });
 
  // Check if user is shortlisted
  const checkIfUserIsShortlisted = useCallback(() => {
    if (data && !data.shortlisted.some((item) => item.userId === user?.id)) {
      router.back();
      enqueueSnackbar("You're not shortlisted in this campaign.", {
        variant: 'info',
      });
    }
  }, [user?.id, data, router]);
 
  // Run check when data or user changes
  useEffect(() => {
    if (data) {
      checkIfUserIsShortlisted();
    }
  }, [checkIfUserIsShortlisted, data]);
 
  return (
    <Container maxWidth="xl">
      <Stack spacing={1}>
        <Button
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
          onClick={() => router.push(paths.dashboard.campaign.creator.manage)}
          sx={{ 
            alignSelf: 'flex-start',
            color: '#636366'
          }}
        >
          Back
        </Button>
 
        <Stack direction="row" alignItems="center" spacing={2}>
          {data?.campaignBrief?.images?.[0] && (
            <img
              src={data.campaignBrief.images[0]}
              alt={data?.name}
              style={{
                width: 80,
                height: 44,
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                objectFit: 'cover',
              }}
            />
          )}
          <Typography 
            variant="h5" 
            sx={{ 
              fontFamily: 'Instrument Serif, serif',
              fontSize: { xs: '2rem', sm: '2.4rem' },
              fontWeight: 550
            }}
          >
            {data?.name || 'Campaign Detail'}
          </Typography>
        </Stack>
      </Stack>
      {!isLoading && data ? <CampaignDetailItem campaign={data} /> : <LoadingScreen />}
    </Container>
  );
};
 
export default ManageCampaignDetailView;
 
ManageCampaignDetailView.propTypes = {
  id: PropTypes.string,
};