import useSWR from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useCallback } from 'react';

import { Box, Chip, Stack, Button, Container, Typography, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
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

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 'No end date';

    const end = new Date(endDate);
    const today = new Date();

    if (end < today) return 'Campaign Ended';

    const diffTime = Math.abs(end - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={1}>
        <Button
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
          onClick={() => router.push(paths.dashboard.campaign.creator.manage)}
          sx={{
            alignSelf: 'flex-start',
            color: '#636366',
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          Back
        </Button>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          width="100%"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            {data?.campaignBrief?.images?.[0] && (
              <img
                src={data.campaignBrief.images[0]}
                alt={data?.name}
                style={{
                  width: '100%',
                  maxWidth: 80,
                  height: 'auto',
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
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.4rem' },
                fontWeight: 550,
              }}
            >
              {data?.name || 'Campaign Detail'}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Stack alignItems="center" spacing={0}>
              <Typography
                variant="caption"
                sx={{
                  color: '#8e8e93',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                  letterSpacing: '0.5px',
                }}
              >
                ENDS IN:
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  color:
                    data?.campaignBrief?.endDate &&
                    new Date(data.campaignBrief.endDate) < new Date()
                      ? 'error.main'
                      : '#221f20',
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
              >
                {calculateDaysLeft(data?.campaignBrief?.endDate)}
              </Typography>
            </Stack>

            <Box
              sx={{
                height: 40,
                width: '1px',
                backgroundColor: '#e0e0e0',
                mx: 1.5,
              }}
            />

            <Chip
              icon={
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2, ml: -0.5 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={20}
                    thickness={7}
                    sx={{ color: 'grey.300' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={Math.min(Math.round(data?.totalCompletion), 100)}
                    size={20}
                    thickness={7}
                    sx={{
                      color: '#5abc6f',
                      position: 'absolute',
                      left: 0,
                      strokeLinecap: 'round',
                    }}
                  />
                </Box>
              }
              label={`${Math.min(Math.round(data?.totalCompletion), 100)}% COMPLETED`}
              sx={{
                backgroundColor: 'common.white',
                color: '#48484a',
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                borderRadius: '8px',
                height: '35px',
                border: '1px solid #ebebeb',
                borderBottom: '3px solid #ebebeb',
                '& .MuiChip-label': {
                  padding: '0 8px 0 12px',
                },
                '&:hover': {
                  backgroundColor: 'common.white',
                },
              }}
            />
          </Stack>
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
