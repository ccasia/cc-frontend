/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import React, { useMemo, useState, useEffect } from 'react';

import { ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material';
import {
  Box,
  Grid,
  Link,
  Alert,
  Stack,
  Avatar,
  Button,
  Tooltip,
  Divider,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';
import { useSocialInsights } from 'src/hooks/use-social-insights';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import {
  formatNumber,
  getMetricValue,
  calculateSummaryStats,
  calculateEngagementRate,
} from 'src/utils/socialMetricsCalculator';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { TopCreatorsLineChart, EngagementRateHeatmap } from 'src/components/trend-analysis';
import PlatformOverviewMobile from 'src/components/campaign-analytics/PlatformOverviewMobile';
import PlatformOverviewDesktop from 'src/components/campaign-analytics/PlatformOverviewDesktop';

// import PCRReportPage from './pcr-report-page';

const PlatformToggle = ({ lgUp, availablePlatforms, selectedPlatform, handlePlatformChange }) => {
  const platformConfig = [
    { key: 'ALL', label: 'Overview', icon: null, color: '#1340FF', display: true },
    {
      key: 'Instagram',
      label: 'Instagram',
      icon: 'prime:instagram',
      color: '#C13584',
      display: lgUp,
    },
    { key: 'TikTok', label: 'TikTok', icon: 'prime:tiktok', color: '#000000', display: lgUp },
  ];

  const availablePlatformConfig = platformConfig.filter(
    (config) => config.key === 'ALL' || availablePlatforms.includes(config.key)
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {availablePlatformConfig.map((config) => (
          <Button
            key={config.key}
            onClick={() => handlePlatformChange(config.key)}
            sx={{
              width: 135,
              height: 40,
              borderRadius: '8px',
              borderWidth: '2px',
              bgcolor: 'transparent',
              color: selectedPlatform === config.key ? config.color : '#9E9E9E',
              border:
                selectedPlatform === config.key ? `2px solid ${config.color}` : '2px solid #9E9E9E',
              fontWeight: 600,
              fontSize: 16,
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'transparent',
                border: `2px solid ${config.color}`,
                color: config.color,
                '& .iconify': {
                  color: config.color,
                },
              },
            }}
          >
            {config.display ? (
              <>
                {config.icon && (
                  <Iconify
                    icon={config.icon}
                    className="iconify"
                    sx={{
                      height: 30,
                      width: 30,
                      mr: config.key === 'TikTok' ? 0 : 0.5,
                      color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                    }}
                  />
                )}
                {config.label}
              </>
            ) : (
              <>
                {config.icon && (
                  <Iconify
                    icon={config.icon}
                    className="iconify"
                    sx={{
                      height: 35,
                      width: 35,
                      color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                    }}
                  />
                )}
              </>
            )}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

const getPlatformLabel = (platform) => {
  if (platform === 'ALL') return 'Total Creators';
  if (platform === 'Instagram') return 'Instagram Posts';
  if (platform === 'TikTok') return 'TikTok Posts';
  return '';
};

const RenderEngagementCard = ({
  title,
  value,
  metricKey,
  filteredInsightsData,
  filteredSubmissions,
  findTopPerformerByMetric,
}) => {
  const topPerformer = findTopPerformerByMetric(
    metricKey,
    filteredInsightsData,
    filteredSubmissions
  );
  const { data: topCreator } = useGetCreatorById(topPerformer?.submission?.user);
  const percentage = topPerformer && value > 0 ? Math.round((topPerformer.value / value) * 100) : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 2,
        height: { xs: 100, sm: 116 },
        background: '#F5F5F5',
        boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
        borderRadius: '20px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            height: { xs: 70, sm: 85 },
            minWidth: 0,
            mr: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: 16, sm: 18 },
              color: '#636366',
              maxWidth: { xs: 70, sm: 120, md: 200 },
            }}
          >
            {title}
          </Typography>

          {topPerformer && (
            <Box>
              <Typography
                fontSize={{ xs: 12, sm: 14 }}
                component="span"
                color="#1340FF"
                fontWeight={600}
              >
                {percentage}%{' '}
                <Typography fontSize={{ xs: 12, sm: 14 }} color="#000" component="span">
                  from
                </Typography>
              </Typography>
              <Typography
                fontSize={{ xs: 12, sm: 14 }}
                color="#000"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: 85, sm: 120, md: 140 },
                  display: 'block',
                }}
              >
                {topCreator?.user?.name || 'Unknown'}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: { xs: 60, sm: 70, md: 79 },
            height: { xs: 60, sm: 70, md: 79 },
            background: '#1340FF',
            borderRadius: '8px',
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: 16, sm: 20, md: 24 },
              color: '#FFFFFF',
            }}
          >
            {typeof value === 'number' ? formatNumber(value) : value}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const CampaignAnalytics = ({ campaign }) => {
  const campaignId = campaign?.id;
  const submissions = useMemo(() => campaign?.submission || [], [campaign?.submission]);
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [reportState, setReportState] = useState('generate'); // 'generate', 'loading', 'view'
  const [showReportPage, setShowReportPage] = useState(false);
  const itemsPerPage = 5;

  const lgUp = useResponsive('up', 'lg');
  const { socket } = useSocketContext();
  const { enqueueSnackbar } = useSnackbar();

  // Extract posting submissions with URLs directly from campaign prop
  const postingSubmissions = useMemo(() => extractPostingSubmissions(submissions), [submissions]);

  // Get available platforms in the campaign or provide defaults for empty state
  const availablePlatforms = useMemo(() => {
    if (postingSubmissions.length === 0) {
      // Return default platforms for empty state display
      return ['Instagram', 'TikTok'];
    }
    const platforms = [
      ...new Set(postingSubmissions.map((sub) => sub && sub.platform).filter(Boolean)),
    ];
    return platforms.length > 0 ? platforms : ['Instagram', 'TikTok'];
  }, [postingSubmissions]);

  // Filter submissions based on selected platform
  const filteredSubmissions = useMemo(() => {
    if (selectedPlatform === 'ALL') {
      return postingSubmissions.filter((sub) => sub && sub.platform);
    }
    return postingSubmissions.filter((sub) => sub && sub.platform === selectedPlatform);
  }, [postingSubmissions, selectedPlatform]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      displayedSubmissions,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [filteredSubmissions, currentPage, itemsPerPage]);

  // Get platform counts for beam display
  const platformCounts = useMemo(() => {
    const counts = { Instagram: 0, TikTok: 0 };
    postingSubmissions.forEach((sub) => {
      if (sub && sub.platform === 'Instagram') counts.Instagram += 1;
      if (sub && sub.platform === 'TikTok') counts.TikTok += 1;
    });
    return counts;
  }, [postingSubmissions]);

  // Fetch insights for posting submissions (always fetch all, filter for display)
  const {
    data: insightsData,
    isLoading: loadingInsights,
    error: insightsError,
    loadingProgress,
    mutate: refreshInsights,
    clearCache,
  } = useSocialInsights(postingSubmissions, campaignId);

  // Filter insights data based on selected platform
  const filteredInsightsData = useMemo(() => {
    if (selectedPlatform === 'ALL') {
      return insightsData;
    }
    return insightsData.filter((data) => {
      // Safety check: ensure data and submissionId exist
      if (!data || !data.submissionId) {
        return false;
      }
      const submission = postingSubmissions.find((sub) => sub && sub.id === data.submissionId);
      return submission && submission.platform === selectedPlatform;
    });
  }, [insightsData, selectedPlatform, postingSubmissions]);

  // Calculate summary statistics based on filtered data or provide empty state
  const summaryStats = useMemo(() => {
    if (filteredInsightsData.length === 0) {
      // Return placeholder data when no insights are available
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalSaved: 0,
        totalReach: 0,
        totalPosts: 0,
        avgEngagementRate: 0,
      };
    }
    return calculateSummaryStats(filteredInsightsData);
  }, [filteredInsightsData]);

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => prev - 1);
  };


  // Socket event listener for media kit connections
  useEffect(() => {
    if (!socket || !campaignId) return undefined;

    const handleAnalyticsRefresh = (data) => {
      console.log('📡 Received analytics refresh event:', data);
      
      // Check if this user has submissions in current campaign
      const hasUserSubmissions = postingSubmissions.some(
        sub => sub.user === data.userId
      );
      
      if (hasUserSubmissions) {
        console.log(`🔄 ${data.platform} connected for user, refreshing analytics...`);
        enqueueSnackbar(`${data.platform} connected! Refreshing analytics...`, { 
          variant: 'success' 
        });
        
        // Clear cache and re-fetch with a small delay to ensure API is ready
        clearCache();
        setTimeout(() => {
          refreshInsights();
        }, 1500);
      }
    };

    // Join campaign room and listen for analytics refresh events
    socket.joinCampaign(campaignId);
    socket.on('analytics:refresh', handleAnalyticsRefresh);
    
    return () => {
      socket.off('analytics:refresh', handleAnalyticsRefresh);
      socket.leaveCampaign(campaignId);
    };
  }, [socket, campaignId, postingSubmissions, clearCache, refreshInsights, enqueueSnackbar]);

  // Reset to page 1 when platform changes
  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
    setCurrentPage(1);
  };

  // No campaign
  if (!campaign) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Campaign information not available.
      </Alert>
    );
  }

  // No campaign ID
  if (!campaignId) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Campaign ID not available.
      </Alert>
    );
  }

  // eslint-disable-next-line react/no-unstable-nested-components
  const CoreMetricsSection = ({ summaryStats: stats }) => {
    if (!stats) return null;

    // Define metrics configuration
    const metricsConfig = [
      {
        key: 'views',
        label: 'Views',
        value: stats.totalViews,
        metricKey: 'views',
      },
      {
        key: 'likes',
        label: 'Likes',
        value: stats.totalLikes,
        metricKey: 'likes',
      },
      {
        key: 'comments',
        label: 'Comments',
        value: stats.totalComments,
        metricKey: 'comments',
      },
      {
        key: 'saved',
        label: 'Saved',
        value: stats.totalSaved,
        metricKey: 'saved',
        // Only show for Instagram
        condition:
          selectedPlatform === 'Instagram' ||
          (selectedPlatform === 'ALL' && availablePlatforms.includes('Instagram')),
      },
    ].filter((metric) => metric.condition !== false);

    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          {metricsConfig.map((metric) => (
            <Grid item xs={6} sm={6} md={3} key={metric.key}>
              <RenderEngagementCard
                title={metric.label}
                value={metric.value}
                metricKey={metric.metricKey}
                filteredInsightsData={filteredInsightsData}
                filteredSubmissions={filteredSubmissions}
                findTopPerformerByMetric={findTopPerformerByMetric}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const PlatformOverviewLayout = () => (
      <Box sx={{ mb: 3 }}>
        {/* Mobile Layout */}
        <PlatformOverviewMobile
          platformCounts={platformCounts}
          selectedPlatform={selectedPlatform}
          filteredInsightsData={filteredInsightsData}
          filteredSubmissions={filteredSubmissions}
          insightsData={insightsData}
          summaryStats={summaryStats}
          availablePlatforms={availablePlatforms}
          getPlatformLabel={getPlatformLabel}
        />

        {/* Desktop Layout */}
        <PlatformOverviewDesktop
          platformCounts={platformCounts}
          selectedPlatform={selectedPlatform}
          summaryStats={summaryStats}
          availablePlatforms={availablePlatforms}
          filteredInsightsData={filteredInsightsData}
          filteredSubmissions={filteredSubmissions}
          insightsData={insightsData}
          getPlatformLabel={getPlatformLabel}
        />
      </Box>
    );

  // Add this new function before CoreMetricsSection
  const findTopPerformerByMetric = (metricKey, insights, submissionsList) => {
    if (!insights || insights.length === 0) return null;

    let topPerformer = null;
    let highestValue = 0;

    insights.forEach((insightData) => {
      const submission = submissionsList.find((sub) => sub.id === insightData.submissionId);
      if (submission) {
        const value = getMetricValue(insightData.insight, metricKey);
        if (value > highestValue) {
          highestValue = value;
          topPerformer = {
            submission,
            value,
            insightData,
          };
        }
      }
    });

    return topPerformer;
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const UserPerformanceCard = ({
    engagementRate,
    submission,
    insightData,
    loadingInsights: isLoadingInsights,
  }) => {
    const { data: creator, isLoading: loadingCreator } = useGetCreatorById(submission.user);

    return (
      <Grid item xs={12}>
        <Box borderRadius={1} border="2px solid #F5F5F5">
          <Box sx={{ py: 1 }}>
            {/* Desktop Layout (md+) */}
            <Box px={{ xs: 0, sm: 2 }} display={{ xs: 'none', md: 'flex' }} alignItems="center">
              {/* Left Side: Creator Info */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor:
                      submission && submission.platform === 'Instagram' ? '#E4405F' : '#000000',
                  }}
                >
                  {loadingCreator ? (
                    <CircularProgress size={20} />
                  ) : (
                    creator?.user?.name?.charAt(0) || 'U'
                  )}
                </Avatar>
                <Box width={230}>
                  <Typography variant="h5" fontWeight={500}>
                    {loadingCreator ? 'Loading...' : creator?.user?.name || 'Unknown Creator'}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    textOverflow="ellipsis"
                    overflow="auto"
                    sx={{ scrollbarWidth: 'none' }}
                  >
                    {creator?.user.creator.instagram || creator?.user.creator.tiktok || ''}
                  </Typography>
                </Box>
              </Stack>

              {/* Center: Metrics Display */}
              {(() => {
                if (insightData) {
                  return (
                    <Box display="flex" alignItems="center" mr="auto" ml={2}>
                      {/* Engagement Rate */}
                      <Box>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={16}
                          fontWeight={600}
                          color="#636366"
                        >
                          Engagement Rate
                        </Typography>
                        <Typography
                          fontFamily="Instrument Serif"
                          fontSize={40}
                          fontWeight={400}
                          color="#1340FF"
                        >
                          {engagementRate}%
                        </Typography>
                      </Box>

                      {/* Divider */}
                      <Divider
                        sx={{ width: '1px', height: '80px', backgroundColor: '#1340FF', mx: 2 }}
                      />

                      {/* Views */}
                      <Box sx={{ width: 80 }}>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={16}
                          fontWeight={600}
                          color="#636366"
                        >
                          Views
                        </Typography>
                        <Typography
                          fontFamily="Instrument Serif"
                          fontSize={40}
                          fontWeight={400}
                          color="#1340FF"
                        >
                          {formatNumber(getMetricValue(insightData.insight, 'views'))}
                        </Typography>
                      </Box>

                      {/* Divider */}
                      <Divider
                        sx={{ width: '1px', height: '80px', backgroundColor: '#1340FF', mx: 2 }}
                      />

                      {/* Likes */}
                      <Box>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={16}
                          fontWeight={600}
                          color="#636366"
                        >
                          Likes
                        </Typography>
                        <Typography
                          fontFamily="Instrument Serif"
                          fontSize={40}
                          fontWeight={400}
                          color="#1340FF"
                        >
                          {formatNumber(getMetricValue(insightData.insight, 'likes'))}
                        </Typography>
                      </Box>

                      {/* Divider */}
                      <Divider
                        sx={{ width: '1px', height: '80px', backgroundColor: '#1340FF', mx: 2 }}
                      />

                      {/* Comments */}
                      <Box>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={16}
                          fontWeight={600}
                          color="#636366"
                        >
                          Comments
                        </Typography>
                        <Typography
                          fontFamily="Instrument Serif"
                          fontSize={40}
                          fontWeight={400}
                          color="#1340FF"
                        >
                          {formatNumber(getMetricValue(insightData.insight, 'comments'))}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }
                if (loadingInsights) {
                  return (
                    <Box display="flex" alignItems="center" py={2} ml={4}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Loading metrics...
                      </Typography>
                    </Box>
                  );
                }
                return (
                  <Alert severity="info" sx={{ m: 1 }}>
                    Analytics data not available for this post.
                  </Alert>
                );
              })()}

              {/* Right Side: Thumbnail Preview */}
              {insightData ? (
                <Box>
                  <Link
                    href={insightData.postUrl}
                    target="_blank"
                    rel="noopener"
                    sx={{
                      display: 'block',
                      textDecoration: 'none',
                      '&:hover': {
                        opacity: 0.8,
                        transition: 'opacity 0.2s',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={insightData.thumbnail || insightData.video.media_url}
                      alt="Post thumbnail"
                      sx={{
                        width: 150,
                        height: 80,
                        borderRadius: 2,
                        objectFit: 'cover',
                        border: '1px solid #e0e0e0',
                        filter: 'brightness(0.9)',
                        opacity: 0.7,
                        '&:hover': {
                          filter: 'brightness(1)',
                          opacity: 1,
                          transition: 'filter 0.3s ease, opacity 0.3s ease',
                        },
                      }}
                    />
                  </Link>
                </Box>
              ) : (
                <Box sx={{ ml: 4 }}>
                  <Tooltip title="View Post">
                    <IconButton
                      component={Link}
                      href={submission.postUrl}
                      target="_blank"
                      rel="noopener"
                      size="small"
                    >
                      <Iconify icon="solar:external-link-outline" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {/* Mobile Layout (xs) */}
            <Box display={{ xs: 'flex', md: 'none' }} flexDirection="column" alignItems="center" sx={{ py: 2 }}>
              {/* Top: Creator Info */}
              <Box display="flex" mb={2} width={300}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor:
                    submission && submission.platform === 'Instagram' ? '#E4405F' : '#000000',
                    mr: 2,
                  }}
                >
                  {loadingCreator ? (
                    <CircularProgress size={18} />
                  ) : (
                    creator?.user?.name?.charAt(0) || 'U'
                  )}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={500}>
                    {loadingCreator ? 'Loading...' : creator?.user?.name || 'Unknown Creator'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                    }}
                  >
                    {creator?.user.email}
                  </Typography>
                </Box>
              </Box>

              {/* Middle: Metrics */}
              {(() => {
                if (insightData) {
                  return (
                    <Box display="flex" gap={1.5} textAlign="center" maxWidth={300} mb={2}>
                      {/* Engagement Rate */}
                      <Box>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={12}
                          fontWeight={600}
                          color="#636366"
                        >
                          Engagement
                        </Typography>
                        <Typography
                          fontFamily="Instrument Serif"
                          fontSize={28}
                          fontWeight={400}
                          color="#1340FF"
                        >
                          {engagementRate}%
                        </Typography>
                      </Box>

                      {/* Divider */}
                      <Divider
                        sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF' }}
                      />

                      {/* Views */}
                      <Box>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={12}
                          fontWeight={600}
                          color="#636366"
                        >
                          Views
                        </Typography>
                        <Typography
                          fontFamily="Instrument Serif"
                          fontSize={28}
                          fontWeight={400}
                          color="#1340FF"
                        >
                          {formatNumber(getMetricValue(insightData.insight, 'views'))}
                        </Typography>
                      </Box>

                      {/* Divider */}
                      <Divider
                        sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF' }}
                      />

                      {/* Likes */}
                      <Box>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={12}
                          fontWeight={600}
                          color="#636366"
                        >
                          Likes
                        </Typography>
                        <Typography
                          fontFamily="Instrument Serif"
                          fontSize={28}
                          fontWeight={400}
                          color="#1340FF"
                        >
                          {formatNumber(getMetricValue(insightData.insight, 'likes'))}
                        </Typography>
                      </Box>

                      {/* Divider */}
                      <Divider
                        sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF' }}
                      />

                      {/* Comments */}
                      <Box>
                        <Typography
                          fontFamily="Aileron"
                          fontSize={12}
                          fontWeight={600}
                          color="#636366"
                        >
                          Comments
                        </Typography>
                        <Typography
                          fontFamily="Instrument Serif"
                          fontSize={28}
                          fontWeight={400}
                          color="#1340FF"
                        >
                          {formatNumber(getMetricValue(insightData.insight, 'comments'))}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }
                if (loadingInsights) {
                  return (
                    <Box display="flex" alignItems="center" justifyContent="center" py={3}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Loading metrics...
                      </Typography>
                    </Box>
                  );
                }
                return (
                  <Alert severity="info" sx={{ my: 2 }}>
                    Analytics data not available for this post.
                  </Alert>
                );
              })()}

              {/* Bottom: Thumbnail */}
              {insightData ? (
                <Box display="flex" justifyContent="center">
                  <Link
                    href={insightData.postUrl}
                    target="_blank"
                    rel="noopener"
                    sx={{
                      display: 'block',
                      textDecoration: 'none',
                      '&:hover': {
                        opacity: 0.8,
                        transition: 'opacity 0.2s',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={insightData.thumbnail || insightData.video.media_url}
                      alt="Post thumbnail"
                      sx={{
                        width: 300,
                        height: 90,
                        borderRadius: 2,
                        objectFit: 'cover',
                        border: '1px solid #e0e0e0',
                        filter: 'brightness(0.9)',
                        opacity: 0.7,
                        '&:hover': {
                          filter: 'brightness(1)',
                          opacity: 1,
                          transition: 'filter 0.3s ease, opacity 0.3s ease',
                        },
                      }}
                    />
                  </Link>
                </Box>
              ) : (
                <Box display="flex" justifyContent="center">
                  <Tooltip title="View Post">
                    <IconButton
                      component={Link}
                      href={submission.postUrl}
                      target="_blank"
                      rel="noopener"
                      size="small"
                    >
                      <Iconify icon="solar:external-link-outline" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Grid>
    );
  };

  return (
    <Box>
      {/* Conditionally render PCR Report Page or Performance Summary */}
      {/* {showReportPage ? (
        <PCRReportPage 
          campaign={campaign} 
          onBack={() => setShowReportPage(false)} 
        />
      ) : ( */}
        <>
      {/* Platform Toggle */}
      {availablePlatforms.length > 1 && (
        <PlatformToggle
          lgUp={lgUp}
          availablePlatforms={availablePlatforms}
          selectedPlatform={selectedPlatform}
          handlePlatformChange={handlePlatformChange}
        />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography fontSize={24} fontWeight={600} fontFamily="Aileron">
        Performance Summary
      </Typography>
        
        {/* Generate Report Button */}
        {/* <Button
          disabled={reportState === 'loading'}
          sx={{
            width: '186.07px',
            height: '44px',
            borderRadius: '8px',
            gap: '6px',
            padding: '10px 16px 13px 16px',
            background: reportState === 'loading' 
              ? 'linear-gradient(90deg, #B8B8B8 0%, #9E9E9E 100%)' 
              : 'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
            boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            '&:hover': {
              background: reportState === 'loading' 
                ? 'linear-gradient(90deg, #B8B8B8 0%, #9E9E9E 100%)' 
                : 'linear-gradient(90deg, #7A4AEE 0%, #0330EF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
            },
            '&:active': {
              boxShadow: reportState === 'loading' 
                ? '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset' 
                : '0px -1px 0px 0px rgba(0, 0, 0, 0.1) inset',
              transform: reportState === 'loading' ? 'none' : 'translateY(1px)',
            },
            '&:disabled': {
              color: '#FFFFFF',
            }
          }}
          onClick={() => {
            if (reportState === 'generate') {
              // Start loading
              setReportState('loading');
              
              // Simulate report generation (replace with actual API call)
              setTimeout(() => {
                setReportState('view');
              }, 3000); // 3 second loading simulation
              
            } else if (reportState === 'view') {
              // Show PCR report page
              setShowReportPage(true);
            }
          }}
        >
          {reportState === 'loading' && (
            <CircularProgress 
              size={16} 
              sx={{ 
                color: '#FFFFFF', 
                mr: 1 
              }} 
            />
          )}
          {reportState === 'generate' && 'Generate Report'}
          {reportState === 'loading' && 'Generating...'}
          {reportState === 'view' && 'View Report'}
        </Button> */}
      </Box>

      {/* Loading state for insights */}
      {loadingInsights && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">
              Loading insights data... ({loadingProgress?.loaded || 0}/
              {loadingProgress?.total || postingSubmissions.length} completed)
            </Typography>
          </Stack>
          {loadingProgress?.total > 0 && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <Box
                sx={{
                  height: 4,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    backgroundColor: '#1340FF',
                    borderRadius: 2,
                    width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {Math.round((loadingProgress.loaded / loadingProgress.total) * 100)}% complete
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Error Alert */}
      {insightsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading insights: {insightsError?.message || 'Unknown error'}
        </Alert>
      )}

      {/* Core Metrics Section */}
      <CoreMetricsSection insightsData={filteredInsightsData} summaryStats={summaryStats} />

      {/* Platform Overview and Additional Metrics Layout */}
      {availablePlatforms.length > 0 && (
        <PlatformOverviewLayout
          postCount={filteredSubmissions.length}
          insightsData={filteredInsightsData}
          summaryStats={summaryStats}
          platformCounts={platformCounts}
          selectedPlatform={selectedPlatform}
        />
      )}

      {/* Trends Analysis */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        flex={1} 
        spacing={4} 
        justifyContent="space-between" 
        minHeight={{ xs: 'auto', md: 500 }} 
        mb={2}
      >
        <Box flex={1} width="100%">
          <EngagementRateHeatmap 
            campaignId={campaignId} 
            platform={selectedPlatform === 'ALL' ? 'All' : selectedPlatform}
            weeks={6}
          />
        </Box>
        <Box flex={1} width="100%">
          <TopCreatorsLineChart
            campaignId={campaignId}
            platform={selectedPlatform === 'ALL' ? 'All' : selectedPlatform}
            days={7}
          />
        </Box>
      </Stack>

      {/* Creator List Header with Count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography fontSize={24} fontWeight={600} fontFamily="Aileron">
          Creator List
        </Typography>
        {filteredSubmissions.length > 0 && (
          <Typography fontSize={14} color="text.secondary">
            Showing {paginationData.startIndex + 1}-
            {Math.min(paginationData.endIndex, filteredSubmissions.length)} of{' '}
            {filteredSubmissions.length} creators
          </Typography>
        )}
      </Box>

      <Grid container spacing={1}>

        {/* eslint-disable react/prop-types */}
        {paginationData.displayedSubmissions.map((submission) => {
          const insightData = insightsData.find((data) => data.submissionId === submission.id);
          // insightData is from hook data, not props - PropTypes validated in UserPerformanceCard
          const engagementRate = insightData ? calculateEngagementRate(insightData.insight) : 0;

          return (
            <UserPerformanceCard
              key={submission.id}
              submission={submission}
              insightData={insightData}
              engagementRate={engagementRate}
              loadingInsights={loadingInsights}
            />
          );
        })}

        {/* eslint-enable react/prop-types */}
        {postingSubmissions.length === 0 && (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 3,
                bgcolor: '#F8F9FA',
                borderRadius: 2,
                border: '1px dashed #E0E0E0',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 1,
                  color: '#6B7280',
                  fontWeight: 500,
                }}
              >
                No Creator Data Yet
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#9CA3AF',
                  maxWidth: 400,
                  mx: 'auto',
                }}
              >
                Creator performance data will appear here once creators submit their posting links
                and content goes live.
              </Typography>
            </Box>
          </Grid>
        )}

        {filteredSubmissions.length === 0 && postingSubmissions.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No {selectedPlatform.toLowerCase()} submissions found for this campaign.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Pagination Controls */}
      {paginationData.totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 3,
            pb: 2,
            gap: 0.3,
          }}
        >
          {/* Previous Button */}
          <Button
            onClick={handlePrevPage}
            disabled={!paginationData.hasPrevPage}
            sx={{
              minWidth: 'auto',
              p: 0,
              backgroundColor: 'transparent',
              color: paginationData.hasPrevPage ? '#000000' : '#8E8E93',
              border: 'none',
              fontSize: 20,
              fontWeight: 400,
              '&:hover': {
                backgroundColor: 'transparent',
              },
              '&:disabled': {
                backgroundColor: 'transparent',
                color: '#8E8E93',
              },
            }}
          >
            <ChevronLeftRounded size={16} />
          </Button>

          {/* Page Numbers */}
          {(() => {
            const pageButtons = [];
            const showEllipsis = paginationData.totalPages > 3;

            if (!showEllipsis) {
              // Show all pages if 3 or fewer
              for (let i = 1; i <= paginationData.totalPages; i += 1) {
                pageButtons.push(
                  <Button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    sx={{
                      minWidth: 'auto',
                      p: 0,
                      mx: 1,
                      backgroundColor: 'transparent',
                      color: currentPage === i ? '#000000' : '#8E8E93',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 400,
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    {i}
                  </Button>
                );
              }
            } else {
              // Show 1, current-1, current, current+1, ..., last
              pageButtons.push(
                <Button
                  key={1}
                  onClick={() => setCurrentPage(1)}
                  sx={{
                    minWidth: 'auto',
                    p: 0,
                    mx: 1,
                    backgroundColor: 'transparent',
                    color: currentPage === 1 ? '#000000' : '#8E8E93',
                    border: 'none',
                    fontSize: 16,
                    fontWeight: 400,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  1
                </Button>
              );

              if (currentPage > 3) {
                pageButtons.push(
                  <Typography key="ellipsis1" sx={{ mx: 1, color: '#8E8E93', fontSize: 16 }}>
                    ...
                  </Typography>
                );
              }

              // Show current page and adjacent pages
              for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(paginationData.totalPages - 1, currentPage + 1);
                i += 1
              ) {
                pageButtons.push(
                  <Button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    sx={{
                      minWidth: 'auto',
                      p: 0,
                      mx: 1,
                      backgroundColor: 'transparent',
                      color: currentPage === i ? '#000000' : '#8E8E93',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 400,
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    {i}
                  </Button>
                );
              }

              if (currentPage < paginationData.totalPages - 2) {
                pageButtons.push(
                  <Typography key="ellipsis2" sx={{ mx: 1, color: '#8E8E93', fontSize: 16 }}>
                    ...
                  </Typography>
                );
              }

              if (paginationData.totalPages > 1) {
                pageButtons.push(
                  <Button
                    key={paginationData.totalPages}
                    onClick={() => setCurrentPage(paginationData.totalPages)}
                    sx={{
                      minWidth: 'auto',
                      p: 0,
                      mx: 1,
                      backgroundColor: 'transparent',
                      color: currentPage === paginationData.totalPages ? '#000000' : '#8E8E93',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 400,
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    {paginationData.totalPages}
                  </Button>
                );
              }
            }

            return pageButtons;
          })()}

          {/* Next Button */}
          <Button
            onClick={handleNextPage}
            disabled={!paginationData.hasNextPage}
            sx={{
              minWidth: 'auto',
              p: 0,
              backgroundColor: 'transparent',
              color: paginationData.hasNextPage ? '#000000' : '#8E8E93',
              border: 'none',
              fontSize: 16,
              fontWeight: 400,
              '&:hover': {
                backgroundColor: 'transparent',
              },
              '&:disabled': {
                backgroundColor: 'transparent',
                color: '#8E8E93',
              },
            }}
          >
            <ChevronRightRounded size={16} />
          </Button>
        </Box>
      )}
        </>
      {/* )} */}
    </Box>
  );
};

CampaignAnalytics.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string,
    submission: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        postUrl: PropTypes.string,
        user: PropTypes.string,
        platform: PropTypes.string,
      })
    ),
  }),
};

export default CampaignAnalytics;
