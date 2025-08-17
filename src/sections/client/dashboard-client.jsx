import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Chip,
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
import useGetClientCredits from 'src/hooks/use-get-client-credits';
import useGetClientCampaigns from 'src/hooks/use-get-client-campaigns';

import { fDate } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

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

  useEffect(() => {
    checkClientCompany();
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      // Simple check: if profile is already completed, don't show modal
      const hasCompletedProfile = localStorage.getItem('profileCompleted');
      if (hasCompletedProfile === 'true') {
        console.log('Profile already completed, not showing modal');
        return;
      }

      // Check if we've already shown the modal this session
      const hasShownModal = sessionStorage.getItem('profileModalShown');
      if (hasShownModal === 'true') {
        console.log('Modal already shown this session');
        return;
      }

      // Show modal only once per session
      console.log('Showing profile completion modal');
      sessionStorage.setItem('profileModalShown', 'true');
      setTimeout(() => {
        setShowProfileCompletion(true);
      }, 1000);
      
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  const checkClientCompany = async () => {
    try {
      setIsCheckingCompany(true);
      const response = await axiosInstance.get(endpoints.client.checkCompany);
      setHasCompany(response.data.hasCompany);
      setCompany(response.data.company);
      
      if (!response.data.hasCompany) {
        setOpenCompanyDialog(true);
      }
    } catch (error) {
      console.error('Error checking client company:', error);
      // Silently handle the error without showing a snackbar
      // This prevents the "Error checking company status" message
    } finally {
      setIsCheckingCompany(false);
    }
  };
  
  const { campaigns, isLoading, mutate } = useGetClientCampaigns();
  const { 
    totalCredits, 
    usedCredits, 
    remainingCredits, 
    subscription, 
    isLoading: creditsLoading 
  } = useGetClientCredits();

  // Calculate remaining days based on expiry date
  const calculateRemainingDays = () => {
    if (!subscription?.expiredAt) return 0;
    
    const expiryDate = new Date(subscription.expiredAt);
    const currentDate = new Date();
    const timeDiff = expiryDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff > 0 ? daysDiff : 0;
  };

  const remainingDays = calculateRemainingDays();

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
  
  const handleRefreshCampaigns = () => {
    mutate(); // Refresh campaigns data
    enqueueSnackbar('Refreshing campaigns...', { variant: 'info' });
  };
  
  const handleCheckCampaignAdmin = async () => {
    try {
      const response = await axiosInstance.get('/api/campaign/checkCampaignAdmin');
      enqueueSnackbar(`Found ${response.data.length} campaign associations`, { variant: 'success' });
      console.log('Campaign admin entries:', response.data);
    } catch (error) {
      console.error('Error checking campaign admin:', error);
      enqueueSnackbar('Error checking campaign associations', { variant: 'error' });
    }
  };
  
  const handleAddToAllCampaigns = async () => {
    try {
      const response = await axiosInstance.post('/api/campaign/addClientToCampaignAdmin');
      enqueueSnackbar(`Processed ${response.data.results.length} campaigns`, { variant: 'success' });
      console.log('Add to campaigns result:', response.data);
      // Refresh campaigns data after adding
      mutate();
    } catch (error) {
      console.error('Error adding to campaigns:', error);
      enqueueSnackbar('Error adding to campaigns', { variant: 'error' });
    }
  };

  const renderHeader = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between', 
      alignItems: { xs: 'flex-start', sm: 'center' }, 
      mb: { xs: 3, sm: 2 },
      gap: { xs: 2, sm: 0 }
    }}>
      <Box>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 400, 
            mb: 0.5,
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: { xs: '1.75rem', sm: '2rem' }
          }}
        >
          Welcome, {user?.name || 'Client'}! 👋
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          Keep up the good work! Here's what is relevant to you right now.
        </Typography>
      </Box>
      <Stack direction="row" spacing={1.5}>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            px: 1.5,
            py: 1.5,
            borderRadius: 1,
            bgcolor: '#FFF',
            border: '1px solid #EBEBEB',
            borderBottom: '3px solid #E7E7E7',
            cursor: 'pointer',
            height: '42px',
            width: '42px',
            '&:hover': {
              bgcolor: '#F5F5F5',
            },
          }}
        >
          <Iconify icon="eva:grid-outline" width={20} color="#636366" />
        </Box>
        <Box
          onClick={handleNewCampaign}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderRadius: 1,
            bgcolor: '#203ff5',
            border: '1px solid #203ff5',
            borderBottom: '3px solid #102387',
            cursor: 'pointer',
            height: '42px',
            '&:hover': {
              bgcolor: '#1935dd',
            },
          }}
        >
          <Typography variant="body1" color="white" sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            New Campaign
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  const renderTasksAndCredits = (
    <Grid container spacing={1} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Box sx={{ pl: 0, pr: { xs: 0, md: 2 } }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ fontFamily: 'Aileron, sans-serif' }}
          >
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
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.2, 
                  fontWeight: 500, 
                  whiteSpace: 'nowrap', 
                  color: '#2C2C2C',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' }
                }}
              >
                Creators to<br />Approve
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
                  ml: { xs: 1, sm: 2 }
                }}
              >
                0
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
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.2, 
                  fontWeight: 500, 
                  whiteSpace: 'nowrap', 
                  color: '#2C2C2C',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' }
                }}
              >
                Drafts to<br />Approve
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
                  ml: { xs: 1, sm: 2 }
                }}
              >
                0
              </Box>
            </Box>
          </Stack>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Box sx={{ pl: { xs: 0, md: 14 }, pr: 0 }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ fontFamily: 'Aileron, sans-serif' }}
          >
            Credit Tracking
          </Typography>
          <Grid container spacing={{ xs: 2, md: 0 }} sx={{ mt: 0, alignItems: 'flex-end' }}>
            <Grid item xs={6} sm={6} md={2.5}>
              <Box sx={{ 
                textAlign: 'left', 
                borderRight: { xs: 'none', md: '1px solid #231F20' },
                borderBottom: { xs: 'none', md: 'none' },
                pr: { xs: 0, md: 2 },
                pb: { xs: 1, md: 0 },
                pl: 0,
                mb: { xs: 0, md: 0 }
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    color: '#636366',
                    whiteSpace: 'nowrap',
                    mb: 0,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Total Credits
                </Typography>
                <Typography 
                  variant="h2" 
                  color="#3366FF" 
                  fontWeight={600}
                  sx={{ 
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily, 
                    textAlign: 'left',
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }}
                >
                  {creditsLoading ? '...' : (totalCredits || 0)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={2.5}>
              <Box sx={{ 
                borderRight: { xs: 'none', md: '1px solid #231F20' },
                borderBottom: { xs: 'none', md: 'none' },
                px: { xs: 0, md: 1 },
                pb: { xs: 1, md: 0 },
                pl: { xs: 0, md: 5 },
                mb: { xs: 0, md: 0 }
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    color: '#636366',
                    whiteSpace: 'nowrap',
                    mb: 0,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Used
                </Typography>
                <Typography 
                  variant="h2" 
                  color="#3366FF" 
                  fontWeight={600}
                  sx={{ 
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }}
                >
                  {creditsLoading ? '...' : (usedCredits || 0)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={2.5}>
              <Box sx={{ 
                borderRight: { xs: 'none', md: '1px solid #231F20' },
                borderBottom: { xs: 'none', md: 'none' },
                px: { xs: 0, md: 1 },
                pb: { xs: 1, md: 0 },
                pl: { xs: 0, md: 2 },
                mb: { xs: 0, md: 0 }
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    color: '#636366',
                    whiteSpace: 'nowrap',
                    mb: 0,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Remaining
                </Typography>
                <Typography 
                  variant="h2" 
                  color="#3366FF" 
                  fontWeight={600}
                  sx={{ 
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }}
                >
                  {creditsLoading ? '...' : (remainingCredits || 0)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={4.5}>
              <Box sx={{ 
                px: { xs: 0, md: 1 }, 
                pl: { xs: 0, md: 3 },
                pb: { xs: 0, md: 0 }
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    color: '#636366',
                    whiteSpace: 'nowrap',
                    mb: 0,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Credits Validity
                </Typography>
                <Typography 
                  variant="h2" 
                  color="#3366FF" 
                  fontWeight={600}
                  sx={{ 
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }}
                >
                  {creditsLoading ? '...' : `${remainingDays} Day${remainingDays !== 1 ? 's' : ''}`}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );

  const renderCampaignTable = (
    <Box sx={{ width: '100%' }}>
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
          <Box sx={{ flex: { xs: '1 1 50%', md: '0 0 30%' } }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: '#666',
              }}
            >
              Campaign Name
            </Typography>
          </Box>
          <Box sx={{ flex: { xs: '1 1 25%', md: '0 0 18%' }, display: { xs: 'none', sm: 'block' } }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: '#666',
              }}
            >
              Start Date
            </Typography>
          </Box>
          <Box sx={{ flex: { xs: '1 1 25%', md: '0 0 18%' }, display: { xs: 'none', sm: 'block' } }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: '#666',
              }}
            >
              End Date
            </Typography>
          </Box>
          <Box sx={{ flex: { xs: '1 1 25%', md: '0 0 14%' } }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: '#666',
              }}
            >
              Status
            </Typography>
          </Box>
          <Box sx={{ flex: { xs: '1 1 25%', md: '0 0 20%' }, textAlign: 'right' }}>
            {/* Empty space for action column */}
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
            {campaigns.map((campaign) => (
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
                <Box sx={{ 
                  flex: { xs: '1 1 50%', md: '0 0 30%' }, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  pr: 1
                }}>
                  <Avatar
                    src={campaign.brand?.logo || ''}
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      backgroundColor: '#e0e0e0',
                      color: '#666',
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      flexShrink: 0,
                    }}
                  >
                    {campaign.name?.charAt(0)}
                  </Avatar>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {campaign.name}
                  </Typography>
                </Box>
                <Box sx={{ flex: { xs: '1 1 25%', md: '0 0 18%' }, pr: 1, display: { xs: 'none', sm: 'block' } }}>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      color: '#333',
                    }}
                  >
                    {campaign.campaignBrief?.startDate ? fDate(campaign.campaignBrief.startDate) : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ flex: { xs: '1 1 25%', md: '0 0 18%' }, pr: 1, display: { xs: 'none', sm: 'block' } }}>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      color: '#333',
                    }}
                  >
                    {campaign.campaignBrief?.endDate ? fDate(campaign.campaignBrief.endDate) : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ flex: { xs: '1 1 25%', md: '0 0 14%' }, pr: 1 }}>
                  {(campaign.status === 'PENDING_CSM_REVIEW' || campaign.status === 'SCHEDULED') ? (
                    <Tooltip title="Waiting for admin approval">
                      <Chip
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <span>PENDING</span>
                            <Box
                              sx={{
                                ml: 0.5,
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                border: '1px solid #FFC702',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFC702',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                lineHeight: 1,
                              }}
                            >
                              i
                            </Box>
                          </Box>
                        }
                        size="small"
                        sx={{ 
                          borderRadius: '4px',
                          border: '1px solid #FFC702',
                          boxShadow: '0px -3px 0px 0px #FFC702 inset',
                          backgroundColor: '#FFFFFF',
                          color: '#FFC702',
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          height: { xs: 24, sm: 26 },
                          minWidth: { xs: 60, sm: 70 },
                          '&:hover': {
                            backgroundColor: '#F8F9FA',
                          },
                        }}
                      />
                    </Tooltip>
                  ) : (
                  <Chip
                    label={campaign.status}
                    size="small"
                    sx={{ 
                      borderRadius: '4px',
                      border: '1px solid #E7E7E7',
                      boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                      backgroundColor: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      height: { xs: 24, sm: 26 },
                      minWidth: { xs: 60, sm: 70 },
                      ...(campaign.status === 'ACTIVE' && {
                        color: '#1abf66',
                        border: '1px solid #1abf66',
                        boxShadow: '0px -3px 0px 0px #1abf66 inset',
                      }),
                      ...(campaign.status === 'DRAFT' && {
                        color: '#ff9800',
                        border: '1px solid #ff9800',
                        boxShadow: '0px -3px 0px 0px #ff9800 inset',
                      }),
                      ...(campaign.status === 'COMPLETED' && {
                        color: '#3366FF',
                        border: '1px solid #3366FF',
                        boxShadow: '0px -3px 0px 0px #3366FF inset',
                      }),
                      ...(campaign.status === 'PAUSED' && {
                        color: '#f44336',
                        border: '1px solid #f44336',
                        boxShadow: '0px -3px 0px 0px #f44336 inset',
                      }),
                      '&:hover': {
                        backgroundColor: '#F8F9FA',
                      },
                    }}

                    />
                  )}
                </Box>
                <Box sx={{ flex: { xs: '1 1 25%', md: '0 0 20%' }, textAlign: 'right' }}>
                  <Button
                    variant="text"
                    onClick={() => handleViewCampaign(campaign.id)}
                    sx={{
                      width: { xs: 90, sm: 110 },
                      height: { xs: 28, sm: 30 },
                      padding: { xs: '4px 8px', sm: '6px 10px' },
                      borderRadius: '6px',
                      border: '1px solid #E7E7E7',
                      boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                      backgroundColor: '#FFFFFF',
                      color: '#1340FF',
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
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
                      }
                    }}
                  >
                    View Campaign
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );

  const BoxStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: 2,
    p: 3,
    mt: -1,
    mb: 3,
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
      {renderTasksAndCredits}
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {renderCampaignTable}
        </Grid>
        <Grid item xs={12} lg={4}>
          {renderSidebar}
        </Grid>
      </Grid>

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

      {!hasCompany ?
        <Dialog
          open={openCompanyDialog}
          onClose={() => !hasCompany ? null : setOpenCompanyDialog(false)}
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown={!hasCompany}

        >
          <Box paddingY={3} bgcolor="#F4F4F4">
            <Typography px={3} pb={2} fontSize={{ xs: 26, sm: 36}} fontFamily="Instrument Serif">
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
                <Button onClick={() => setOpenCompanyDialog(false)}>
                  Cancel
                </Button>
              </DialogActions>
            )}
          </Box>
        </Dialog> : null
      }

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
          checkClientCompany();
          // Don't call checkProfileCompletion here as it might show modal again
          // Instead, just verify the completion was saved
          setTimeout(() => {
            const isCompleted = localStorage.getItem('profileCompleted');
            console.log('Verification - Profile completed:', isCompleted);
          }, 1000);
        }}
        userEmail={user?.email}
      />
    </Container>
  );
};

export default ClientDashboard; 