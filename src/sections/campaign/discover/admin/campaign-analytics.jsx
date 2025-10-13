import React, { useMemo, useState } from 'react';

import { PieChart } from '@mui/x-charts';
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

import { useSocialInsights } from 'src/hooks/use-social-insights';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import {
  formatNumber,
  getMetricValue,
  calculateSummaryStats,
  calculateEngagementRate,
} from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';

const CampaignAnalytics = ({ campaign }) => {
  const campaignId = campaign?.id;
  const submissions = campaign?.submission || [];
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Extract posting submissions with URLs directly from campaign prop
  const postingSubmissions = useMemo(() => extractPostingSubmissions(submissions), [submissions]);

  // Get available platforms in the campaign or provide defaults for empty state
  const availablePlatforms = useMemo(() => {
    if (postingSubmissions.length === 0) {
      // Return default platforms for empty state display
      return ['Instagram', 'TikTok'];
    }
    const platforms = [...new Set(postingSubmissions.map((sub) => sub && sub.platform).filter(Boolean))];
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
      if (sub && sub.platform === 'Instagram') counts.Instagram++;
      if (sub && sub.platform === 'TikTok') counts.TikTok++;
    });
    return counts;
  }, [postingSubmissions]);

  // Fetch insights for posting submissions (always fetch all, filter for display)
  const {
    data: insightsData,
    isLoading: loadingInsights,
    error: insightsError,
    loadingProgress,
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

  const PlatformToggle = () => {
    const platformConfig = [
      { key: 'ALL', label: 'Overview', icon: null, color: '#1340FF' },
      { key: 'Instagram', label: 'Instagram', icon: 'simple-icons:instagram', color: '#C13584' },
      { key: 'TikTok', label: 'TikTok', icon: 'simple-icons:tiktok', color: '#000000' },
    ];

    // Filter to only show platforms that exist in the campaign
    const availablePlatformConfig = platformConfig.filter(
      (config) => config.key === 'ALL' || availablePlatforms.includes(config.key)
    );

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: '10px', mb: 1 }}>
          {availablePlatformConfig.map((config) => (
            <Button
              key={config.key}
              onClick={() => handlePlatformChange(config.key)}
              variant="outlined"
              sx={{
                width: 125,
                height: 40,
                borderRadius: '8px',
                borderWidth: '2px',
                bgcolor: 'transparent',
                color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                border:
                  selectedPlatform === config.key
                    ? `2px solid ${config.color}`
                    : '2px solid #9E9E9E',
                fontWeight: 600,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                  border: `2px solid ${config.color}`,
                  color: config.color,
                  // Target the icon inside the button on hover
                  '& .iconify': {
                    color: config.color,
                  },
                },
              }}
            >
              {config.icon && (
                <Iconify
                  icon={config.icon}
                  className="iconify"
                  sx={{
                    height: 20,
                    width: 20,
                    mr: config.key === 'TikTok' ? 0.5 : 1,
                    color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                  }}
                />
              )}
              {config.label}
            </Button>
          ))}
        </Box>
      </Box>
    );
  };

  const CoreMetricsSection = ({ summaryStats }) => {
    if (!summaryStats) return null;

    // Define metrics configuration
    const metricsConfig = [
      {
        key: 'views',
        label: 'Views',
        value: summaryStats.totalViews,
        metricKey: 'views',
      },
      {
        key: 'likes',
        label: 'Likes',
        value: summaryStats.totalLikes,
        metricKey: 'likes',
      },
      {
        key: 'comments',
        label: 'Comments',
        value: summaryStats.totalComments,
        metricKey: 'comments',
      },
      {
        key: 'saved',
        label: 'Saved',
        value: summaryStats.totalSaved,
        metricKey: 'saved',
        // Only show for Instagram
        condition:
          selectedPlatform === 'Instagram' ||
          (selectedPlatform === 'ALL' && availablePlatforms.includes('Instagram')),
      },
    ].filter((metric) => metric.condition !== false);

    const renderEngagementCard = ({ title, value, metricKey }) => {
      // Find top performer for this metric
      const topPerformer = findTopPerformerByMetric(
        metricKey,
        filteredInsightsData,
        filteredSubmissions
      );

      // Get creator data for top performer
      const { data: topCreator } = useGetCreatorById(topPerformer?.submission?.user);

      // Calculate percentage contribution
      const percentage =
        topPerformer && value > 0 ? Math.round((topPerformer.value / value) * 100) : 0;

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
          {/* Main content container */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Left side - Title and top performer info */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                height: { xs: 70, sm: 85 },
                minWidth: 0, // allow children to shrink
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
                      maxWidth: { xs: 85, sm: 120, md: 140 }, // Adjust these values as needed
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

    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          {metricsConfig.map((metric) => (
            <Grid item xs={6} sm={6} md={3} key={metric.key}>
              {renderEngagementCard({
                title: metric.label,
                value: metric.value,
                metricKey: metric.metricKey,
              })}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const PlatformOverviewLayout = ({
    insightsData,
    summaryStats,
    platformCounts,
    selectedPlatform,
  }) => {
    const calculateAdditionalMetrics = () => {
      const metrics = {};

      // Calculate metrics based on current insights data (filtered or all)
      metrics.totalShares = insightsData.reduce(
        (sum, item) => sum + getMetricValue(item.insight, 'shares'),
        0
      );
      metrics.totalReach = insightsData.reduce(
        (sum, item) => sum + getMetricValue(item.insight, 'reach'),
        0
      );
      metrics.totalInteractions = insightsData.reduce(
        (sum, item) => sum + getMetricValue(item.insight, 'total_interactions'),
        0
      );

      // Calculate average engagement rate
      const avgEngagement =
        insightsData.length > 0
          ? insightsData.reduce((sum, item) => {
              const views = getMetricValue(item.insight, 'views');
              const likes = getMetricValue(item.insight, 'likes');
              const comments = getMetricValue(item.insight, 'comments');
              const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
              return sum + engagementRate;
            }, 0) / insightsData.length
          : 0;

      metrics.avgEngagement = avgEngagement;

      return metrics;
    };

    const additionalMetrics = calculateAdditionalMetrics();

    const PostingsCard = () => (
      <Box
        sx={{
          textAlign: 'center',
          px: 3,
          py: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          textAlign="left"
          variant="h4"
          fontWeight={600}
          gutterBottom
          fontFamily="Aileron"
          color="#231F20"
        >
          Postings
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            my: 2,
          }}
        >
          {/* Dual Platform Beam Display */}
          <Box sx={{ display: 'flex', gap: 4, mb: 2, alignItems: 'flex-end' }}>
            {/* Instagram Beam */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Post count above beam */}
              <Typography
                variant="h6"
                sx={{
                  color: '#1340FF',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  mb: 1,
                  minHeight: '1.5rem',
                }}
              >
                {platformCounts.Instagram > 0 ? platformCounts.Instagram : ''}
              </Typography>

              <Box
                sx={{
                  width: 54,
                  height: (() => {
                    const maxCount = Math.max(platformCounts.Instagram, platformCounts.TikTok);
                    const minHeight = 30;
                    const maxHeight = 170;
                    if (maxCount === 0) return minHeight;
                    return (
                      minHeight + (platformCounts.Instagram / maxCount) * (maxHeight - minHeight)
                    );
                  })(),
                  backgroundColor: (() => {
                    // Fill conditions based on selection and post count
                    if (platformCounts.Instagram === 0) return '#F5F5F5';
                    if (selectedPlatform === 'ALL') return '#1340FF';
                    if (selectedPlatform === 'Instagram') return '#1340FF';
                    return '#F5F5F5';
                  })(),
                  border: '1px solid #1340FF',
                  borderRadius: 100,
                  mb: 1,
                  transition: 'all 0.3s ease',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: '#1340FF',
                  fontSize: 16,
                  fontWeight: 200,
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                Instagram
              </Typography>
            </Box>

            {/* TikTok Beam */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Post count above beam */}
              <Typography
                variant="h6"
                sx={{
                  color: '#1340FF',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  mb: 1,
                  minHeight: '1.5rem',
                }}
              >
                {platformCounts.TikTok > 0 ? platformCounts.TikTok : ''}
              </Typography>

              <Box
                sx={{
                  width: 54,
                  height: (() => {
                    const maxCount = Math.max(platformCounts.Instagram, platformCounts.TikTok);
                    const minHeight = 10;
                    const maxHeight = 170;
                    if (maxCount === 0) return minHeight;
                    return minHeight + (platformCounts.TikTok / maxCount) * (maxHeight - minHeight);
                  })(),
                  backgroundColor: (() => {
                    // Fill conditions based on selection and post count
                    if (platformCounts.TikTok === 0) return '#F5F5F5';
                    if (selectedPlatform === 'ALL') return '#1340FF';
                    if (selectedPlatform === 'TikTok') return '#1340FF';
                    return '#F5F5F5';
                  })(),
                  border: '1px solid #1340FF',
                  borderRadius: 100,
                  mb: 1,
                  transition: 'all 0.3s ease',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: '#1340FF',
                  fontSize: 16,
                  fontWeight: 200,
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                TikTok
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );

    const TopEngagementCard = () => {
      // Find the creator with the highest engagement rate
      const topEngagementCreator = useMemo(() => {
        if (!filteredInsightsData || filteredInsightsData.length === 0) return null;

        let highestEngagement = -1;
        let topCreator = null;

        filteredInsightsData.forEach((insightData) => {
          const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
          if (submission) {
            const engagementRate = calculateEngagementRate(insightData.insight);
            if (engagementRate > highestEngagement) {
              highestEngagement = engagementRate;
              topCreator = {
                ...submission,
                engagementRate,
                insightData,
              };
            }
          }
        });

        return topCreator;
      }, [filteredInsightsData, filteredSubmissions]);

      const { data: creator } = useGetCreatorById(topEngagementCreator?.user);

      if (!topEngagementCreator) return null;

      return (
        <Box
          borderRadius={3}
          sx={{
            height: '400px',
            backgroundColor: '#F5F5F5',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <Typography variant="h6" fontWeight={600} fontFamily="Aileron" color="#231F20">
            Top Engagement
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography
              fontFamily="Instrument Serif"
              fontWeight={400}
              fontSize={55}
              color="#1340FF"
              textAlign="center"
            >
              {topEngagementCreator.engagementRate}%
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 45,
                  height: 45,
                  bgcolor: topEngagementCreator && topEngagementCreator.platform === 'Instagram' ? '#E4405F' : '#000000',
                  mr: 2,
                }}
              >
                {creator?.user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography
                  fontSize={14}
                  fontWeight={600}
                  color="#231F20"
                  sx={{ textAlign: 'left' }}
                >
                  {creator?.user?.name || 'Unknown Creator'}
                </Typography>
                <Typography fontSize={12} color="#636366" sx={{ textAlign: 'left' }}>
                  @{creator?.user?.name?.toLowerCase().replace(/\s+/g, '') || 'unknown'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ alignSelf: 'center' }}>
            <Link
              href={topEngagementCreator.insightData.postUrl}
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
                src={
                  topEngagementCreator.insightData.thumbnail ||
                  topEngagementCreator.insightData.video?.media_url
                }
                alt="Top performing post"
                sx={{
                  width: 290,
                  height: 180,
                  mt: 2,
                  borderRadius: 2,
                  objectFit: 'cover',
                  objectPosition: 'left top',
                  border: '1px solid #e0e0e0',
                }}
              />
            </Link>
          </Box>
        </Box>
      );
    };

    return (
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            overflowX: 'auto',
            pb: 2,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: 10,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1',
              borderRadius: 10,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#a8a8a8',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              width: 'max-content',
              minHeight: 400,
            }}
          >
            {/* Mobile horizontal scroll content */}
            {availablePlatforms.length > 1 && selectedPlatform === 'ALL' && (
              <Box
                sx={{
                  minWidth: { xs: 220, sm: 250 },
                  height: 400,
                  bgcolor: '#F5F5F5',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  p: { xs: 1, sm: 0 },
                }}
              >
                <PostingsCard />
              </Box>
            )}

            {/* Pie Chart */}
            <Box
              sx={{
                minWidth: { xs: 400, sm: 500 },
                height: 400,
                bgcolor: '#F5F5F5',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <PieChart
                    height={300}
                    width={300}
                    margin={{ left: 50, right: 50, top: 50, bottom: 50 }}
                    series={[
                      {
                        data: [
                          {
                            id: 0,
                            value: summaryStats.totalLikes,
                            label: 'Likes',
                            color: '#1340FF',
                          },
                          {
                            id: 1,
                            value: summaryStats.totalComments,
                            label: 'Comments',
                            color: '#8A5AFE',
                          },
                          {
                            id: 2,
                            value: summaryStats.totalShares,
                            label: 'Shares',
                            color: '#68A7ED',
                          },
                        ],
                        innerRadius: 60,
                        outerRadius: 120,
                        arcLabel: (params) => params.value,
                        arcLabelMinAngle: 20,
                        valueFormatter: (value) => formatNumber(value.value),
                      },
                    ]}
                    sx={{
                      '& .MuiChartsLegend-root': {
                        display: 'none',
                      },
                      '& .MuiPieArcLabel-root': {
                        fontWeight: '600',
                        fill: 'white',
                        fontFamily: 'Aileron',
                      },
                      '& .MuiPieArc-root': {
                        stroke: 'none',
                      },
                    }}
                  />

                  <Box
                    sx={{
                      position: 'absolute',
                      top: '48%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: 32, sm: 45, md: 55 },
                        fontWeight: 400,
                        color: '#1340FF',
                        fontFamily: 'Instrument Serif',
                        lineHeight: 1,
                      }}
                    >
                      {formatNumber(
                        Math.round(
                          summaryStats.totalLikes +
                            summaryStats.totalComments +
                            summaryStats.totalShares
                        )
                      )}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#000000',
                        fontFamily: 'Aileron',
                        lineHeight: 1,
                      }}
                    >
                      Average
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#000000',
                        fontFamily: 'Aileron',
                        lineHeight: 1,
                      }}
                    >
                      Interactions
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    mr: 3,
                  }}
                >
                  {[
                    { name: 'Likes', value: summaryStats.totalLikes, color: '#1340FF' },
                    { name: 'Comments', value: summaryStats.totalComments, color: '#8A5AFE' },
                    { name: 'Shares', value: summaryStats.totalShares, color: '#68A7ED' },
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: item.color,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: '#000',
                            lineHeight: 1.2,
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Summary Stats */}
            <Box
              sx={{
                minWidth: { xs: 350, sm: 400 },
                height: 400,
                bgcolor: '#F5F5F5',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                p: 2,
              }}
            >
              {/* Top Row */}
              <Box display="flex" flex={1} gap={2}>
                {/* Top Left Quadrant */}
                <Box
                  flex={1}
                  display="flex"
                  flexDirection="column"
                  sx={{ borderBottom: '2px solid #1340FF' }}
                >
                  <Typography
                    sx={{
                      fontSize: 50,
                      fontWeight: 400,
                      color: '#1340FF',
                      fontFamily: 'Instrument Serif',
                      mt: 4,
                    }}
                  >
                    {summaryStats.totalPosts}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#1340FF',
                      fontFamily: 'Aileron',
                    }}
                  >
                    {availablePlatforms.length > 1 &&
                      (selectedPlatform === 'ALL'
                        ? 'Total Creators'
                        : selectedPlatform === 'Instagram'
                          ? 'Instagram Posts'
                          : selectedPlatform === 'TikTok'
                            ? 'TikTok Posts'
                            : '')}
                    {availablePlatforms.length < 2 && insightsData.length > 0 && `${insightsData[0].platform} Posts`}
                  </Typography>
                </Box>

                {/* Top Right Quadrant */}
                <Box
                  flex={1}
                  display="flex"
                  flexDirection="column"
                  sx={{ borderBottom: '2px solid #1340FF' }}
                >
                  <Typography
                    sx={{
                      fontSize: 50,
                      fontWeight: 400,
                      color: '#1340FF',
                      fontFamily: 'Instrument Serif',
                      mt: 4,
                    }}
                  >
                    {selectedPlatform === 'TikTok' ? 'TBD' : formatNumber(summaryStats.totalReach)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#1340FF',
                      fontFamily: 'Aileron',
                    }}
                  >
                    {selectedPlatform === 'ALL' && 'Reach'}
                    {selectedPlatform === 'TikTok' && 'TBD'}
                    {selectedPlatform === 'Instagram' && 'Reach'}
                  </Typography>
                  {selectedPlatform === 'ALL' && (
                    <Typography fontSize={12} fontWeight={600} color="#1340FF">
                      (Instagram Only)
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Bottom Row */}
              <Box display="flex" flex={1} gap={2} mt={2}>
                {/* Bottom Left Quadrant */}
                <Box flex={1} display="flex" flexDirection="column">
                  <Typography
                    sx={{
                      fontSize: 50,
                      fontWeight: 400,
                      color: '#1340FF',
                      fontFamily: 'Instrument Serif',
                      mt: 3,
                    }}
                  >
                    {summaryStats.avgEngagementRate}%
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#1340FF',
                      fontFamily: 'Aileron',
                    }}
                  >
                    Engagement Rate
                  </Typography>
                </Box>

                {/* Bottom Right Quadrant */}
                <Box flex={1} display="flex" flexDirection="column">
                  <Typography
                    sx={{
                      fontSize: 50,
                      fontWeight: 400,
                      color: '#1340FF',
                      fontFamily: 'Instrument Serif',
                      mt: 3,
                    }}
                  >
                    {summaryStats.totalShares}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#1340FF',
                      fontFamily: 'Aileron',
                    }}
                  >
                    Shares
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Top Performer */}
            {(selectedPlatform !== 'ALL' ||
              (availablePlatforms.length === 1 && insightsData.length > 0 &&
                (insightsData[0].platform === 'Instagram' ||
                  insightsData[0].platform === 'TikTok'))) && (
              <Box
                sx={{
                  minWidth: { xs: 300, sm: 350 },
                  height: 400,
                  bgcolor: '#F5F5F5',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  p: { xs: 1, sm: 0 },
                }}
              >
                <TopEngagementCard />
              </Box>
            )}
          </Box>
        </Box>

        {/* Desktop layout */}
        <Grid
          container
          justifyContent="center"
          height={400}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          {/* Left Condition: Platform Overview Card */}
          {availablePlatforms.length > 1 && selectedPlatform === 'ALL' && (
            <Grid
              item
              xs={12}
              md={2.5}
              alignContent="center"
              bgcolor="#F5F5F5"
              borderRadius={3}
              mr={2}
            >
              <PostingsCard />
            </Grid>
          )}

          {/* Left: Engagement Breakdown Chart */}
          <Grid item xs={12} md={5} mr={2} alignContent="center" bgcolor="#F5F5F5" borderRadius={3}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <PieChart
                  height={300}
                  width={300}
                  margin={{ left: 50, right: 50, top: 50, bottom: 50 }}
                  series={[
                    {
                      data: [
                        { id: 0, value: summaryStats.totalLikes, label: 'Likes', color: '#1340FF' },
                        {
                          id: 1,
                          value: summaryStats.totalComments,
                          label: 'Comments',
                          color: '#8A5AFE',
                        },
                        {
                          id: 2,
                          value: summaryStats.totalShares,
                          label: 'Shares',
                          color: '#68A7ED',
                        },
                      ],
                      innerRadius: 60,
                      outerRadius: 120,
                      arcLabel: (params) => params.value,
                      arcLabelMinAngle: 20,
                      valueFormatter: (value) => formatNumber(value.value),
                    },
                  ]}
                  sx={{
                    '& .MuiChartsLegend-root': {
                      display: 'none', // Hide default legend since we're creating custom one
                    },
                    '& .MuiPieArcLabel-root': {
                      fontWeight: '600',
                      fill: 'white',
                      fontFamily: 'Aileron',
                    },
                    '& .MuiPieArc-root': {
                      stroke: 'none', // Remove white lines between segments
                    },
                  }}
                />

                {/* Center Text Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '48%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none', // Allow clicking through to chart
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#000000',
                      lineHeight: 1,
                    }}
                  >
                    {formatNumber(
                      Math.round(
                        summaryStats.totalLikes +
                          summaryStats.totalComments +
                          summaryStats.totalShares
                      )
                    )}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#000000',
                      fontFamily: 'Aileron',
                      lineHeight: 1,
                    }}
                  >
                    Average
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#000000',
                      fontFamily: 'Aileron',
                      lineHeight: 1,
                    }}
                  >
                    Interactions
                  </Typography>
                </Box>
              </Box>

              {/* Right Side: Legend with Color Indicators */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mr: 3,
                }}
              >
                {[
                  { name: 'Likes', value: summaryStats.totalLikes, color: '#1340FF' },
                  { name: 'Comments', value: summaryStats.totalComments, color: '#8A5AFE' },
                  { name: 'Shares', value: summaryStats.totalShares, color: '#68A7ED' },
                ].map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Color indicator circle */}
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: '#000',
                          lineHeight: 1.2,
                          mr: 5,
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Middle: Platform-specific metrics */}
          <Grid item xs={12} md={4} alignContent="center" bgcolor="#F5F5F5" borderRadius={3}>
            <Box
              sx={{
                backgroundColor: '#F5F5F5',
                borderRadius: 3,
              }}
            >
              {summaryStats && (
                <Grid
                  container
                  sx={{ mt: { xs: 0 } }}
                  justifyContent="center"
                  columnGap={2}
                  padding={2}
                  mb={2}
                >
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography
                        fontFamily="Instrument Serif"
                        fontWeight={400}
                        fontSize={55}
                        color="#1340FF"
                      >
                        {summaryStats.totalPosts}
                      </Typography>
                      <Typography
                        fontFamily="Aileron"
                        fontWeight={600}
                        fontSize={18}
                        color="#1340FF"
                      >
                        {availablePlatforms.length > 1 &&
                          (selectedPlatform === 'ALL'
                            ? 'Total Creators'
                            : selectedPlatform === 'Instagram'
                              ? 'Instagram Posts'
                              : selectedPlatform === 'TikTok'
                                ? 'TikTok Posts'
                                : '')}
                        {availablePlatforms.length < 2 && insightsData.length > 0 && `${insightsData[0].platform} Posts`}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={5}>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography
                        fontFamily="Instrument Serif"
                        fontWeight={400}
                        fontSize={55}
                        color="#1340FF"
                      >
                        {selectedPlatform === 'TikTok'
                          ? 'TBD'
                          : formatNumber(summaryStats.totalReach)}
                      </Typography>
                      <Typography
                        fontFamily="Aileron"
                        fontWeight={600}
                        fontSize={18}
                        color="#1340FF"
                      >
                        {selectedPlatform === 'ALL' && (
                          <Typography fontSize={18} fontFamily="Aileron" fontWeight={600}>
                            Reach
                            <Typography fontFamily="Aileron" fontSize={12} fontWeight={600}>
                              (Instagram only)
                            </Typography>
                          </Typography>
                        )}
                        {selectedPlatform === 'TikTok' && 'TBD'}
                        {selectedPlatform === 'Instagram' && 'Reach'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} mt={2} mb={2}>
                    <Box sx={{ borderBottom: '2px solid #1340FF' }} />
                  </Grid>

                  <Grid item xs={5} mt={2} mb={2}>
                    <Box sx={{ borderBottom: '2px solid #1340FF' }} />
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography
                        fontFamily="Instrument Serif"
                        fontWeight={400}
                        fontSize={55}
                        color="#1340FF"
                      >
                        {summaryStats.avgEngagementRate}%
                      </Typography>
                      <Typography
                        fontFamily="Aileron"
                        fontWeight={600}
                        fontSize={18}
                        color="#1340FF"
                      >
                        Engagement Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={5}>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography
                        fontFamily="Instrument Serif"
                        fontWeight={400}
                        fontSize={55}
                        color="#1340FF"
                      >
                        {summaryStats.totalShares}
                      </Typography>
                      <Typography
                        fontFamily="Aileron"
                        fontWeight={600}
                        fontSize={18}
                        color="#1340FF"
                      >
                        Total Shares
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Grid>

          {/* Right: Top Engagement Card */}
          {(selectedPlatform !== 'ALL' ||
            (availablePlatforms.length === 1 && insightsData.length > 0 &&
              (insightsData[0].platform === 'Instagram' ||
                insightsData[0].platform === 'TikTok'))) && (
            <Grid
              item
              xs={12}
              md={2.5}
              ml={2}
              alignContent="center"
              bgcolor="#F5F5F5"
              borderRadius={3}
            >
              <TopEngagementCard />
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  // Add this new function before CoreMetricsSection
  const findTopPerformerByMetric = (metricKey, insightsData, filteredSubmissions) => {
    if (!insightsData || insightsData.length === 0) return null;

    let topPerformer = null;
    let highestValue = 0;

    insightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
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

  const UserPerformanceCard = ({ engagementRate, submission, insightData, loadingInsights }) => {
    const { data: creator, isLoading: loadingCreator } = useGetCreatorById(submission.user);

    return (
      <Grid item xs={12}>
        <Box px={4} borderRadius={1} border="2px solid #F5F5F5">
          <Box sx={{ py: 1 }}>
            {/* Desktop Layout (md+) */}
            <Box display={{ xs: 'none', md: 'flex' }} alignItems="center">
              {/* Left Side: Creator Info */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: submission && submission.platform === 'Instagram' ? '#E4405F' : '#000000',
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
              {insightData ? (
                <Box display="flex" alignItems="center" mr="auto" ml={2}>
                  {/* Engagement Rate */}
                  <Box>
                    <Typography fontFamily="Aileron" fontSize={16} fontWeight={600} color="#636366">
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
                    <Typography fontFamily="Aileron" fontSize={16} fontWeight={600} color="#636366">
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
                    <Typography fontFamily="Aileron" fontSize={16} fontWeight={600} color="#636366">
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
                    <Typography fontFamily="Aileron" fontSize={16} fontWeight={600} color="#636366">
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
              ) : loadingInsights ? (
                <Box display="flex" alignItems="center" py={2} ml={4}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading metrics...
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info" sx={{ m: 1 }}>
                  Analytics data not available for this post.
                </Alert>
              )}

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
            <Box display={{ xs: 'flex', md: 'none' }} flexDirection="column" sx={{ py: 2 }}>
              {/* Top: Creator Info */}
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: submission && submission.platform === 'Instagram' ? '#E4405F' : '#000000',
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
              {insightData ? (
                <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                  {/* Engagement Rate */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography fontFamily="Aileron" fontSize={14} fontWeight={600} color="#636366">
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
                    sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF', mx: 2 }}
                  />

                  {/* Views */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography fontFamily="Aileron" fontSize={14} fontWeight={600} color="#636366">
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
                    sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF', mx: 2 }}
                  />

                  {/* Likes */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography fontFamily="Aileron" fontSize={14} fontWeight={600} color="#636366">
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
                    sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF', mx: 2 }}
                  />

                  {/* Comments */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography fontFamily="Aileron" fontSize={14} fontWeight={600} color="#636366">
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
              ) : loadingInsights ? (
                <Box display="flex" alignItems="center" justifyContent="center" py={3}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading metrics...
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info" sx={{ my: 2 }}>
                  Analytics data not available for this post.
                </Alert>
              )}

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
      {/* Platform Toggle */}
      {availablePlatforms.length > 1 && <PlatformToggle />}

      <Typography fontSize={24} fontWeight={600} fontFamily="Aileron" gutterBottom>
        Performance Summary
      </Typography>


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

      {/* Creator List Header with Count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
        {paginationData.displayedSubmissions.map((submission) => {
          const insightData = insightsData.find((data) => data.submissionId === submission.id);
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
                Creator performance data will appear here once creators submit their posting links and content goes live.
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
              for (let i = 1; i <= paginationData.totalPages; i++) {
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
                i++
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
    </Box>
  );
};

export default CampaignAnalytics;
