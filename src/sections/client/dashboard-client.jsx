import dayjs from 'dayjs';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Chip,
  Card,
  Stack,
  Button,
  Avatar,
  Dialog,
  Divider,
  Tooltip,
  Container,
  Typography,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetV3Pitches from 'src/hooks/use-get-v3-pitches';
import useGetClientCredits from 'src/hooks/use-get-client-credits';
import useGetClientCampaigns from 'src/hooks/use-get-client-campaigns';

import { fDate } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';

import CompanyCreationForm from './company-creation-form';
import ClientCampaignCreateForm from './campaign-create/campaign-create-form';
import ClientProfileCompletionModal from '../auth/client-profile-completion-modal';

const ClientDashboard = () => {
  const { user } = useAuthContext();
  const settings = useSettingsContext();
  const create = useBoolean();
  const theme = useTheme();
  const smDown = useResponsive('down', 'sm');
  const router = useRouter();

  const [hasCompany, setHasCompany] = useState(null);
  const [company, setCompany] = useState(null);
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  // Load saved layout preference from localStorage, no default value
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem('clientDashboardViewMode');
    return savedViewMode || 'table'; // fallback to table if no preference saved
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 3; // 3 campaigns per page for table, 1 row (3 cards) for card view

  const checkClientCompanyAndProfile = React.useCallback(async () => {
    try {
      setIsCheckingCompany(true);
      const response = await axiosInstance.get(endpoints.client.checkCompany);
      const { hasCompany: userHasCompany, company: userCompany } = response.data;

      setHasCompany(userHasCompany);
      setCompany(userCompany);

      // Handle company dialog
      if (!userHasCompany) {
        setOpenCompanyDialog(true);
      }

      // Handle profile completion modal
      if (!userHasCompany) {
        // Check if we've already shown the modal this session
        const hasShownModal = sessionStorage.getItem('profileModalShown');
        if (hasShownModal !== 'true') {
          console.log('User has no company, showing profile completion modal');
          sessionStorage.setItem('profileModalShown', 'true');
          setTimeout(() => {
            setShowProfileCompletion(true);
          }, 1000);
        }
      } else {
        // Mark profile as completed in localStorage for future reference
        localStorage.setItem('profileCompleted', 'true');
      }
    } catch (error) {
      console.error('Error checking client company and profile:', error);
      // Fallback to localStorage check if API fails
      const hasCompletedProfile = localStorage.getItem('profileCompleted');
      if (hasCompletedProfile === 'true') {
        console.log('Profile already completed (fallback), not showing modal');
      }
    } finally {
      setIsCheckingCompany(false);
    }
  }, []);

  useEffect(() => {
    checkClientCompanyAndProfile();
  }, [checkClientCompanyAndProfile]);

  const { campaigns, isLoading, mutate } = useGetClientCampaigns();
  // Fetch V3 pitches (creator master list items)
  const { pitches: allPitches } = useGetV3Pitches();

  // Client campaign ids for scoping counts to "their own" campaigns
  const clientCampaignIds = React.useMemo(() => {
    if (!Array.isArray(campaigns)) return new Set();
    return new Set(campaigns.map((c) => c.id));
  }, [campaigns]);
  const {
    totalCredits,
    usedCredits,
    remainingCredits,
    subscriptionForValidity,
    isLoading: creditsLoading,
  } = useGetClientCredits();

  // Calculate remaining days based on expiry date
  const calculateRemainingDays = () => {
    if (!subscriptionForValidity?.expiredAt) return 0;

    const expiryDate = new Date(subscriptionForValidity.expiredAt);
    const currentDate = new Date();
    const timeDiff = expiryDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff > 0 ? daysDiff : 0;
  };

  const remainingDays = calculateRemainingDays();

  // Resolve client company logo from localStorage as a fallback for campaign rows
  const clientCompanyLogo = (() => {
    try {
      return localStorage.getItem('client_company_logo') || '';
    } catch (e) {
      return '';
    }
  })();

  // Compute creators to approve and drafts to approve
  const creatorsToApprove = React.useMemo(() => {
    // Count creators in the master list that are still pending (PENDING_REVIEW)
    if (!Array.isArray(allPitches) || clientCampaignIds.size === 0) return 0;
    const normalize = (p) => {
      const status = p?.displayStatus || p?.status;
      if (status === 'undecided') return 'PENDING_REVIEW';
      if (status === 'approved') return 'APPROVED';
      if (status === 'rejected') return 'REJECTED';
      return status;
    };
    return allPitches.filter(
      (p) => clientCampaignIds.has(p?.campaignId) && normalize(p) === 'PENDING_REVIEW'
    ).length;
  }, [allPitches, clientCampaignIds]);

  const draftsToApprove = 0; // V3 submissions removed

  // Debug logging for counts and data shapes
  useEffect(() => {
    try {
      console.log(
        '[ClientDashboard] campaigns length:',
        Array.isArray(campaigns) ? campaigns.length : 'n/a'
      );
      if (Array.isArray(campaigns)) {
        console.log(
          '[ClientDashboard] campaigns ids:',
          campaigns.map((c) => c.id)
        );
      }
      console.log(
        '[ClientDashboard] allPitches length:',
        Array.isArray(allPitches) ? allPitches.length : 'n/a'
      );
      const creatorsToApproveItems = Array.isArray(allPitches)
        ? allPitches.filter((p) => {
            const st = p?.displayStatus || p?.status;
            return (
              clientCampaignIds.has(p?.campaignId) &&
              (st === 'PENDING_REVIEW' || st === 'undecided')
            );
          })
        : [];
      console.log(
        '[ClientDashboard] creatorsToApprove count/items:',
        creatorsToApproveItems.length,
        creatorsToApproveItems.slice(0, 5)
      );
    } catch (e) {
      console.warn('[ClientDashboard] debug log error:', e);
    }
  }, [campaigns, allPitches, clientCampaignIds]);

  const handleCompanyCreated = (newCompany) => {
    setHasCompany(true);
    setCompany(newCompany);
    setOpenCompanyDialog(false);
    enqueueSnackbar('Company created successfully!', { variant: 'success' });
  };

  if (isCheckingCompany) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'xl'}>
        <Box sx={{ py: 5 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  const handleNewCampaign = () => {
    create.onTrue();
  };

  const handleViewCampaign = (id) => {
    router.push(paths.dashboard.campaign.details(id));
  };

  // Calculate pagination
  const indexOfLastCampaign = currentPage * campaignsPerPage;
  const indexOfFirstCampaign = indexOfLastCampaign - campaignsPerPage;
  const currentCampaigns = campaigns.slice(indexOfFirstCampaign, indexOfLastCampaign);
  const totalPages = Math.ceil(campaigns.length / campaignsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Calculate pagination range for sliding window
  const getPaginationRange = () => {
    const delta = 1; // Show 1 page on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i += 1
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const renderHeader = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: { xs: 3, sm: 2 },
        gap: { xs: 2, sm: 0 },
      }}
    >
      <Box>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 400,
            mb: 0.5,
            fontFamily: theme.typography.fontSecondaryFamily,
            fontSize: { xs: '1.75rem', sm: '2rem' },
          }}
        >
          Welcome, {user?.name || 'Client'}! 👋
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          Keep up the good work! Here&apos;s what is relevant to you right now.
        </Typography>
      </Box>
      <Stack
        direction="row"
        spacing={1.5}
        justifyContent={{ xs: 'space-between', md: 'flex-end' }}
        alignItems="center"
        sx={{ width: { xs: '92%', md: 'auto' }, alignSelf: { xs: 'stretch', md: 'auto' } }}
      >
        {/* View Mode Toggle */}
        <Box
          onClick={() => {
            const newViewMode = viewMode === 'table' ? 'card' : 'table';
            setViewMode(newViewMode);
            localStorage.setItem('clientDashboardViewMode', newViewMode);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1.3,
            py: 1,
            borderRadius: 1,
            border: '1px solid #E7E7E7',
            borderBottom: '3px solid #E7E7E7',
            bgcolor: '#fff',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#F5F5F5',
            },
          }}
        >
          <Iconify
            icon={viewMode === 'table' ? 'mdi:grid' : 'eva:list-outline'}
            width={23}
          />
        </Box>

        <Box
          onClick={handleNewCampaign}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            gap: 1,
            borderRadius: 1,
            bgcolor: '#203ff5',
            border: '1px solid #203ff5',
            borderBottom: '3px solid #00000073',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#1935dd',
            },
          }}
        >
          <Typography
            variant="body1"
            color="white"
            sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            New Campaign
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  // Mobile version - Tasks and Credits
  const renderTasksAndCreditsMobile = (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        {/* Tasks To Do Column */}
        <Grid item xs={6}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontFamily: 'Aileron, sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Tasks To Do
          </Typography>
          <Stack spacing={1.5}>
            {/* Creators to Approve */}
            <Box
              sx={{
                bgcolor: '#F5F5F5',
                borderRadius: 1.5,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0px 4px 4px 0px #8E8E9340',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.2,
                  fontWeight: 500,
                  color: '#2C2C2C',
                  fontSize: 16,
                }}
              >
                Creators to Approve
              </Typography>
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: 1,
                  bgcolor: '#1340FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {creatorsToApprove}
              </Box>
            </Box>

            {/* Drafts to Approve */}
            <Box
              sx={{
                bgcolor: '#F5F5F5',
                borderRadius: 1.5,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0px 4px 4px 0px #8E8E9340',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.2,
                  fontWeight: 500,
                  color: '#2C2C2C',
                  fontSize: 16,
                }}
              >
                Drafts to Approve
              </Typography>
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: 1,
                  bgcolor: '#1340FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {draftsToApprove}
              </Box>
            </Box>
          </Stack>
        </Grid>

        {/* Credit Tracking Column */}
        {!user?.isChildAccount && (
          <Grid item xs={6}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontFamily: 'Aileron, sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                mb: 2,
              }}
            >
              Credit Tracking
            </Typography>
            <Stack spacing={2}>
              {/* Total Credits */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Aileron, sans-serif',
                    color: '#636366',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Total Credits
                </Typography>
                <Typography
                  variant="h5"
                  color="#3366FF"
                  fontWeight={600}
                  sx={{
                    fontFamily: theme.typography.fontSecondaryFamily,
                    fontSize: 20,
                  }}
                >
                  {creditsLoading ? '...' : totalCredits || 0}
                </Typography>
              </Box>

              {/* Used */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Aileron, sans-serif',
                    color: '#636366',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Used
                </Typography>
                <Typography
                  variant="h5"
                  color="#3366FF"
                  fontWeight={600}
                  sx={{
                    fontFamily: theme.typography.fontSecondaryFamily,
                    fontSize: 20,
                  }}
                >
                  {creditsLoading ? '...' : usedCredits || 0}
                </Typography>
              </Box>

              {/* Remaining */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Aileron, sans-serif',
                    color: '#636366',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Remaining
                </Typography>
                <Typography
                  variant="h5"
                  color="#3366FF"
                  fontWeight={600}
                  sx={{
                    fontFamily: theme.typography.fontSecondaryFamily,
                    fontSize: 20,
                  }}
                >
                  {creditsLoading ? '...' : remainingCredits || 0}
                </Typography>
              </Box>

              {/* Validity */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Aileron, sans-serif',
                    color: '#636366',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Validity
                </Typography>
                <Typography
                  variant="h5"
                  color="#3366FF"
                  fontWeight={600}
                  sx={{
                    fontFamily: theme.typography.fontSecondaryFamily,
                    fontSize: 20,
                  }}
                >
                  {creditsLoading ? '...' : `${remainingDays} Day${remainingDays !== 1 ? 's' : ''}`}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  // Desktop version - Tasks and Credits
  const renderTasksAndCredits = (
    <Grid container spacing={1} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Box sx={{ pl: 0, pr: { xs: 0, md: 2 } }}>
          <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Aileron, sans-serif' }}>
            Tasks To Do
          </Typography>
          <Stack direction={{ xs: 'row', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }} sx={{ mt: 2 }}>
            <Box
              sx={{
                bgcolor: '#F5F5F5',
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: 1,
                minWidth: { xs: 'auto', sm: 180 },
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.2,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  color: '#2C2C2C',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                }}
              >
                Creators to
                <br />
                Approve
              </Typography>
              <Box
                sx={{
                  width: { xs: 50, sm: 60 },
                  height: { xs: 50, sm: 60 },
                  borderRadius: 2,
                  bgcolor: '#3366FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: { xs: 20, sm: 24 },
                  fontWeight: 600,
                  ml: { xs: 1, sm: 2 },
                }}
              >
                {creatorsToApprove}
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: '#F5F5F5',
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: 1,
                minWidth: { xs: 'auto', sm: 180 },
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.2,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  color: '#2C2C2C',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                }}
              >
                Drafts to
                <br />
                Approve
              </Typography>
              <Box
                sx={{
                  width: { xs: 50, sm: 60 },
                  height: { xs: 50, sm: 60 },
                  borderRadius: 2,
                  bgcolor: '#3366FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: { xs: 20, sm: 24 },
                  fontWeight: 600,
                  ml: { xs: 1, sm: 2 },
                }}
              >
                {draftsToApprove}
              </Box>
            </Box>
          </Stack>
        </Box>
      </Grid>
      {!user?.isChildAccount && (
        <Grid item xs={12} md={8}>
          <Box sx={{ pl: { xs: 0, md: 14 }, pr: 0 }}>
            <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Aileron, sans-serif' }}>
              Credit Tracking
            </Typography>
            <Grid container spacing={{ xs: 2, md: 0 }} sx={{ mt: 0, alignItems: 'flex-end' }}>
              <Grid item xs={6} sm={6} md={2.5}>
                <Box
                  sx={{
                    textAlign: 'left',
                    borderRight: { xs: 'none', md: '1px solid #231F20' },
                    borderBottom: { xs: 'none', md: 'none' },
                    pr: { xs: 0, md: 2 },
                    pb: { xs: 1, md: 0 },
                    pl: 0,
                    mb: { xs: 0, md: 0 },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Aileron, sans-serif',
                      color: '#636366',
                      whiteSpace: 'nowrap',
                      mb: 0,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                    }}
                  >
                    Total Credits
                  </Typography>
                  <Typography
                    variant="h2"
                    color="#3366FF"
                    fontWeight={600}
                    sx={{
                      fontFamily: theme.typography.fontSecondaryFamily,
                      textAlign: 'left',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    }}
                  >
                    {creditsLoading ? '...' : totalCredits || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={6} md={2.5}>
                <Box
                  sx={{
                    borderRight: { xs: 'none', md: '1px solid #231F20' },
                    borderBottom: { xs: 'none', md: 'none' },
                    px: { xs: 0, md: 1 },
                    pb: { xs: 1, md: 0 },
                    pl: { xs: 0, md: 5 },
                    mb: { xs: 0, md: 0 },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Aileron, sans-serif',
                      color: '#636366',
                      whiteSpace: 'nowrap',
                      mb: 0,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                    }}
                  >
                    Used
                  </Typography>
                  <Typography
                    variant="h2"
                    color="#3366FF"
                    fontWeight={600}
                    sx={{
                      fontFamily: theme.typography.fontSecondaryFamily,
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    }}
                  >
                    {creditsLoading ? '...' : usedCredits || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={6} md={2.5}>
                <Box
                  sx={{
                    borderRight: { xs: 'none', md: '1px solid #231F20' },
                    borderBottom: { xs: 'none', md: 'none' },
                    px: { xs: 0, md: 1 },
                    pb: { xs: 1, md: 0 },
                    pl: { xs: 0, md: 2 },
                    mb: { xs: 0, md: 0 },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Aileron, sans-serif',
                      color: '#636366',
                      whiteSpace: 'nowrap',
                      mb: 0,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                    }}
                  >
                    Remaining
                  </Typography>
                  <Typography
                    variant="h2"
                    color="#3366FF"
                    fontWeight={600}
                    sx={{
                      fontFamily: theme.typography.fontSecondaryFamily,
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    }}
                  >
                    {creditsLoading ? '...' : remainingCredits || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={6} md={4.5}>
                <Box
                  sx={{
                    px: { xs: 0, md: 1 },
                    pl: { xs: 0, md: 3 },
                    pb: { xs: 0, md: 0 },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Aileron, sans-serif',
                      color: '#636366',
                      whiteSpace: 'nowrap',
                      mb: 0,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                    }}
                  >
                    Credits Validity
                  </Typography>
                  <Typography
                    variant="h2"
                    color="#3366FF"
                    fontWeight={600}
                    sx={{
                      fontFamily: theme.typography.fontSecondaryFamily,
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    }}
                  >
                    {creditsLoading ? '...' : `${remainingDays} Day${remainingDays !== 1 ? 's' : ''}`}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      )}
    </Grid>
  );

  // Mobile Campaign List
  const renderCampaignMobile = (
    <Box sx={{ width: '100%' }}>
      {/* Loading state */}
      {isLoading && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Empty state for campaigns */}
      {!isLoading && (!campaigns || campaigns.length === 0) && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <EmptyContent
            title="No campaigns yet"
            description="Create your first campaign by clicking the 'New Campaign' button"
            sx={{ py: 5 }}
          />
        </Box>
      )}

      {/* Campaign list - List view */}
      {!isLoading && campaigns && campaigns.length > 0 && viewMode === 'table' && (
        <Stack mb={2} spacing={2}>
          {currentCampaigns.map((campaign) => (
            <Box
              key={campaign.id}
              onClick={() => handleViewCampaign(campaign.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                pb: 2,
                borderBottom: '1px solid #E7E7E7',
                bgcolor: '#FFFFFF',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#F8F9FA',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                <Avatar
                  src={campaign?.campaignBrief?.images?.[0] || campaign.brand?.logo || campaign.company?.logo || clientCompanyLogo || ''}
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    color: '#666',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {campaign.name?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: 0.3,
                    }}
                  >
                    {campaign.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: '#8E8E93',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Iconify icon="mdi:calendar-blank-outline" width={12} sx={{ mr: 0.5, mb: -0.2 }} />
                    {campaign.campaignBrief?.startDate && campaign.campaignBrief?.endDate
                      ? `${fDate(campaign.campaignBrief.startDate)} - ${fDate(campaign.campaignBrief.endDate)}`
                      : 'Dates TBD'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flexShrink: 0, ml: 1 }}>
                {(() => {
                  if (
                    campaign.status === 'PENDING_CSM_REVIEW' ||
                    campaign.status === 'SCHEDULED' ||
                    campaign.status === 'PENDING_ADMIN_ACTIVATION'
                  ) {
                    return (
                      <Chip
                        label="PENDING"
                        size="small"
                        sx={{
                          borderRadius: '4px',
                          border: '1px solid #FFC702',
                          boxShadow: '0px -2px 0px 0px #FFC702 inset',
                          backgroundColor: '#FFFFFF',
                          color: '#FFC702',
                          fontWeight: 600,
                          fontSize: 12,
                          height: 30,
                          minWidth: 70,
                        }}
                      />
                    );
                  }
                  if (campaign.status === 'INACTIVE') {
                    return (
                      <Chip
                        label="INACTIVE"
                        size="small"
                        sx={{
                          borderRadius: '4px',
                          border: '1px solid #8E8E93',
                          boxShadow: '0px -2px 0px 0px #8E8E93 inset',
                          backgroundColor: '#FFFFFF',
                          color: '#8E8E93',
                          fontWeight: 600,
                          fontSize: 12,
                          height: 30,
                          minWidth: 70,
                        }}
                      />
                    );
                  }
                  return (
                    <Chip
                      label={campaign.status}
                      size="small"
                      sx={{
                        borderRadius: '4px',
                        border: '1px solid #E7E7E7',
                        boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                        backgroundColor: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: 12,
                        height: 30,
                        minWidth: 70,
                        ...(campaign.status === 'ACTIVE' && {
                          color: '#1abf66',
                          border: '1px solid #1abf66',
                          boxShadow: '0px -2px 0px 0px #1abf66 inset',
                        }),
                        ...(campaign.status === 'DRAFT' && {
                          color: '#ff9800',
                          border: '1px solid #ff9800',
                          boxShadow: '0px -2px 0px 0px #ff9800 inset',
                        }),
                        ...(campaign.status === 'COMPLETED' && {
                          color: '#3366FF',
                          border: '1px solid #3366FF',
                          boxShadow: '0px -2px 0px 0px #3366FF inset',
                        }),
                        ...(campaign.status === 'PAUSED' && {
                          color: '#f44336',
                          border: '1px solid #f44336',
                          boxShadow: '0px -2px 0px 0px #f44336 inset',
                        }),
                      }}
                    />
                  );
                })()}
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      {/* Campaign cards - Horizontal scroll view */}
      {!isLoading && campaigns && campaigns.length > 0 && viewMode === 'card' && (
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            pb: 2,
            mb: 2,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#F5F5F5',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#C7C7CC',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: '#8E8E93',
              },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              minWidth: 'min-content',
            }}
          >
            {currentCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                onClick={() => handleViewCampaign(campaign.id)}
                sx={{
                  width: 280,
                  flexShrink: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  bgcolor: 'background.default',
                  borderRadius: '15px',
                  border: '1.2px solid',
                  borderColor: 'divider',
                  height: 240,
                  '&:hover': {
                    borderColor: '#1340ff',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Campaign Image */}
                <Box sx={{ position: 'relative', height: 120, overflow: 'hidden' }}>
                  <Image
                    alt={campaign?.name}
                    src={campaign?.campaignBrief?.images?.[0] || '/assets/images/placeholder.jpg'}
                    sx={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                  <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
                    <Chip
                      label={
                        campaign.status === 'PENDING_CSM_REVIEW' ||
                        campaign.status === 'SCHEDULED' ||
                        campaign.status === 'PENDING_ADMIN_ACTIVATION'
                          ? 'PENDING'
                          : campaign.status
                      }
                      sx={{
                        backgroundColor: 'white',
                        color: campaign.status === 'PENDING_ADMIN_ACTIVATION' ? '#1340FF' : '#48484a',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        borderRadius: '5px',
                        height: '24px',
                        border:
                          campaign.status === 'PENDING_ADMIN_ACTIVATION'
                            ? '1.2px solid #1340FF'
                            : '1.2px solid #e7e7e7',
                        borderBottom:
                          campaign.status === 'PENDING_ADMIN_ACTIVATION'
                            ? '3px solid #1340FF'
                            : '3px solid #e7e7e7',
                        '& .MuiChip-label': {
                          padding: '0 5px',
                        },
                        '&:hover': {
                          backgroundColor: 'white',
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Campaign Content */}
                <Box sx={{ position: 'relative', pt: 1, px: 2, pb: 1.5 }}>
                  <Avatar
                    src={campaign?.campaignBrief?.images?.[0] || campaign?.brand?.logo || campaign?.company?.logo}
                    alt={campaign?.brand?.name || campaign?.company?.name}
                    sx={{
                      width: 40,
                      height: 40,
                      border: '2px solid #ebebeb',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: -25,
                      left: 12,
                    }}
                  >
                    {campaign?.name?.charAt(0)}
                  </Avatar>

                  <Box sx={{ mt: 0.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 650,
                        mb: -0.1,
                        pb: 0.2,
                        mt: 0.6,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '1rem',
                      }}
                    >
                      {campaign?.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.2,
                        color: '#8e8e93',
                        fontSize: '0.8rem',
                        fontWeight: 550,
                      }}
                    >
                      {campaign?.brand?.name || campaign?.company?.name || 'Client Campaign'}
                    </Typography>
                  </Box>

                  <Stack spacing={0.4}>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <img
                        src="/assets/icons/overview/IndustriesTag.svg"
                        alt="Industries"
                        style={{
                          width: 14,
                          height: 14,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#8e8e93',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {campaign?.campaignBrief?.industries || 'General'}
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={0.8}>
                        <img
                          src="/assets/icons/overview/SmallCalendar.svg"
                          alt="Calendar"
                          style={{
                            width: 14,
                            height: 14,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#8e8e93',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}
                        >
                          {campaign?.campaignBrief?.startDate && campaign?.campaignBrief?.endDate
                            ? `${dayjs(campaign?.campaignBrief?.startDate).format('D MMM YYYY')} - ${dayjs(
                                campaign?.campaignBrief?.endDate
                              ).format('D MMM YYYY')}`
                            : 'Dates TBD'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Pagination for Mobile View */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography
              onClick={() => handlePageChange(null, Math.max(1, currentPage - 1))}
              sx={{
                cursor: currentPage === 1 ? 'default' : 'pointer',
                color: currentPage === 1 ? '#C7C7CC' : '#000000',
                fontSize: '1rem',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              &lt;
            </Typography>

            {getPaginationRange().map((page, index) =>
              page === '...' ? (
                <Typography key={`dots-${index}`} sx={{ color: '#8E8E93', fontSize: '1rem' }}>
                  ...
                </Typography>
              ) : (
                <Typography
                  key={page}
                  onClick={() => handlePageChange(null, page)}
                  sx={{
                    cursor: 'pointer',
                    color: currentPage === page ? '#1340FF' : '#000000',
                    fontSize: '1rem',
                    fontWeight: currentPage === page ? 700 : 500,
                    userSelect: 'none',
                    '&:hover': {
                      color: currentPage === page ? '#1340FF' : '#666666',
                    },
                  }}
                >
                  {page}
                </Typography>
              )
            )}

            <Typography
              onClick={() => handlePageChange(null, Math.min(totalPages, currentPage + 1))}
              sx={{
                cursor: currentPage === totalPages ? 'default' : 'pointer',
                color: currentPage === totalPages ? '#C7C7CC' : '#000000',
                fontSize: '1rem',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              &gt;
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );

  // Desktop Campaign Table
  const renderCampaignTable = (
    <Box sx={{ width: '100%' }}>
      {/* Custom Table Header */}
      <Box
        sx={{
          width: '100%',
          height: 32,
          backgroundColor: '#F5F5F5',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          mb: 0,
        }}
      >
        <Box sx={{ flex: '0 0 33%' }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#666',
            }}
          >
            Campaign Name
          </Typography>
        </Box>
        <Box sx={{ flex: '0 0 15%' }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#666',
            }}
          >
            Start Date
          </Typography>
        </Box>
        <Box sx={{ flex: '0 0 15%' }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#666',
            }}
          >
            End Date
          </Typography>
        </Box>
        <Box sx={{ flex: '0 0 18%', }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#666',
            }}
          >
            Status
          </Typography>
        </Box>
      </Box>

      {/* Loading state */}
      {isLoading && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Empty state for campaigns */}
      {!isLoading && (!campaigns || campaigns.length === 0) && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <EmptyContent
            title="No campaigns yet"
            description="Create your first campaign by clicking the 'New Campaign' button"
            sx={{ py: 5 }}
          />
        </Box>
      )}

      {/* Campaign list */}
      {!isLoading && campaigns && campaigns.length > 0 && (
        <Box sx={{ width: '100%' }}>
          {currentCampaigns.map((campaign) => (
            <Box
              key={campaign.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 2,
                borderBottom: '1px solid #f0f0f0',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                },
              }}
            >
              <Box
                sx={{
                  flex: '0 0 33%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  pr: 1,
                  minWidth: 0,
                }}
              >
                <Avatar
                  src={campaign?.campaignBrief?.images?.[0] || campaign.brand?.logo || campaign.company?.logo || clientCompanyLogo || ''}
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: '#e0e0e0',
                    color: '#666',
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  {campaign.name?.charAt(0)}
                </Avatar>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '0.9rem',
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {campaign.name}
                </Typography>
              </Box>
              <Box sx={{ flex: '0 0 15%', pr: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '0.9rem',
                    color: '#333',
                  }}
                >
                  {campaign.campaignBrief?.startDate
                    ? fDate(campaign.campaignBrief.startDate)
                    : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ flex: '0 0 15%', pr: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '0.9rem',
                    color: '#333',
                  }}
                >
                  {campaign.campaignBrief?.endDate
                    ? fDate(campaign.campaignBrief.endDate)
                    : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ flex: '0 0 18%' }}>
                {campaign.status === 'PENDING_CSM_REVIEW' ||
                campaign.status === 'SCHEDULED' ||
                campaign.status === 'PENDING_ADMIN_ACTIVATION' ? (
                  <Tooltip title="Waiting for admin approval">
                    <Chip
                      label={
                        <Box display="flex" alignItems="center" pb={0.2} gap={0.5}>
                          PENDING
                          <Iconify 
                            icon="mdi:information-outline" 
                            sx={{
                              color: '#FFC702',
                              width: 16,
                              height: 16,
                            }} 
                          />
                        </Box>
                      }
                      size="small"
                      sx={{
                        borderRadius: 0.8,
                        border: '1px solid #FFC702',
                        boxShadow: '0px -2px 0px 0px #FFC702 inset',
                        height: 30,
                        backgroundColor: '#FFFFFF',
                        color: '#FFC702',
                        fontWeight: 600,
                        fontSize: 12,
                        minWidth: 70,
                        '&:hover': {
                          backgroundColor: '#F8F9FA',
                        },
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Chip
                    label={
                      campaign.status === 'PENDING_ADMIN_ACTIVATION' ? 'PENDING' : campaign.status
                    }
                    size="small"
                    sx={{
                      borderRadius: 0.8,
                      border: '1px solid #E7E7E7',
                      boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                      backgroundColor: '#FFFFFF',
                      pb: 0.2,
                      fontWeight: 600,
                      fontSize: 12,
                      height: 30,
                      minWidth: 70,
                      ...(campaign.status === 'PENDING_ADMIN_ACTIVATION' && {
                        color: '#1340FF',
                        border: '1px solid #1340FF',
                        boxShadow: '0px -2px 0px 0px #1340FF inset',
                      }),
                      ...(campaign.status === 'ACTIVE' && {
                        color: '#1abf66',
                        border: '1px solid #1abf66',
                        boxShadow: '0px -2px 0px 0px #1abf66 inset',
                      }),
                      ...(campaign.status === 'DRAFT' && {
                        color: '#ff9800',
                        border: '1px solid #ff9800',
                        boxShadow: '0px -2px 0px 0px #ff9800 inset',
                      }),
                      ...(campaign.status === 'COMPLETED' && {
                        color: '#3366FF',
                        border: '1px solid #3366FF',
                        boxShadow: '0px -2px 0px 0px #3366FF inset',
                      }),
                      ...(campaign.status === 'PAUSED' && {
                        color: '#f44336',
                        border: '1px solid #f44336',
                        boxShadow: '0px -2px 0px 0px #f44336 inset',
                      }),
                      '&:hover': {
                        backgroundColor: '#F8F9FA',
                      },
                    }}
                  />
                )}
              </Box>
              <Box sx={{ flex: '0 0 20%', textAlign: 'right' }}>
                <Button
                  variant="text"
                  onClick={() => handleViewCampaign(campaign.id)}
                  sx={{
                    width: 130,
                    height: 32,
                    pb: 1,
                    borderRadius: '6px',
                    border: '1px solid #E7E7E7',
                    boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                    backgroundColor: '#FFFFFF',
                    color: '#1340FF',
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#F8F9FA',
                      border: '1px solid #E7E7E7',
                      boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                    },
                    '&:active': {
                      boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                      transform: 'translateY(1px)',
                    },
                  }}
                >
                  View Campaign
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Pagination for Table View */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography
              onClick={() => handlePageChange(null, Math.max(1, currentPage - 1))}
              sx={{
                cursor: currentPage === 1 ? 'default' : 'pointer',
                color: currentPage === 1 ? '#C7C7CC' : '#000000',
                fontSize: '1rem',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              &lt;
            </Typography>

            {getPaginationRange().map((page, index) =>
              page === '...' ? (
                <Typography key={`dots-${index}`} sx={{ color: '#8E8E93', fontSize: '1rem' }}>
                  ...
                </Typography>
              ) : (
                <Typography
                  key={page}
                  onClick={() => handlePageChange(null, page)}
                  sx={{
                    cursor: 'pointer',
                    color: currentPage === page ? '#1340FF' : '#000000',
                    fontSize: '1rem',
                    fontWeight: currentPage === page ? 700 : 500,
                    userSelect: 'none',
                    '&:hover': {
                      color: currentPage === page ? '#1340FF' : '#666666',
                    },
                  }}
                >
                  {page}
                </Typography>
              )
            )}

            <Typography
              onClick={() => handlePageChange(null, Math.min(totalPages, currentPage + 1))}
              sx={{
                cursor: currentPage === totalPages ? 'default' : 'pointer',
                color: currentPage === totalPages ? '#C7C7CC' : '#000000',
                fontSize: '1rem',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              &gt;
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );

  const renderCampaignCards = (
    <Box sx={{ width: '100%' }}>
      {/* Loading state */}
      {isLoading && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Empty state for campaigns */}
      {!isLoading && (!campaigns || campaigns.length === 0) && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <EmptyContent
            title="No campaigns yet"
            description="Create your first campaign by clicking the 'New Campaign' button"
            sx={{ py: 5 }}
          />
        </Box>
      )}

      {/* Campaign cards */}
      {!isLoading && campaigns && campaigns.length > 0 && (
        <Box
          gap={2}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
        >
          {currentCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              onClick={() => handleViewCampaign(campaign.id)}
              sx={{
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s',
                bgcolor: 'background.default',
                borderRadius: '15px',
                border: '1.2px solid',
                borderColor: 'divider',
                position: 'relative',
                mb: -0.5,
                height: 240,
                '&:hover': {
                  borderColor: '#1340ff',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {/* Campaign Image */}
              <Box sx={{ position: 'relative', height: 120, overflow: 'hidden' }}>
                <Image
                  alt={campaign?.name}
                  src={campaign?.campaignBrief?.images?.[0] || '/assets/images/placeholder.jpg'}
                  sx={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
                <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
                  <Chip
                    label={
                      campaign.status === 'PENDING_CSM_REVIEW' ||
                      campaign.status === 'SCHEDULED' ||
                      campaign.status === 'PENDING_ADMIN_ACTIVATION'
                        ? 'PENDING'
                        : campaign.status
                    }
                    sx={{
                      backgroundColor: 'white',
                      color: campaign.status === 'PENDING_ADMIN_ACTIVATION' ? '#1340FF' : '#48484a',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      borderRadius: '5px',
                      height: '24px',
                      border:
                        campaign.status === 'PENDING_ADMIN_ACTIVATION'
                          ? '1.2px solid #1340FF'
                          : '1.2px solid #e7e7e7',
                      borderBottom:
                        campaign.status === 'PENDING_ADMIN_ACTIVATION'
                          ? '3px solid #1340FF'
                          : '3px solid #e7e7e7',
                      '& .MuiChip-label': {
                        padding: '0 5px',
                      },
                      '&:hover': {
                        backgroundColor: 'white',
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Campaign Content */}
              <Box sx={{ position: 'relative', pt: 1, px: 2, pb: 1.5 }}>
                <Avatar
                  src={campaign?.campaignBrief?.images?.[0] || campaign?.brand?.logo || campaign?.company?.logo}
                  alt={campaign?.brand?.name || campaign?.company?.name}
                  sx={{
                    width: 40,
                    height: 40,
                    border: '2px solid #ebebeb',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: -25,
                    left: 12,
                  }}
                >
                  {campaign?.name?.charAt(0)}
                </Avatar>

                <Box sx={{ mt: 0.5 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 650,
                      mb: -0.1,
                      pb: 0.2,
                      mt: 0.6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '1rem',
                    }}
                  >
                    {campaign?.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1.2,
                      color: '#8e8e93',
                      fontSize: '0.8rem',
                      fontWeight: 550,
                    }}
                  >
                    {campaign?.brand?.name || campaign?.company?.name || 'Client Campaign'}
                  </Typography>
                </Box>

                <Stack spacing={0.4}>
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <img
                      src="/assets/icons/overview/IndustriesTag.svg"
                      alt="Industries"
                      style={{
                        width: 14,
                        height: 14,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#8e8e93',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {campaign?.campaignBrief?.industries || 'General'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <img
                        src="/assets/icons/overview/SmallCalendar.svg"
                        alt="Calendar"
                        style={{
                          width: 14,
                          height: 14,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#8e8e93',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {campaign?.campaignBrief?.startDate && campaign?.campaignBrief?.endDate
                          ? `${dayjs(campaign?.campaignBrief?.startDate).format('D MMM YYYY')} - ${dayjs(
                              campaign?.campaignBrief?.endDate
                            ).format('D MMM YYYY')}`
                          : 'Dates TBD'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Pagination for Card View */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography
              onClick={() => handlePageChange(null, Math.max(1, currentPage - 1))}
              sx={{
                cursor: currentPage === 1 ? 'default' : 'pointer',
                color: currentPage === 1 ? '#C7C7CC' : '#000000',
                fontSize: '1rem',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              &lt;
            </Typography>

            {getPaginationRange().map((page, index) =>
              page === '...' ? (
                <Typography key={`dots-${index}`} sx={{ color: '#8E8E93', fontSize: '1rem' }}>
                  ...
                </Typography>
              ) : (
                <Typography
                  key={page}
                  onClick={() => handlePageChange(null, page)}
                  sx={{
                    cursor: 'pointer',
                    color: currentPage === page ? '#1340FF' : '#000000',
                    fontSize: '1rem',
                    fontWeight: currentPage === page ? 700 : 500,
                    userSelect: 'none',
                    '&:hover': {
                      color: currentPage === page ? '#1340FF' : '#666666',
                    },
                  }}
                >
                  {page}
                </Typography>
              )
            )}

            <Typography
              onClick={() => handlePageChange(null, Math.min(totalPages, currentPage + 1))}
              sx={{
                cursor: currentPage === totalPages ? 'default' : 'pointer',
                color: currentPage === totalPages ? '#C7C7CC' : '#000000',
                fontSize: '1rem',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              &gt;
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );

  const renderSidebar = (
    <Stack spacing={-3}>
      {/* <Box sx={{ ...BoxStyle, mt: 1 }}>
        <Box className="header">
          <Iconify 
            icon="eva:file-text-outline" 
            sx={{
              color: '#203ff5',
              width: 20,
              height: 20,
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
            SIGNED QUOTE
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: '#8e8e93', fontSize: '0.9rem' }}>
            No signed quotes available
          </Typography>
        </Box>
      </Box> */}

      {/* <Box sx={BoxStyle}>
        <Box className="header">
          <Iconify 
            icon="eva:file-text-outline" 
            sx={{
              color: '#203ff5',
              width: 20,
              height: 20,
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
            INVOICES
          </Typography>
        </Box>
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#8e8e93', fontSize: '0.9rem' }}>
            No invoices available
          </Typography>
        </Box>
      </Box> */}
    </Stack>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {renderHeader}

      {smDown && renderCampaignMobile}

      {smDown ? renderTasksAndCreditsMobile : renderTasksAndCredits}

      <Grid container spacing={3}>
        <Grid item display={{ xs: 'none ', sm: 'flex' }} lg={8}>
          {viewMode === 'table' ? renderCampaignTable : renderCampaignCards}
        </Grid>
        <Grid item xs={12} lg={4}>
          {renderSidebar}
        </Grid>
      </Grid>

      {/* <Box
        sx={{
          position: 'absolute',
          bottom: 15,
          right: 45,
          textAlign: 'right',
        }}
      >
        <IconButton
          sx={{
            background: 'linear-gradient(231.34deg, #8A5AFE 14.73%, #3A3A3C 84.06%)',
            width: 60,
            height: 60,
            ':hover': {
              background: 'linear-gradient(231.34deg, #8A5AFE 100%, #3A3A3C 100%)',
            },
          }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <Image src="/assets/chat.svg" alt="Chat" sx={{ width: 30 }} />
        </IconButton>
      </Box> */}

      <Dialog
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            p: 4,
            m: 2,
            height: '97vh',
            overflow: 'hidden',
            ...(smDown && {
              height: 1,
              m: 0,
            }),
          },
        }}
        scroll="paper"
        open={create.value}
      >
        <ClientCampaignCreateForm onClose={create.onFalse} mutate={mutate} />
      </Dialog>

      {!hasCompany ? (
        <Dialog
          open={openCompanyDialog}
          onClose={() => (!hasCompany ? null : setOpenCompanyDialog(false))}
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown={!hasCompany}
        >
          <Box paddingY={3} bgcolor="#F4F4F4">
            <Typography px={3} pb={2} fontSize={{ xs: 26, sm: 36 }} fontFamily="Instrument Serif">
              Complete your Client Information
            </Typography>
            <Divider sx={{ mx: 3 }} />
            <DialogContent>
              <CompanyCreationForm
                onSuccess={handleCompanyCreated}
                existingCompany={company}
                isEdit={hasCompany}
              />
            </DialogContent>
            {hasCompany && (
              <DialogActions>
                <Button onClick={() => setOpenCompanyDialog(false)}>Cancel</Button>
              </DialogActions>
            )}
          </Box>
        </Dialog>
      ) : null}

      {/* Profile Completion Modal */}
      <ClientProfileCompletionModal
        open={showProfileCompletion}
        onClose={() => setShowProfileCompletion(false)}
        onSuccess={() => {
          console.log('Modal success callback triggered');
          setShowProfileCompletion(false);
          // Clear session storage since profile is now completed
          sessionStorage.removeItem('profileModalShown');
          console.log('Session storage cleared');
          // Refresh company data
          checkClientCompanyAndProfile();
          // Don't call checkProfileCompletion here as it might show modal again
          // Instead, just verify the completion was saved
          setTimeout(() => {
            const isCompleted = localStorage.getItem('profileCompleted');
            console.log('Verification - Profile completed:', isCompleted);
          }, 1000);
        }}
        userEmail={user?.email}
      />

      {/* <ChatModal open={isChatopen} onClose={() => setAnchorEl(null)} anchorEl={anchorEl} /> */}
    </Container>
  );
};

export default ClientDashboard;
