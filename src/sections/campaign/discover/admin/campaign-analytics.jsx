import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  IconButton,
  Link,
  Divider,
  Button,
} from '@mui/material';

import { useSocialInsights } from 'src/hooks/use-social-insights';
import { extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import { 
  calculateSummaryStats, 
  getMetricValue, 
  formatNumber, 
  calculateEngagementRate 
} from 'src/utils/socialMetricsCalculator';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
import Iconify from 'src/components/iconify';
import CacheMonitor from 'src/utils/cacheMonitor';

const CampaignAnalytics = ({ campaign }) => {
  const campaignId = campaign?.id;
  const submissions = campaign?.submission || [];

  // Extract posting submissions with URLs directly from campaign prop
  const postingSubmissions = useMemo(() => 
    extractPostingSubmissions(submissions), 
    [submissions]
  );

  // Get platform type (since each campaign has only one platform)
  const platformType = postingSubmissions.length > 0 ? postingSubmissions[0].platform : null;

  // Fetch insights for posting submissions
  const { 
    data: insightsData, 
    isLoading: loadingInsights, 
    failedUrls,
    error: insightsError,
    loadingProgress,
    clearCache
  } = useSocialInsights(postingSubmissions, campaignId);

  // Calculate summary statistics
  const summaryStats = useMemo(() => 
    calculateSummaryStats(insightsData), 
    [insightsData]
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

  const PlatformOverviewLayout = ({ platform, postCount, insightsData, summaryStats }) => {
    const calculateAdditionalMetrics = () => {
      const metrics = {};
      
      if (platform === 'Instagram') {
        metrics.totalShares = insightsData.reduce((sum, item) => 
          sum + getMetricValue(item.insight, 'shares'), 0);
        metrics.totalReach = insightsData.reduce((sum, item) => 
          sum + getMetricValue(item.insight, 'reach'), 0);
        metrics.totalInteractions = insightsData.reduce((sum, item) => 
          sum + getMetricValue(item.insight, 'total_interactions'), 0);
        metrics.creditsUsed = { used: 17, total: 30 };
        
      } else if (platform === 'TikTok') {
        const avgEngagement = insightsData.length > 0 ? 
          insightsData.reduce((sum, item) => {
            const views = getMetricValue(item.insight, 'views');
            const likes = getMetricValue(item.insight, 'likes');
            const comments = getMetricValue(item.insight, 'comments');
            const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
            return sum + engagementRate;
          }, 0) / insightsData.length : 0;
        
        metrics.avgEngagement = avgEngagement;
        metrics.totalShares = insightsData.reduce((sum, item) => 
          sum + getMetricValue(item.insight, 'shares'), 0);
        metrics.creditsUsed = { used: 17, total: 30 };
      }
      
      return metrics;
    };

    const additionalMetrics = calculateAdditionalMetrics();

    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3} sx={{ minHeight: 200 }}>
          {/* Left: Platform Overview Card */}
          <Grid item xs={12} md={2.5}>
            <Box 
              borderRadius={3}
              sx={{ 
                height: '400px',
                backgroundColor: '#F5F5F5',
              }}
            >
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
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#000000B2',
                      fontWeight: '400',
                      mb: 1
                    }}
                  >
                    {postCount}
                  </Typography>
                  
                  <Box
                    sx={{
                      width: 54,
                      height: 159,
                      backgroundColor: '#1340FF',
                      borderRadius: 100,
                      mb: 2
                    }}
                  />

                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#000000B2',
                      fontStyle: 'italic',
                      fontSize: '1rem'
                    }}
                  >
                    {platform}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Middle: Empty placeholder for future content */}
          <Grid item xs={12} md={5.5}>
            <Box 
              sx={{ 
                height: '400px',
                backgroundColor: '#F5F5F5',
                borderRadius: 3
              }}
            >
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 4
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Coming Soon
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right: Platform-specific metrics */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%' }}>
              <Box sx={{ width: { xs: '100%', md: 330 }}}>
                {summaryStats && (
                  <Grid container columnSpacing={2} sx={{ mt: { xs: 0, md: 6 } }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF">
                          {summaryStats.totalShares}
                        </Typography>
                        <Typography mb={4} fontFamily={'Aileron'} fontWeight={600} fontSize={20} color="#1340FF">
                          Total Shares
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF">
                          {additionalMetrics.creditsUsed.used}/{additionalMetrics.creditsUsed.total}
                        </Typography>
                        <Typography mb={4} fontFamily={'Aileron'} fontWeight={600} fontSize={20} color="#1340FF">
                          Credits Used
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ borderBottom: '2px solid #1340FF' }} />
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ borderBottom: '2px solid #1340FF' }} />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography mt={1} fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF">
                          {summaryStats.avgEngagementRate}%
                        </Typography>
                        <Typography fontFamily={'Aileron'} fontWeight={600} fontSize={20} color="#1340FF">
                          Engagement Rate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography mt={1} fontFamily={'Instrument Serif'} fontWeight={400} fontSize={55} color="#1340FF">
                          {summaryStats.totalInteractions}
                        </Typography>
                        <Typography fontFamily={'Aileron'} fontWeight={600} fontSize={20} color="#1340FF">
                          Interactions
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Box>
          </Grid>
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
        condition: insightsData[0]?.platform === 'Instagram'
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
                    <Typography fontFamily={'Aileron'} fontSize={20} fontWeight={600} color={'#636366'} >
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
                    <Typography fontFamily={'Aileron'} fontSize={20} fontWeight={600} color={'#636366'} >
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
                    <Typography fontFamily={'Aileron'} fontSize={20} fontWeight={600} color={'#636366'} >
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
                    <Typography fontFamily={'Aileron'} fontSize={20} fontWeight={600} color={'#636366'} >
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
                Platform: {platformType}<br />
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
        insightsData={insightsData}
        summaryStats={summaryStats}
      />

      {/* Platform Overview and Additional Metrics Layout */}
      {platformType && summaryStats && (
        <PlatformOverviewLayout 
          platform={platformType}
          postCount={postingSubmissions.length}
          insightsData={insightsData}
          summaryStats={summaryStats}
        />
      )}

      <Grid container spacing={1}>
        {postingSubmissions.map((submission) => {
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