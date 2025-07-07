import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Link,
  Divider,
  Button,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { useSocialInsights } from 'src/hooks/use-social-insights';
import { extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import { 
  calculateSummaryStats, 
  getMetricValue, 
  formatNumber, 
  calculateEngagementRate 
} from 'src/utils/socialMetricsCalculator';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
import CacheMonitor from 'src/utils/cacheMonitor';
import { PieChart } from '@mui/x-charts';

const CampaignAnalytics = ({ campaign }) => {
  const campaignId = campaign?.id;
  const submissions = campaign?.submission || [];
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');

  // Extract posting submissions with URLs directly from campaign prop
  const postingSubmissions = useMemo(() => 
    extractPostingSubmissions(submissions), 
    [submissions]
  );

  // Get available platforms in the campaign
  const availablePlatforms = useMemo(() => {
    const platforms = [...new Set(postingSubmissions.map(sub => sub.platform))];
    return platforms.filter(Boolean);
  }, [postingSubmissions]);

  // Filter submissions based on selected platform
  const filteredSubmissions = useMemo(() => {
    if (selectedPlatform === 'ALL') {
      return postingSubmissions;
    }
    return postingSubmissions.filter(sub => sub.platform === selectedPlatform);
  }, [postingSubmissions, selectedPlatform]);

  // Get platform counts for beam display
  const platformCounts = useMemo(() => {
    const counts = { Instagram: 0, TikTok: 0 };
    postingSubmissions.forEach(sub => {
      if (sub.platform === 'Instagram') counts.Instagram++;
      if (sub.platform === 'TikTok') counts.TikTok++;
    });
    return counts;
  }, [postingSubmissions]);

  // Fetch insights for posting submissions (always fetch all, filter for display)
  const { 
    data: insightsData, 
    isLoading: loadingInsights, 
    failedUrls,
    error: insightsError,
    loadingProgress,
    clearCache
  } = useSocialInsights(postingSubmissions, campaignId);

  // Filter insights data based on selected platform
  const filteredInsightsData = useMemo(() => {
    if (selectedPlatform === 'ALL') {
      return insightsData;
    }
    return insightsData.filter(data => {
      const submission = postingSubmissions.find(sub => sub.id === data.submissionId);
      return submission?.platform === selectedPlatform;
    });
  }, [insightsData, selectedPlatform, postingSubmissions]);

  // Calculate summary statistics based on filtered data
  const summaryStats = useMemo(() => 
    calculateSummaryStats(filteredInsightsData), 
    [filteredInsightsData]
  );

  console.log('Summary stats: ', summaryStats)
  console.log('Insights data: ', insightsData)

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
      { key: 'TikTok', label: 'TikTok', icon: 'simple-icons:tiktok', color: '#000000' }
    ];

    // Filter to only show platforms that exist in the campaign
    const availablePlatformConfig = platformConfig.filter(config => 
      config.key === 'ALL' || availablePlatforms.includes(config.key)
    );
    
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: '10px', mb: 1 }}>
          {availablePlatformConfig.map((config) => (
            <Button
              key={config.key}
              onClick={() => setSelectedPlatform(config.key)}
              variant="outlined"
              sx={{
                width: 125,
                height: 40,
                borderRadius: '8px',
                borderWidth: '2px',
                bgcolor: 'transparent',
                color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                border: selectedPlatform === config.key ? `2px solid ${config.color}` : '2px solid #9E9E9E',
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

  const PlatformOverviewLayout = ({ postCount, insightsData, summaryStats, platformCounts, selectedPlatform }) => {
    const calculateAdditionalMetrics = () => {
      const metrics = {};
      
      // Calculate metrics based on current insights data (filtered or all)
      metrics.totalShares = insightsData.reduce((sum, item) => 
        sum + getMetricValue(item.insight, 'shares'), 0);
      metrics.totalReach = insightsData.reduce((sum, item) => 
        sum + getMetricValue(item.insight, 'reach'), 0);
      metrics.totalInteractions = insightsData.reduce((sum, item) => 
        sum + getMetricValue(item.insight, 'total_interactions'), 0);
      
      // Calculate average engagement rate
      const avgEngagement = insightsData.length > 0 ? 
        insightsData.reduce((sum, item) => {
          const views = getMetricValue(item.insight, 'views');
          const likes = getMetricValue(item.insight, 'likes');
          const comments = getMetricValue(item.insight, 'comments');
          const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
          return sum + engagementRate;
        }, 0) / insightsData.length : 0;
      
      metrics.avgEngagement = avgEngagement;
      
      return metrics;
    };

    const additionalMetrics = calculateAdditionalMetrics();

    const PostingsCard = () => {
      return (
        <Box sx={{ textAlign: 'center', px: 3, py: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Typography textAlign={'left'} variant="h4" fontWeight={600} gutterBottom fontFamily={'Aileron'} color={'#231F20'}>
            Postings
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center', 
              my: 2
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
                    minHeight: '1.5rem'
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
                      return minHeight + ((platformCounts.Instagram / maxCount) * (maxHeight - minHeight));
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
                    transition: 'all 0.3s ease'
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#1340FF',
                    fontSize: 16,
                    fontWeight: 200,
                    fontStyle: 'italic',
                    textAlign: 'center'
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
                    minHeight: '1.5rem'
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
                      return minHeight + ((platformCounts.TikTok / maxCount) * (maxHeight - minHeight));
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
                    transition: 'all 0.3s ease'
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#1340FF',
                    fontSize: 16,
                    fontWeight: 200,
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}
                >
                  TikTok
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )
    }

    const TopEngagementCard = () => {
      // Find the creator with the highest engagement rate
      const topEngagementCreator = useMemo(() => {
      if (!filteredInsightsData || filteredInsightsData.length === 0) return null;
      
      let highestEngagement = -1;
      let topCreator = null;
      
      filteredInsightsData.forEach(insightData => {
        const submission = filteredSubmissions.find(sub => sub.id === insightData.submissionId);
        if (submission) {
          const engagementRate = calculateEngagementRate(insightData.insight);
          if (engagementRate > highestEngagement) {
            highestEngagement = engagementRate;
            topCreator = {
              ...submission,
              engagementRate,
              insightData
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
          alignItems: 'flex-start' 
        }}
      >
        <Typography variant="h6" fontWeight={600} fontFamily={'Aileron'} color={'#231F20'}>
          Top Engagement
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
          <Typography fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF" textAlign="center">
            {topEngagementCreator.engagementRate}%
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 45, 
                height: 45,
                bgcolor: topEngagementCreator.platform === 'Instagram' ? '#E4405F' : '#000000',
                mr: 2
              }}
            >
              {creator?.user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography fontSize={14} fontWeight={600} color="#231F20" sx={{ textAlign: 'left' }}>
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
                transition: 'opacity 0.2s'
              }
            }}
          >
            <Box
              component="img"
              src={topEngagementCreator.insightData.thumbnail || topEngagementCreator.insightData.video?.media_url}
              alt="Top performing post"
              sx={{
                width: 290,
                height: 180,
                mt: 2,
                borderRadius: 2,
                objectFit: 'cover',
                objectPosition: 'left top',
                border: '1px solid #e0e0e0'
              }}
            />
          </Link>
        </Box>
      </Box>
    );
    };

    return (
      <Box sx={{ mb: 3 }}>
      <Grid container justifyContent={'center'} height={400}>
        {/* Left Condition: Platform Overview Card */}
        {availablePlatforms.length > 1 && selectedPlatform === 'ALL' &&
        <Grid item xs={12} md={2.5} alignContent={'center'} bgcolor={'#F5F5F5'} borderRadius={3} mr={2}>
          <PostingsCard />
        </Grid>
        }

        {/* Left: Engagement Breakdown Chart */}
        <Grid item xs={12} md={5} mr={2} alignContent={'center'} bgcolor={'#F5F5F5'} borderRadius={3}>
          <Box
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%',
              height: '100%',
            }}
          >
            <PieChart
              height={400}
              width={300}
              margin={{ left: 50, right: 50, top: 50, bottom: 50 }}
              series={[
                {
                  data: [
                    { id: 0, value: summaryStats.totalLikes, label: 'Likes', color: '#1340FF',  },
                    { id: 1, value: summaryStats.totalComments, label: 'Comments', color: '#8A5AFE' },
                    { id: 2, value: summaryStats.totalShares, label: 'Shares', color: '#68A7ED' }
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
                  fontSize: '22px',
                  fontWeight: '600',
                  fill: 'white',
                  fontFamily: 'Aileron',
                },
                '& .MuiPieArc-root': {
                  stroke: 'none', // Remove white lines between segments
                },
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              mr: 3
            }}>
              {[
                { name: 'Likes', value: summaryStats.totalLikes, color: '#1340FF' },
                { name: 'Comments', value: summaryStats.totalComments, color: '#8A5AFE' },
                { name: 'Shares', value: summaryStats.totalShares, color: '#68A7ED' }
              ].map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Color indicator circle */}
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      flexShrink: 0
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
        </Grid>

        {/* Middle: Platform-specific metrics */}
        <Grid item xs={12} md={4} alignContent={'center'} bgcolor={'#F5F5F5'} borderRadius={3}>
          <Box sx={{ 
            backgroundColor: '#F5F5F5',
            borderRadius: 3,
          }}>
            {summaryStats && (
            <Grid container sx={{ mt: { xs: 0 }}} justifyContent={'center'} columnGap={2} padding={2} mb={2}>
              <Grid item xs={6}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF">
                {summaryStats.totalPosts}
                </Typography>
                <Typography fontFamily={'Aileron'} fontWeight={600} fontSize={20} color="#1340FF">
                {availablePlatforms.length > 1 && (
                  selectedPlatform === 'ALL'
                  ? 'Total Creators'
                  : selectedPlatform === 'Instagram'
                    ? 'Instagram Posts'
                    : selectedPlatform === 'TikTok'
                    ? 'TikTok Posts'
                    : ''
                )}
                {availablePlatforms.length < 2 && `${insightsData[0].platform} Posts`}
                </Typography>
              </Box>
              </Grid>
              <Grid item xs={5}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF">
                {selectedPlatform === 'TikTok' ? 'TBD' : formatNumber(summaryStats.totalReach)}
                </Typography>
                <Typography fontFamily={'Aileron'} fontWeight={600} fontSize={20} color="#1340FF">
                {selectedPlatform === 'TikTok' ? 'TBD' : 'Reach'}
                </Typography>
              </Box>
              </Grid>
              
              <Grid item xs={6} mt={3} mb={2}>
              <Box sx={{ borderBottom: '2px solid #1340FF' }} />
              </Grid>

              <Grid item xs={5} mt={3} mb={2}>
              <Box sx={{ borderBottom: '2px solid #1340FF' }} />
              </Grid>
              
              <Grid item xs={6}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF">
                {summaryStats.avgEngagementRate}%
                </Typography>
                <Typography fontFamily={'Aileron'} fontWeight={600} fontSize={20} color="#1340FF">
                Engagement Rate
                </Typography>
              </Box>
              </Grid>
              <Grid item xs={5}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF">
                {summaryStats.totalShares}
                </Typography>
                <Typography fontFamily={'Aileron'} fontWeight={600} fontSize={20} color="#1340FF">
                Total Shares
                </Typography>
              </Box>
              </Grid>
            </Grid>
            )}
          </Box>
        </Grid>
        
        {/* Right: Top Engagement Card */}
        {((
          selectedPlatform !== 'ALL'
        ) || (
          availablePlatforms.length === 1 &&
          (insightsData[0].platform === 'Instagram' || insightsData[0].platform === 'TikTok')
        )) && (
          <Grid item xs={12} md={2.5} ml={2} alignContent={'center'} bgcolor={'#F5F5F5'} borderRadius={3}>
            <TopEngagementCard />
          </Grid>
        )}
      </Grid>
      </Box>
    );
  };

  const CoreMetricsSection = ({ insightsData, summaryStats }) => {
    if (!summaryStats) return null;
    
    // Define metrics configuration
    const metricsConfig = [
      {
        key: 'views',
        label: 'Views',
        value: summaryStats.totalViews
      },
      {
        key: 'likes', 
        label: 'Likes',
        value: summaryStats.totalLikes
      },
      {
        key: 'comments',
        label: 'Comments', 
        value: summaryStats.totalComments
      },
      {
        key: 'saved',
        label: 'Saved',
        value: summaryStats.totalSaved,
        // Only show for Instagram
        condition: selectedPlatform === 'Instagram' || (selectedPlatform === 'ALL' && availablePlatforms.includes('Instagram'))
      }
    ].filter(metric => metric.condition !== false);

    const renderEngagementCard = ({ title, value }) => {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 2,
            px: { sm: 3, xs: 6 },
            height: 116,
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
              alignItems: 'center'
            }}
          >
            {/* Left side - Title only */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              {/* Title */}
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: 20,
                  color: '#636366',
                }}
              >
                {title}
              </Typography>
            </Box>

            {/* Right side - Value in blue box */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 79,
                height: 79,
                background: '#1340FF',
                borderRadius: '8px',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: 24,
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
        <Grid container spacing={2}>
          {metricsConfig.map((metric) => (
            <Grid item xs={3} key={metric.key}>
              {renderEngagementCard({
                title: metric.label,
                value: metric.value
              })}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const UserPerformanceCard = ({ engagementRate, submission, insightData, loadingInsights }) => {
    const { data: creator, isLoading: loadingCreator } = useGetCreatorById(submission.user);
    
    return (
      <Grid item xs={12}>
        <Box px={4} borderRadius={1} border={'2px solid #F5F5F5'}>
          <Box sx={{ py: 1 }}>
            {/* Desktop Layout (md+) */}
            <Box 
              display={{ xs: 'none', md: 'flex' }} 
              alignItems="center"
            >
              {/* Left Side: Creator Info */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar 
                  sx={{ 
                    width: 48, 
                    height: 48,
                    bgcolor: submission.platform === 'Instagram' ? '#E4405F' : '#000000'
                  }}
                >
                  {loadingCreator ? (
                    <CircularProgress size={20} />
                  ) : (
                    creator?.user?.name?.charAt(0) || 'U'
                  )}
                </Avatar>
                <Box width={230}>
                  <Typography variant='h5' fontWeight={500}>
                    {loadingCreator ? 'Loading...' : creator?.user?.name || 'Unknown Creator'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" textOverflow={'ellipsis'} overflow={'auto'} sx={{ scrollbarWidth: 'none'}}>
                    {creator?.user?.email || submission.user}
                  </Typography>
                </Box>
              </Stack>

              {/* Center: Metrics Display */}
              {insightData ? (
                <Box display="flex" alignItems={'center'} mr={'auto'} ml={2}>
                  {/* Engagement Rate */}
                  <Box>
                    <Typography fontFamily={'Aileron'} fontSize={16} fontWeight={600} color={'#636366'} >
                      Engagement Rate
                    </Typography>
                    <Typography fontFamily={'Instrument Serif'} fontSize={40} fontWeight={400} color={'#1340FF'}>
                      {engagementRate}%
                    </Typography>
                  </Box> 

                  {/* Divider */}
                  <Divider sx={{ width: '1px', height: '80px', backgroundColor: '#1340FF', mx: 2 }} />

                  {/* Views */}
                  <Box sx={{ width: 80 }}>
                    <Typography fontFamily={'Aileron'} fontSize={16} fontWeight={600} color={'#636366'} >
                      Views
                    </Typography>
                    <Typography fontFamily={'Instrument Serif'} fontSize={40} fontWeight={400} color={'#1340FF'}>
                      {formatNumber(getMetricValue(insightData.insight, 'views'))}
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Divider sx={{ width: '1px', height: '80px', backgroundColor: '#1340FF', mx: 2 }} />

                  {/* Likes */}
                  <Box>
                    <Typography fontFamily={'Aileron'} fontSize={16} fontWeight={600} color={'#636366'} >
                      Likes
                    </Typography>
                    <Typography fontFamily={'Instrument Serif'} fontSize={40} fontWeight={400} color={'#1340FF'}>
                      {formatNumber(getMetricValue(insightData.insight, 'likes'))}
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Divider sx={{ width: '1px', height: '80px', backgroundColor: '#1340FF', mx: 2 }} />

                  {/* Comments */}
                  <Box>
                    <Typography fontFamily={'Aileron'} fontSize={16} fontWeight={600} color={'#636366'} >
                      Comments
                    </Typography>
                    <Typography fontFamily={'Instrument Serif'} fontSize={40} fontWeight={400} color={'#1340FF'}>
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
                <Alert severity="info" sx={{ mt: 1 }}>
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
                        transition: 'opacity 0.2s'
                      }
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
                          transition: 'filter 0.3s ease, opacity 0.3s ease'
                        }
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
            <Box 
              display={{ xs: 'flex', md: 'none' }} 
              flexDirection="column"
              sx={{ py: 2 }}
            >
              {/* Top: Creator Info */}
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40,
                    bgcolor: submission.platform === 'Instagram' ? '#E4405F' : '#000000',
                    mr: 2
                  }}
                >
                  {loadingCreator ? (
                    <CircularProgress size={18} />
                  ) : (
                    creator?.user?.name?.charAt(0) || 'U'
                  )}
                </Avatar>
                <Box>
                  <Typography variant='h6' fontWeight={500}>
                    {loadingCreator ? 'Loading...' : creator?.user?.name || 'Unknown Creator'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px'
                  }}>
                    {creator?.user?.email || submission.user}
                  </Typography>
                </Box>
              </Box>

              {/* Middle: Metrics */}
              {insightData ? (
                <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                  {/* Engagement Rate */}
                  <Box sx={{ textAlign: 'center'}}>
                    <Typography fontFamily={'Aileron'} fontSize={14} fontWeight={600} color={'#636366'}>
                      Engagement
                    </Typography>
                    <Typography fontFamily={'Instrument Serif'} fontSize={28} fontWeight={400} color={'#1340FF'}>
                      {engagementRate}%
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Divider sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF', mx: 2 }} />

                  {/* Views */}
                  <Box sx={{ textAlign: 'center'}}>
                    <Typography fontFamily={'Aileron'} fontSize={14} fontWeight={600} color={'#636366'}>
                      Views
                    </Typography>
                    <Typography fontFamily={'Instrument Serif'} fontSize={28} fontWeight={400} color={'#1340FF'}>
                      {formatNumber(getMetricValue(insightData.insight, 'views'))}
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Divider sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF', mx: 2 }} />

                  {/* Likes */}
                  <Box sx={{ textAlign: 'center'}}>
                    <Typography fontFamily={'Aileron'} fontSize={14} fontWeight={600} color={'#636366'}>
                      Likes
                    </Typography>
                    <Typography fontFamily={'Instrument Serif'} fontSize={28} fontWeight={400} color={'#1340FF'}>
                      {formatNumber(getMetricValue(insightData.insight, 'likes'))}
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Divider sx={{ width: '1px', height: '50px', backgroundColor: '#1340FF', mx: 2 }} />

                  {/* Comments */}
                  <Box sx={{ textAlign: 'center'}}>
                    <Typography fontFamily={'Aileron'} fontSize={14} fontWeight={600} color={'#636366'}>
                      Comments
                    </Typography>
                    <Typography fontFamily={'Instrument Serif'} fontSize={28} fontWeight={400} color={'#1340FF'}>
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
                        transition: 'opacity 0.2s'
                      }
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
                          transition: 'filter 0.3s ease, opacity 0.3s ease'
                        }
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

      <Typography fontSize={24} fontWeight={600} fontFamily={'Aileron'} gutterBottom>
        Performance Summary
      </Typography>
      
      {/* Debug Information - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle2">Debug Info:</Typography>
              <Typography variant="body2">
                Campaign ID: {campaignId}<br />
                Campaign Name: {campaign?.name}<br />
                Total Submissions: {submissions?.length || 0}<br />
                Posting Submissions: {postingSubmissions.length}<br />
                Insights Loaded: {insightsData.length}<br />
                Loading Progress: {loadingProgress?.loaded || 0}/{loadingProgress?.total || 0}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => {
                  clearCache();
                  window.location.reload();
                }}
                sx={{ fontSize: '0.75rem', py: 0.5 }}
              >
                Clear Cache & Reload
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => CacheMonitor.getStats()}
                sx={{ fontSize: '0.75rem', py: 0.5 }}
              >
                Cache Stats
              </Button>
            </Stack>
          </Stack>
        </Alert>
      )}

      {/* Loading state for insights */}
      {loadingInsights && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">
              Loading insights data... ({loadingProgress?.loaded || 0}/{loadingProgress?.total || postingSubmissions.length} completed)
            </Typography>
          </Stack>
          {loadingProgress?.total > 0 && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <Box
                sx={{
                  height: 4,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    backgroundColor: '#1340FF',
                    borderRadius: 2,
                    width: `${((loadingProgress.loaded / loadingProgress.total) * 100)}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
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

      {/* Failed URLs Alert */}
      {failedUrls.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Unable to fetch analytics for {failedUrls.length} post(s):
          </Typography>
          {failedUrls.map((failed, index) => (
            <Typography key={index} variant="body2" sx={{ ml: 1 }}>
              • {failed.user?.name || 'Unknown'} ({failed.platform}): {failed.reason}
              {failed.requiresReconnection && (
                <Chip 
                  label="Reconnection Required" 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Core Metrics Section */}
      <CoreMetricsSection 
        insightsData={filteredInsightsData}
        summaryStats={summaryStats}
      />

      {/* Platform Overview and Additional Metrics Layout */}
      {availablePlatforms.length > 0 && summaryStats && (
        <PlatformOverviewLayout 
          postCount={filteredSubmissions.length}
          insightsData={filteredInsightsData}
          summaryStats={summaryStats}
          platformCounts={platformCounts}
          selectedPlatform={selectedPlatform}
        />
      )}

      <Typography fontSize={24} fontWeight={600} fontFamily={'Aileron'} gutterBottom>
        Creator List
      </Typography>

      <Grid container spacing={1}>
        {filteredSubmissions.map((submission) => {
          const insightData = insightsData.find(data => data.submissionId === submission.id);
          const engagementRate = insightData ? calculateEngagementRate(insightData.insight) : 0;
          
          return <UserPerformanceCard 
            key={submission.id} 
            submission={submission} 
            insightData={insightData} 
            engagementRate={engagementRate} 
            loadingInsights={loadingInsights} 
          />;
        })}
        
        {filteredSubmissions.length === 0 && postingSubmissions.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No {selectedPlatform.toLowerCase()} submissions found for this campaign.
            </Alert>
          </Grid>
        )}
        
        {postingSubmissions.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No approved posting submissions with Instagram or TikTok links found for this campaign.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CampaignAnalytics;