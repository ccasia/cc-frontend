import useSWR from 'swr';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  Stack,
  Button,
  useTheme,
  Container,
  Typography,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data, isLoading } = useSWR(endpoints.campaign.creator.getCampaign(id), fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  // Check if user is shortlisted
  const checkIfUserIsShortlisted = useCallback(() => {
    if (data && !data?.shortlisted?.some((item) => item?.userId === user?.id)) {
      router.back();
      enqueueSnackbar("You're not shortlisted in this campaign.", {
        variant: 'info',
      });
    }
  }, [user?.id, data, router]);

  // Run check when data or user changes
  useEffect(() => {
    if (!isLoading && data) {
      checkIfUserIsShortlisted();
    }
  }, [checkIfUserIsShortlisted, data, isLoading]);

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 'No end date';

    const end = new Date(endDate);
    const today = new Date();

    if (end < today) return 'Campaign Ended';

    const diffTime = Math.abs(end - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const renderCampaignPeriod = () => {
    const startDate = data?.campaignBrief?.startDate;
    const endDate = data?.campaignBrief?.endDate;

    if (!startDate || !endDate) {
      return 'Date not available';
    }

    try {
      const start = new Date(startDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        ...(isMobile ? {} : { year: 'numeric' })
      });
      const end = new Date(endDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return `${start} - ${end}`;
    } catch (error) {
      return 'Invalid date format';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
      <Stack spacing={1}>
        <Button
          size="small"
          startIcon={<Iconify icon="ic:round-arrow-back-ios-new" />}
          sx={{
            color: 'rgba(99, 99, 102, 1)',
            minWidth: 'auto',
            px: { xs: 0.75, sm: 1 },
            py: { xs: 0.25, sm: 0.5 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            borderRadius: 1,
            transition: 'all 0.2s ease',
            alignSelf: 'flex-start',
            mb: { xs: 1, sm: 0, md: 1 },
            ml: { xs: 0, sm: 0 },
            mt: { xs: 1, sm: 0, md: 1 },
            '&:hover': {
              bgcolor: 'rgba(99, 99, 102, 0.08)',
              transform: 'translateX(-2px)',
            },
          }}
          onClick={() => router.push(paths.dashboard.campaign.creator.manage)}
        >
          Back
        </Button>

        {/* Mobile Optimized Campaign Header */}
        {isMobile ? (
          <Stack spacing={2}>
            {/* Mobile: Image and Title Row */}
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              {data?.campaignBrief?.images?.[0] && (
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={data?.campaignBrief?.images[0]}
                    alt={data?.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: '1.5rem',
                    fontWeight: 550,
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                >
                  {data?.name || 'Campaign Detail'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#636366',
                    fontSize: '0.875rem',
                    mb: 1,
                  }}
                >
                  {data?.company?.name}
                </Typography>
                
                {/* Ends in - Below campaign name */}
                <Chip
                  label={`Ends in ${calculateDaysLeft(data?.campaignBrief?.endDate)}`}
                  sx={{
                    backgroundColor: 'common.white',
                    color: data?.campaignBrief?.endDate && new Date(data?.campaignBrief?.endDate) < new Date() 
                      ? 'error.main' 
                      : '#48484a',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: '28px',
                    border: '1px solid #ebebeb',
                    borderBottom: '2px solid #ebebeb',
                    '&:hover': {
                      backgroundColor: 'common.white',
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Mobile: Stats Row */}
            <Stack 
              direction="row" 
              alignItems="center" 
              justifyContent="space-between"
              sx={{
                bgcolor: '#f8f9fa',
                borderRadius: 1.5,
                p: 2,
                border: '1px solid #e7e7e7',
              }}
            >
              {/* Campaign Period */}
              <Stack alignItems="flex-start" spacing={0.25}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#8e8e93',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  CAMPAIGN PERIOD
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#221f20',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    lineHeight: 1.2,
                  }}
                >
                  {renderCampaignPeriod()}
                </Typography>
              </Stack>

              {/* Completion Rate */}
              <Stack alignItems="flex-end" spacing={0.25}>
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
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: '28px',
                    border: '1px solid #ebebeb',
                    borderBottom: '2px solid #ebebeb',
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
        ) : (
          /* Desktop Layout */
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            width="100%"
          >
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={2}
              width="auto"
            >
              {data?.campaignBrief?.images?.[0] && (
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                  }}
                >
                  <img
                    src={data?.campaignBrief?.images[0]}
                    alt={data?.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '12px',
                      border: '1px solid #e0e0e0',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              )}
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { sm: '2rem', md: '2.4rem' },
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
                    fontSize: '0.9rem',
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
                      new Date(data?.campaignBrief?.endDate) < new Date()
                        ? 'error.main'
                        : '#221f20',
                    fontWeight: 500,
                    fontSize: '1rem',
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
                  fontSize: '0.875rem',
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
        )}
      </Stack>

      {!isLoading && data ? <CampaignDetailItem campaign={data} /> : <LoadingScreen />}
    </Container>
  );
};

export default ManageCampaignDetailView;

ManageCampaignDetailView.propTypes = {
  id: PropTypes.string,
};
