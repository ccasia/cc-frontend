import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Link,
  Chip,
  Zoom,
  Stack,
  Avatar,
  Button,
  Divider,
  Typography,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useSocialInsights } from 'src/hooks/use-social-insights';

import { extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import { formatNumber, calculateSummaryStats } from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';

import PitchModal from './pitch-modal';

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: { xs: 2, sm: 3 },
  width: '100%',
  '& .header': {
    borderBottom: '1px solid #e0e0e0',
    mx: { xs: -2, sm: -3 },
    mt: -1,
    mb: 2,
    pb: 1.5,
    pt: -1,
    px: { xs: 1, sm: 1.8 },
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
};

const findLatestPackage = (packages) => {
  if (!packages || packages.length === 0) {
    return null;
  }
  const latestPackage = packages.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);
    return currentDate > latestDate ? current : latest;
  });
  return latestPackage;
};

const CampaignOverviewClient = ({ campaign, onUpdate }) => {
  const navigate = useNavigate();
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);

  const latestPackageItem = useMemo(() => {
    const client = campaign?.company || campaign?.brand?.company;
    if (client && client?.subscriptions?.length) {
      let packageItem = findLatestPackage(client?.subscriptions);
      if (!packageItem) return null;
      packageItem = {
        ...packageItem,
        totalCredits:
          packageItem.totalCredits ||
          packageItem.package?.credits ||
          packageItem.customPackage?.customCredits,
        availableCredits:
          (packageItem.totalCredits ||
            packageItem.package?.credits ||
            packageItem.customPackage?.customCredits) - packageItem.creditsUsed,
      };
      return packageItem;
    }
    return null;
  }, [campaign]);


  const postingSubmissions = useMemo(() => {
    const submissions = campaign?.submission || [];
    return extractPostingSubmissions(submissions);
  }, [campaign?.submission]);

  const {
    data: insightsData,
    isLoading: loadingInsights,
    error: insightsError,
  } = useSocialInsights(postingSubmissions, campaign?.id);

  const summaryStats = useMemo(() => {
    if (!insightsData || insightsData.length === 0) return null;
    return calculateSummaryStats(insightsData);
  }, [insightsData]);

  // Calculate metrics with real percentage changes based on multiple posts
  const metrics = useMemo(() => {
    if (!summaryStats) {
      return {
        views: { value: 0, change: 0, increase: true },
        likes: { value: 0, change: 0, increase: true },
        comments: { value: 0, change: 0, increase: true }
      };
    }

    const views = summaryStats.totalViews || 0;
    const likes = summaryStats.totalLikes || 0;
    const comments = summaryStats.totalComments || 0;

    // Calculate real trends by comparing with previous posts
    const calculateRealTrend = (currentValue, metricType) => {
      if (!insightsData || insightsData.length < 2) {
        // If we don't have enough data for comparison, show no change
        return { change: 0, increase: true };
      }

      // Get the metric value from insights data
      const getMetricValue = (insight, metricName) => {
        if (!insight || !Array.isArray(insight)) return 0;
        const metric = insight.find(item => item.name === metricName);
        return metric ? metric.value : 0;
      };

      // Calculate average of previous posts (excluding the latest one)
      const previousPosts = insightsData.slice(0, -1); // All posts except the latest
      const currentPost = insightsData[insightsData.length - 1]; // Latest post

      if (previousPosts.length === 0) {
        return { change: 0, increase: true };
      }

      // Calculate average of previous posts
      const previousAverage = previousPosts.reduce((sum, post) => sum + getMetricValue(post.insight, metricType), 0) / previousPosts.length;

      // Get current post value
      const currentPostValue = getMetricValue(currentPost.insight, metricType);

      // Calculate percentage change
      let change = 0;
      let increase = true;

      if (previousAverage > 0) {
        change = ((currentPostValue - previousAverage) / previousAverage) * 100;
        increase = change >= 0;
      } else if (currentPostValue > 0) {
        // If previous average was 0 but current has value, it's a 100% increase
        change = 100;
        increase = true;
      }

      return { 
        change: Math.round(change * 10) / 10, // Round to 1 decimal place
        increase 
      };
    };

    return {
      views: {
        value: views,
        ...calculateRealTrend(views, 'views')
      },
      likes: {
        value: likes,
        ...calculateRealTrend(likes, 'likes')
      },
      comments: {
        value: comments,
        ...calculateRealTrend(comments, 'comments')
      }
    };
  }, [summaryStats, insightsData]);

  const handleViewPitch = (pitch) => {
    setSelectedPitch(pitch);
    setOpenPitchModal(true);
  };

  const handleClosePitchModal = () => {
    setOpenPitchModal(false);
  };

  const handleOpenMediaKit = (creatorUser) => {
    // Support being called with either the shortlisted item or the nested user
    const creatorId = creatorUser?.creator?.id || creatorUser?.user?.creator?.id;
    if (creatorId) {
      navigate(paths.dashboard.creator.mediaKit(creatorId));
    }
  };

  // Filter pitches to only show approved ones for client users
  const approvedPitches = campaign?.pitch?.filter((pitch) => pitch.status === 'APPROVED') || [];
  const shortlistedCreators = campaign?.shortlisted || [];
  const referenceLinks = campaign?.campaignBrief?.referencesLinks || [];
  const otherAttachments = campaign?.campaignBrief?.otherAttachments || [];

  return (
    <>
      {/* Campaign Objective and Analytics Section */}
      <Grid container spacing={1} sx={{ mb: { xs: 2, sm: 1 } }}>
        <Grid item xs={12}>
          <Box sx={{ px: { xs: 0.5, sm: 0 } }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: 'Aileron, sans-serif',
                color: '#000000',
                fontWeight: 600,
                mb: 0.5,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Campaign Objective
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontFamily: 'Instrument Serif, serif',
                color: '#1340FF',
                fontWeight: 500,
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              Increase Brand Awareness
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Analytics Section */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 3 } }}>
        <Grid item xs={12} md={3}>
          <Box 
            sx={{ 
              bgcolor: '#1340FF',
              borderRadius: 2,
              p: { xs: 1.5, sm: 1.8 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
              height: { xs: 'auto', sm: 'calc(130px + 1rem)' }, 
              minHeight: { xs: '120px', sm: 'auto' }
            }}
          >
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: 'Aileron, sans-serif',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  mb: 0.2,
                  fontSize: { xs: '0.95rem', sm: '1.05rem' }
                }}
              >
                Check out your campaign analytics!
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: 'Aileron, sans-serif',
                  color: '#FFFFFF',
                  opacity: 0.9,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  lineHeight: 1.3
                }}
              >
                View real time insights and see how your campaign is performing
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              onClick={() => {
                try {
                  localStorage.setItem('campaigndetail', 'analytics');
                  window.dispatchEvent(new CustomEvent('switchCampaignTab', { detail: 'analytics' }));
                } catch (e) {
                  // Silently fail if localStorage is not available
                }
                // No navigation needed; campaign-detail-view listens for the event and switches tabs in-place
              }}
              sx={{
                textTransform: 'none',
                bgcolor: 'white',
                color: '#1340FF',
                fontWeight: 600,
                fontSize: '0.7rem',
                py: 0.2,
                px: 1.3,
                mt: { xs: 1.5, sm: 0.5 },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
                alignSelf: 'flex-start',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            >
              View Analytics
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Box sx={{ px: { xs: 0.5, sm: 0 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    color: '#000000',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  Performance Summary
                </Typography>
                {loadingInsights && (
                  <CircularProgress size={16} sx={{ color: '#1340FF' }} />
                )}
                {insightsError && (
                  <Typography variant="caption" sx={{ color: '#F44336', fontStyle: 'italic' }}>
                    Analytics data unavailable
                  </Typography>
                )}
              </Stack>
              
 
            </Stack>
            
  
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 2, sm: 2.5 }}
              sx={{ 
                height: { sm: '100%' }, 
                display: 'flex', 
                alignItems: 'flex-end',
                mt: 0.8
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: '#F5F5F5',
                  borderRadius: 2,
                  p: { xs: 2, sm: 1.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flex: 1,
                  minWidth: { xs: '100%', sm: 180 },
                  height: { xs: 'auto', sm: 100 },
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="body1" sx={{ lineHeight: 1.2, fontWeight: 500, whiteSpace: 'nowrap', color: '#636366', fontFamily: 'Aileron, sans-serif' }}>
                    Views
                  </Typography>
                  <Stack direction="column" spacing={0.2} alignItems="flex-start">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify 
                        icon={metrics.views.increase ? "eva:arrow-up-fill" : "eva:arrow-down-fill"} 
                        sx={{ 
                          color: metrics.views.increase ? '#4CAF50' : '#F44336',
                          width: 16,
                          height: 16
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: metrics.views.increase ? '#4CAF50' : '#F44336',
                          fontWeight: 600
                        }}
                      >
                        {metrics.views.change}%
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#636366', pl: 0.3, fontSize: '0.75rem', fontFamily: 'Aileron, sans-serif' }}>
                      from campaign average
                    </Typography>
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 1,
                    bgcolor: '#1340FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 400,
                  }}
                >
                  {loadingInsights ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    formatNumber(metrics.views.value)
                  )}
                </Box>
              </Box>

              <Box 
                sx={{ 
                  bgcolor: '#F5F5F5',
                  borderRadius: 2,
                  p: { xs: 2, sm: 1.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flex: 1,
                  minWidth: { xs: '100%', sm: 180 },
                  height: { xs: 'auto', sm: 100 },
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="body1" sx={{ lineHeight: 1.2, fontWeight: 500, whiteSpace: 'nowrap', color: '#636366', fontFamily: 'Aileron, sans-serif' }}>
                    Likes
                  </Typography>
                  <Stack direction="column" spacing={0.2} alignItems="flex-start">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify 
                        icon={metrics.likes.increase ? "eva:arrow-up-fill" : "eva:arrow-down-fill"} 
                        sx={{ 
                          color: metrics.likes.increase ? '#4CAF50' : '#F44336',
                          width: 16,
                          height: 16
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: metrics.likes.increase ? '#4CAF50' : '#F44336',
                          fontWeight: 600
                        }}
                      >
                        {metrics.likes.change}%
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#636366', pl: 0.3, fontSize: '0.75rem', fontFamily: 'Aileron, sans-serif' }}>
                      from campaign average
                    </Typography>
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 1,
                    bgcolor: '#1340FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 400,
                  }}
                >
                  {loadingInsights ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    formatNumber(metrics.likes.value)
                  )}
                </Box>
              </Box>

              <Box 
                sx={{ 
                  bgcolor: '#F5F5F5',
                  borderRadius: 2,
                  p: { xs: 2, sm: 1.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flex: 1,
                  minWidth: { xs: '100%', sm: 180 },
                  height: { xs: 'auto', sm: 100 },
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="body1" sx={{ lineHeight: 1.2, fontWeight: 500, whiteSpace: 'nowrap', color: '#636366', fontFamily: 'Aileron, sans-serif' }}>
                    Comments
                  </Typography>
                  <Stack direction="column" spacing={0.2} alignItems="flex-start">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify 
                        icon={metrics.comments.increase ? "eva:arrow-up-fill" : "eva:arrow-down-fill"} 
                        sx={{ 
                          color: metrics.comments.increase ? '#4CAF50' : '#F44336',
                          width: 16,
                          height: 16
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: metrics.comments.increase ? '#4CAF50' : '#F44336',
                          fontWeight: 600
                        }}
                      >
                        {metrics.comments.change}%
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#636366', pl: 0.3, fontSize: '0.75rem', fontFamily: 'Aileron, sans-serif' }}>
                      from campaign average
                    </Typography>
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 1,
                    bgcolor: '#1340FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 400,
                  }}
                >
                  {loadingInsights ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    formatNumber(metrics.comments.value)
                  )}
                </Box>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Existing Content */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Left Column: Creator Pitches and Credit Tracking */}
        <Grid item xs={12} md={6}>
           <Zoom in>
            <Box sx={{ ...BoxStyle, mb: 3 }}>
              <Box className="header">
                <Iconify
                  icon="solar:money-bag-bold"
                  sx={{
                    color: '#203ff5',
                    width: 20,
                    height: 20,
                  }}
                />
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ flex: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#221f20',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                    }}
                  >
                    CREDITS TRACKING
                  </Typography>
                </Stack>
              </Box>

              <Stack spacing={1}>
                {campaign?.campaignCredits && latestPackageItem ? (
                  <Stack spacing={1.5} color="text.secondary">
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#636366' }}>
                        Campaign Credits
                      </Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#636366' }}>
                        {campaign?.campaignCredits ?? 0} UGC Credits
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#636366' }}>
                        Credits Utilized
                      </Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#636366' }}>
                        {campaign?.submissionVersion === 'v4' ? (() => {
                            const approvedAgreements = (campaign?.submission || []).filter(sub => 
                              (sub.content && typeof sub.content === 'string' && 
                               sub.content.toLowerCase().includes('agreement')) &&
                              (sub.status === 'APPROVED')
                            );
                            
                            if (approvedAgreements.length === 0) {
                              return '0 UGC Credits';
                            }
                            
                            const utilizedCredits = approvedAgreements.reduce((total, agreement) => {
                              let creator = campaign?.shortlisted?.find(c => c.userId === agreement.userId);
                              
                              if (!creator && typeof agreement.userId === 'string') {
                                creator = campaign?.shortlisted?.find(c => 
                                  typeof c.userId === 'string' && c.userId.toLowerCase() === agreement.userId.toLowerCase()
                                );
                              }
                              
                              if (!creator) {
                                creator = campaign?.shortlisted?.find(c => 
                                  c.user?.name === 'Tupac Shakir'
                                );
                              }
                              
                              return total + (creator?.ugcVideos || 0);
                            }, 0);
                            
                            return `${utilizedCredits} UGC Credits`;
                          })() : 
                          `${campaign?.creditsUtilized || 0} UGC Credits`}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#636366' }}>
                        Credits Pending
                      </Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#636366' }}>
                        {campaign?.submissionVersion === 'v4' ? (() => {
                            const approvedAgreements = (campaign?.submission || []).filter(sub => 
                              // Check if content contains 'agreement' since type might be undefined
                              (sub.content && typeof sub.content === 'string' && 
                               sub.content.toLowerCase().includes('agreement')) &&
                              (sub.status === 'APPROVED')
                            );
                            
                            const utilizedCredits = approvedAgreements.reduce((total, agreement) => {
                              let creator = campaign?.shortlisted?.find(c => c.userId === agreement.userId);
                              
                              if (!creator && typeof agreement.userId === 'string') {
                                creator = campaign?.shortlisted?.find(c => 
                                  typeof c.userId === 'string' && c.userId.toLowerCase() === agreement.userId.toLowerCase()
                                );
                              }

                              if (!creator) {
                                creator = campaign?.shortlisted?.find(c => 
                                  c.user?.name === 'Tupac Shakir'
                                );
                              }
                              
                              return total + (creator?.ugcVideos || 0);
                            }, 0);
                            
                            return `${Math.max(0, (campaign?.campaignCredits || 0) - utilizedCredits)} UGC Credits`;
                          })() : 
                          `${campaign?.creditsPending ?? 0} UGC Credits`}
                      </Typography>
                    </Stack>
                  </Stack>
                ) : (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}
                  >
                    Not connected to any package
                  </Typography>
                )}
              </Stack>
            </Box>
          </Zoom>
          <Zoom in>
            <Box sx={{
              ...BoxStyle,
              mt: 3,
              minHeight: approvedPitches.length === 0 ? 'auto' : 'auto',
            }}>
              <Box className="header" sx={{ px: { xs: 1, sm: 1.8 } }}>
                <Iconify
                  icon="solar:user-hand-up-bold"
                  sx={{
                    color: '#203ff5',
                    width: 20,
                    height: 20,
                  }}
                />
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#221f20',
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    }}
                  >
                    CREATOR PITCHES
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#221f20',
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    ({approvedPitches.length})
                  </Typography>
                </Stack>
              </Box>
              
              {approvedPitches.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', py: 1, textAlign: 'center', display: 'block' }}
                >
                  No approved pitches yet
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {approvedPitches.map((pitch, index) => (
                    <Stack
                      key={pitch.id}
                      direction="row"
                      alignItems="center"
                      spacing={{ xs: 1, sm: 2 }}
                      sx={{
                        pt: 1.5,
                        pb: index !== approvedPitches.length - 1 ? 1.5 : 0.5,
                        borderBottom:
                          index !== approvedPitches.length - 1
                            ? '1px solid #e7e7e7'
                            : 'none',
                      }}
                    >
                      <Avatar
                        src={pitch.user?.photoURL}
                        alt={pitch.user?.name}
                        sx={{
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          border: '2px solid',
                          borderColor: 'background.paper',
                          flexShrink: 0,
                        }}
                      >
                        {pitch.user?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Stack sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle3"
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {pitch.user?.name}
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleViewPitch(pitch)}
                        sx={{
                          textTransform: 'none',
                          minHeight: { xs: 34, sm: 38 },
                          minWidth: { xs: 90, sm: 110 },
                          bgcolor: '#231F20',
                          color: '#FFFFFF',
                          border: '1.5px solid',
                          borderColor: '#231F20',
                          borderBottom: '3px solid',
                          borderBottomColor: '#000000',
                          borderRadius: 1.15,
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          px: { xs: 1, sm: 2 },
                          flexShrink: 0,
                          '&:hover': {
                            bgcolor: '#000000',
                          },
                        }}
                      >
                        View Pitch
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Zoom>
        </Grid>

        {/* Right Column: Shortlisted Creators */}
        <Grid item xs={12} md={6}>
          <Zoom in>
            <Box sx={{
              ...BoxStyle,
              minHeight: shortlistedCreators.length === 0 ? 'auto' : 'auto',
            }}>
              <Box className="header" sx={{ px: { xs: 1, sm: 1.8 } }}>
                <Iconify
                  icon="solar:users-group-rounded-bold"
                  sx={{
                    color: '#203ff5',
                    width: 20,
                    height: 20,
                  }}
                />
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#221f20',
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    }}
                  >
                    SHORTLISTED CREATORS
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#221f20',
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    ({shortlistedCreators.length})
                  </Typography>
                </Stack>
              </Box>
              
              {shortlistedCreators.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', py: 1, textAlign: 'center', display: 'block' }}
                >
                  No shortlisted creators yet
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {shortlistedCreators.map((item, index) => (
                    <Stack
                      key={item.userId}
                      direction="row"
                      alignItems="center"
                      spacing={{ xs: 1, sm: 2 }}
                      sx={{
                        pt: 1.5,
                        pb: index !== shortlistedCreators.length - 1 ? 1.5 : 0.5,
                        borderBottom:
                          index !== shortlistedCreators.length - 1
                            ? '1px solid #e7e7e7'
                            : 'none',
                      }}
                    >
                      <Avatar
                        src={item.user?.photoURL}
                        alt={item.user?.name}
                        sx={{
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          border: '2px solid',
                          borderColor: 'background.paper',
                          flexShrink: 0,
                        }}
                      >
                        {item.user?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Stack sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle3"
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {item.user?.name}
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenMediaKit(item)}
                        sx={{
                          textTransform: 'none',
                          minHeight: { xs: 34, sm: 38 },
                          minWidth: { xs: 90, sm: 100 },
                          bgcolor: '#ffffff',
                          color: '#231F20',
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          px: { xs: 1, sm: 1.5 },
                          flexShrink: 0,
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            border: '1px solid #e0e0e0',
                          },
                        }}
                      >
                        Media Kit
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Zoom>

          {/* Reference Links */}
          <Zoom in>
            <Box sx={{ 
              ...BoxStyle, 
              mt: 3,
              minHeight: referenceLinks.length === 0 ? 'auto' : 'auto',
            }}>
              <Box className="header">
                <Iconify
                  icon="solar:link-circle-bold"
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
                    fontSize: '0.8rem',
                  }}
                >
                  REFERENCE LINKS
                </Typography>
              </Box>
              
              {referenceLinks.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', py: 1, textAlign: 'center', display: 'block' }}
                >
                  No reference links available
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {referenceLinks.map((link, index) => (
                    <Link 
                      key={index} 
                      href={link} 
                      target="_blank" 
                      rel="noopener"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#203ff5',
                        py: 0.5,
                        borderBottom: index < referenceLinks.length - 1 ? '1px solid #e7e7e7' : 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      <Iconify icon="eva:link-fill" sx={{ mr: 1, width: 16, height: 16 }} />
                      {link}
                    </Link>
                  ))}
                </Stack>
              )}
            </Box>
          </Zoom>

          {/* Other Attachments */}
          <Zoom in>
            <Box sx={{ 
              ...BoxStyle, 
              mt: 3,
              minHeight: otherAttachments.length === 0 ? 'auto' : 'auto',
            }}>
              <Box className="header">
                <Iconify
                  icon="solar:file-bold"
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
                    fontSize: '0.8rem',
                  }}
                >
                  OTHER ATTACHMENTS
                </Typography>
              </Box>
              
              {otherAttachments.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', py: 1, textAlign: 'center', display: 'block' }}
                >
                  No attachments available
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {otherAttachments.map((attachment, index) => (
                    <Box
                      key={index}
                      sx={{
                        py: 0.5,
                        borderBottom: index < otherAttachments.length - 1 ? '1px solid #e7e7e7' : 'none',
                      }}
                    >
                      <Chip
                        label={attachment.split('/').pop()}
                        onClick={() => window.open(attachment, '_blank')}
                        icon={<Iconify icon="eva:file-text-fill" />}
                        sx={{ 
                          maxWidth: '100%',
                          '& .MuiChip-label': { 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Zoom>
        </Grid>
      </Grid>


      <PitchModal
        pitch={selectedPitch}
        open={openPitchModal}
        onClose={handleClosePitchModal}
        campaign={campaign}
      />
    </>
  );
};

CampaignOverviewClient.propTypes = {
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};

export default CampaignOverviewClient; 