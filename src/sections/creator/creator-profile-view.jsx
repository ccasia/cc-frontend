import React, { useState } from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { alpha } from '@mui/material/styles';
import {
  Box,
  Grid,
  Stack,
  Avatar,
  Button,
  Divider,
  Tooltip,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useGetMyCampaign } from 'src/hooks/use-get-my-campaign';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import toast from 'react-hot-toast';
import { LoadingButton } from '@mui/lab';

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: 3,
  height: 'auto',
  width: '100%',
  '& .header': {
    borderBottom: '1px solid #e0e0e0',
    mx: -3,
    mt: -1,
    mb: 2,
    pb: 1.5,
    pt: -1,
    px: 1.8,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
};

const CreatorProfileView = ({ id }) => {
  const { data, isLoading } = useGetCreatorById(id);
  const { data: campaigns = [] } = useGetMyCampaign(id);
  const { initialize } = useAuthContext();
  const router = useRouter();

  const [isLoadingImpersonation, setIsLoading] = useState(false);

  // Calculate total UGC videos from campaigns
  const ugcCredits = React.useMemo(() => {
    // Calculate total from all campaigns
    const totalFromCampaigns = campaigns.reduce((total, campaign) => {
      // Check if the shortlisted object belongs to this user
      const isUserShortlisted = campaign.shortlisted?.userId === id;

      // Get ugcVideos from the shortlisted object if it belongs to this user
      const creditsForThisCampaign = isUserShortlisted ? campaign.shortlisted?.ugcVideos || 0 : 0;

      return total + creditsForThisCampaign;
    }, 0);

    return totalFromCampaigns;
  }, [campaigns, id]);

  const impersonateCreator = async (userId) => {
    try {
      setIsLoading(true);
      await axiosInstance.post('/api/admin/impersonate-creator', { userId });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      initialize();
    } catch (error) {
      console.log(error);
      toast.error('Failed to impersonate');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const groupsSetup = {
    approved: [],
    pending: [],
    rejected: [],
    past: [],
  };

  const groupedCampaigns = campaigns.reduce((groups, campaign) => {
    const pitchStatus = campaign.pitch?.status;
    const isUserShortlisted = campaign.shortlisted?.userId === id;
    const campaignStatus = campaign.status;

    // include retrospective campaigns that have not pitch when shortlisted
    if (!pitchStatus && isUserShortlisted) {
      if (campaignStatus === 'COMPLETED') {
        groups.past.push(campaign);
      } else {
        groups.approved.push(campaign);
      }
    }

    if (pitchStatus === 'PENDING_REVIEW' || pitchStatus === 'SENT_TO_CLIENT') {
      groups.pending.push(campaign);
    } else if (pitchStatus === 'REJECTED') {
      groups.rejected.push(campaign);
    } else if (pitchStatus === 'APPROVED') {
      if (campaignStatus === 'COMPLETED') {
        groups.past.push(campaign);
      } else {
        groups.approved.push(campaign);
      }
    }
    return groups;
  }, groupsSetup);

  const {
    approved: approvedCampaigns,
    pending: pendingCampaigns,
    rejected: rejectedCampaigns,
    past: pastCampaigns,
  } = groupedCampaigns;

  return (
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 2, sm: 5 },
      }}
    >
      {/* Back button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
          onClick={() => router.back()}
          sx={{
            alignSelf: 'flex-start',
            color: '#636366',
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          Back
        </Button>
        {data.user.status === 'active' && (
          <LoadingButton
            variant="outlined"
            startIcon={<Iconify icon="solar:user-linear" width={20} />}
            onClick={() => impersonateCreator(id)}
            sx={{
              alignSelf: 'flex-start',
              color: '#636366',
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
            loading={isLoadingImpersonation}
          >
            Impersonate creator
          </LoadingButton>
        )}
      </Box>

      {/* Profile Info section */}
      <Box sx={{ p: 3, mb: -2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Avatar
            alt={data?.user?.name}
            src={data?.user?.photoURL}
            sx={{
              width: 48,
              height: 48,
              ml: -2,
              border: '1px solid #e7e7e7',
            }}
          >
            {data?.user?.name?.charAt(0).toUpperCase()}
          </Avatar>

          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Instrument Serif',
              flex: 1,
              ml: 2,
              fontWeight: 580,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {`${data?.user?.name?.charAt(0).toUpperCase()}${data?.user?.name?.slice(1)}`}
            <Box
              component="img"
              src="/assets/icons/overview/creatorVerified.svg"
              sx={{
                width: 20,
                height: 20,
                ml: 0.5,
              }}
            />
          </Typography>
        </Stack>
      </Box>

      {/* Main content grid */}
      <Grid container spacing={3}>
        {/* Left column - Campaign Information */}
        <Grid item xs={12} md={7}>
          <Box sx={BoxStyle}>
            <Box className="header">
              <img
                src="/assets/icons/overview/bluesmileyface.svg"
                alt="Campaign Info"
                style={{
                  width: 20,
                  height: 20,
                  color: '#203ff5',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Campaign Information
              </Typography>
            </Box>
            {/* Creator Information Box */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: { xs: 2, sm: 2, md: 2, lg: 2 },
              }}
            >
              {[
                {
                  label: 'Pronouns',
                  value: data?.user?.creator?.pronounce,
                  fallback: 'Not specified',
                },
                {
                  label: 'Email',
                  value: data?.user?.email,
                  fallback: 'Not specified',
                },
                {
                  label: 'Phone',
                  value: data?.user?.phoneNumber,
                  fallback: 'Not specified',
                },
                {
                  label: 'Location',
                  value: data?.user?.creator?.country || data?.user?.country,
                  fallback: 'Not specified',
                },
              ].map((item) => (
                <Box key={item.label}>
                  <Typography
                    variant="subtitle2"
                    color="#8e8e93"
                    sx={{ fontWeight: 600, display: 'block' }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      whiteSpace: 'normal',
                      display: 'block',
                    }}
                  >
                    {item.value || item.fallback}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography
                variant="subtitle2"
                color="#8e8e93"
                sx={{
                  fontWeight: 600,
                  display: 'block',
                  mb: 1,
                  mt: -1,
                  fontSize: '0.875rem',
                }}
              >
                Interests
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {data?.user?.creator?.interests?.length > 0 ? (
                  [
                    ...new Set(data?.user?.creator?.interests?.map((interest) => interest.name)),
                  ].map((name) => (
                    <Box
                      key={name}
                      component="span"
                      sx={{
                        display: 'inline-block',
                        color: '#8e8e93',
                        border: '1px solid #ebebeb',
                        borderBottom: '3px solid #ebebeb',
                        fontWeight: 600,
                        px: 1,
                        py: 0.5,
                        borderRadius: 0.8,
                        mr: 0.5,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        fontSize: '0.8rem',
                      }}
                    >
                      {name}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Not specified
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Payment Information Box */}
          <Box sx={{ ...BoxStyle, mt: 3 }}>
            <Box className="header">
              <img
                src="/assets/icons/overview/vector.svg"
                alt="Payment Info"
                style={{
                  width: 20,
                  height: 20,
                  color: '#203ff5',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Payment Information
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: { xs: 2, sm: 2, md: 2, lg: 2 },
              }}
            >
              {[
                {
                  label: 'Account Name',
                  value: data?.user?.paymentForm?.bankAccountName || 'N/A',
                },
                {
                  label: 'Bank Name',
                  value: data?.user?.paymentForm?.bankName || 'N/A',
                },
                {
                  label: 'Account Number',
                  value: data?.user?.paymentForm?.bankAccountNumber || 'N/A',
                },
                {
                  label: 'IC/Passport Number',
                  value: data?.user?.paymentForm?.icNumber || 'N/A',
                },
              ].map((item) => (
                <Box key={item.label}>
                  <Typography
                    variant="subtitle2"
                    color="#8e8e93"
                    sx={{ fontWeight: 600, display: 'block' }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      whiteSpace: 'normal',
                      display: 'block',
                      mt: 0.5,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Social Media Box */}
          <Box sx={{ ...BoxStyle, mt: 3 }}>
            <Box className="header">
              <Iconify icon="mdi:share-variant-outline" width={20} color="#1340FF" />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Social Media
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip
                title={
                  data?.user?.creator?.instagram
                    ? 'Instagram account connected'
                    : 'Instagram account not connected'
                }
              >
                <span style={{ display: 'inline-block' }}>
                  <Button
                    component={data?.user?.creator?.instagram ? 'a' : 'button'}
                    href={
                      data?.user?.creator?.instagram
                        ? `https://instagram.com/${data?.user?.creator?.instagram}`
                        : undefined
                    }
                    target="_blank"
                    disabled={!data?.user?.creator?.instagram}
                    startIcon={
                      <Iconify
                        icon="mdi:instagram"
                        color={data?.user?.creator?.instagram ? '#231F20' : '#8e8e93'}
                      />
                    }
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      color: data?.user?.creator?.instagram ? '#231F20' : '#8e8e93',
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      cursor: data?.user?.creator?.instagram ? 'pointer' : 'not-allowed',
                      opacity: data?.user?.creator?.instagram ? 1 : 0.6,
                      '&:hover': {
                        bgcolor: data?.user?.creator?.instagram
                          ? alpha('#636366', 0.08)
                          : 'transparent',
                      },
                      '&.Mui-disabled': {
                        color: '#8e8e93',
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                      },
                    }}
                  >
                    Instagram
                  </Button>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  data?.user?.creator?.tiktok
                    ? 'TikTok account connected'
                    : 'TikTok account not connected'
                }
              >
                <span style={{ display: 'inline-block' }}>
                  <Button
                    component={data?.user?.creator?.tiktok ? 'a' : 'button'}
                    href={
                      data?.user?.creator?.tiktok
                        ? `https://tiktok.com/@${data?.user?.creator?.tiktok}`
                        : undefined
                    }
                    target="_blank"
                    disabled={!data?.user?.creator?.tiktok}
                    startIcon={
                      <Iconify
                        icon="ic:baseline-tiktok"
                        color={data?.user?.creator?.tiktok ? '#231F20' : '#8e8e93'}
                      />
                    }
                    sx={{
                      px: 2,
                      py: 0.5,
                      color: data?.user?.creator?.tiktok ? '#231F20' : '#8e8e93',
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      cursor: data?.user?.creator?.tiktok ? 'pointer' : 'not-allowed',
                      opacity: data?.user?.creator?.tiktok ? 1 : 0.6,
                      '&:hover': {
                        bgcolor: data?.user?.creator?.tiktok
                          ? alpha('#636366', 0.08)
                          : 'transparent',
                      },
                      '&.Mui-disabled': {
                        color: '#8e8e93',
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                      },
                    }}
                  >
                    TikTok
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Box>
        </Grid>

        {/* Right column - Campaign History */}
        <Grid item xs={12} md={5}>
          <Box sx={BoxStyle}>
            <Box className="header">
              <img
                src="/assets/icons/overview/vector.svg"
                alt="Campaign History"
                style={{
                  width: 20,
                  height: 20,
                  color: '#203ff5',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Campaign History
              </Typography>
            </Box>

            {approvedCampaigns.length > 0 && (
              <>
                {/* Active Campaigns */}
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1ABF66',
                    mb: 2,
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  Active Campaigns
                </Typography>
                {approvedCampaigns.map((campaign) => (
                  <Box key={campaign.id} sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">{campaign.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(campaign.campaignBrief?.startDate).format('D MMM YYYY')} -{' '}
                        {dayjs(campaign.campaignBrief?.endDate).format('D MMM YYYY')}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </>
            )}

            {pendingCampaigns.length > 0 && (
              <>
                {/* Pending_review or sent to client */}
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ff9800',
                    mb: 2,
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  Pending
                </Typography>
                {pendingCampaigns.map((campaign) => (
                  <Box key={campaign.id} sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">{campaign.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(campaign.campaignBrief?.startDate).format('D MMM YYYY')} -{' '}
                        {dayjs(campaign.campaignBrief?.endDate).format('D MMM YYYY')}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </>
            )}

            {rejectedCampaigns.length > 0 && (
              <>
                {/* Rejected Campaigns */}
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#f44336',
                    mb: 2,
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  Rejected Campaigns
                </Typography>
                {rejectedCampaigns.map((campaign) => (
                  <Box key={campaign.id} sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">{campaign.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(campaign.campaignBrief?.startDate).format('D MMM YYYY')} -{' '}
                        {dayjs(campaign.campaignBrief?.endDate).format('D MMM YYYY')}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </>
            )}

            {pastCampaigns.length > 0 && (
              <>
                {/* Past Campaigns */}
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  Past Campaigns
                </Typography>
                {pastCampaigns.map((campaign) => (
                  <Box key={campaign.id} sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">{campaign.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(campaign.campaignBrief?.startDate).format('D MMM YYYY')} -{' '}
                        {dayjs(campaign.campaignBrief?.endDate).format('D MMM YYYY')}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </>
            )}
          </Box>

          {/* Credits Assigned Box */}
          <Box sx={{ ...BoxStyle, mt: 3 }}>
            <Box className="header">
              <Iconify icon="ri:coin-line" width={20} color="#1340FF" />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Total Credits Assigned
              </Typography>
            </Box>

            <Typography variant="subtitle2">
              <Label
                color="info"
                sx={{
                  bgcolor: '#F5F5F5',
                  color: '#231F20',
                  px: 1.5,
                  py: 2,
                  fontSize: '0.8rem',
                }}
              >
                {ugcCredits} UGC Videos
              </Label>
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

CreatorProfileView.propTypes = {
  id: PropTypes.string,
};

export default CreatorProfileView;
