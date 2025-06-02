import { debounce } from 'lodash';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Grid,
  Card,
  Stack,
  Paper,
  Button,
  Divider,
  Container,
  TextField,
  Typography,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { fDate } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

const ReportingView = () => {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState({
    account: '',
    contentType: '',
    datePosted: '',
    creatorName: '',
    campaignName: '',
    creatorId: '',
    metrics: null,
    error: null,
  });

  // Get URL parameters on component mount
  useEffect(() => {
    const urlParam = searchParams.get('url');
    const creatorName = searchParams.get('creatorName');
    const campaignName = searchParams.get('campaignName');
    const userId = searchParams.get('userId');

    console.log('url param: ', urlParam);
    console.log('user id: ', userId);
    console.log('creatorName: ', creatorName);
    console.log('campaignName: ', campaignName);

    if (urlParam && userId) {
      setUrl(urlParam);
      // Store additional parameters for context
      setContent(prev => ({
        ...prev,
        creatorName: creatorName || '',
        campaignName: campaignName || '',
        creatorId: userId || '',
      }));

      // Parse the URL and fetch data
      const parsedUrl = parseContentUrl(urlParam);
      if (parsedUrl) {
        fetchContentData(urlParam, userId);
      }
    }
  }, [searchParams]);

  const parseContentUrl = (inputUrl) => {
    try {
      const urlObj = new URL(inputUrl);

      // Instagram
      if (urlObj.hostname.includes('instagram.com')) {
        // Get the shortcode from Instagram URL
        let shortcode = '';

        if (urlObj.pathname.includes('/reel/')) {
          shortcode = urlObj.pathname.split('/reel/')[1].split('/')[0];
          return {
            platform: 'Instagram',
            type: 'Reel',
            id: shortcode,
          };
        }
        if (urlObj.pathname.includes('/p/')) {
          shortcode = urlObj.pathname.split('/p/')[1].split('/')[0];
          return {
            platform: 'Instagram',
            type: 'Post',
            id: shortcode,
          };
        }
      }

      // TikTok
      if (urlObj.hostname.includes('tiktok.com')) {
        // TikTok URL can be in different formats
        if (urlObj.pathname.includes('/video/')) {
          const videoId = urlObj.pathname.split('/video/')[1].split('?')[0];
          return {
            platform: 'TikTok',
            type: 'Video',
            id: videoId,
          };
        }
        if (urlObj.pathname.match(/\/@[^/]+\/[^/]+/)) {
          // Handle format like /@username/video/1234567890
          const videoId = urlObj.pathname.split('/').pop().split('?')[0];
          return {
            platform: 'TikTok',
            type: 'Video',
            id: videoId,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Invalid URL:', error);
      return null;
    }
  };

  // Helper function to format percentage change for display
  const formatPercentageChange = (percentageChange) => {
    const absChange = Math.abs(percentageChange);
    const isPositive = percentageChange >= 0;
    
    return {
      value: `${Math.round(absChange)}%`,
      isPositive: isPositive,
    };
  };

  // Fetch content data using the media insight endpoint
  const fetchContentData = useCallback(async (postUrl, userId) => {
    setLoading(true);
    setContent(prev => ({ ...prev, error: null }));

    try {
      const parsedUrl = parseContentUrl(postUrl);

      if (!parsedUrl) {
        throw new Error('Invalid or unsupported URL format');
      }

      if (parsedUrl.platform === 'Instagram') {
        // Use your existing getInstagramMediaInsight function
        const response = await axiosInstance.get(
          endpoints.creators.social.getInstagramMediaInsight(userId, encodeURIComponent(postUrl))
        );

        if (response.data?.video && response.data?.insight) {
          // NEW: Extract the additional data from the simplified backend response
          const { video, insight, previousPost, changes, hasPreviousPost } = response.data;

          // Extract current metrics
          const currentMetricsMap = {};
          insight.forEach(item => {
            currentMetricsMap[item.name] = item.value;
          });

          const currentMetrics = {
            views: currentMetricsMap.views || 0,
            likes: video.like_count || currentMetricsMap.likes || 0,
            comments: video.comments_count || currentMetricsMap.comments || 0,
            saved: currentMetricsMap.saved || 0,
            shares: currentMetricsMap.shares || 0,
            reach: currentMetricsMap.reach || 0,
            total_interactions: currentMetricsMap.total_interactions || 0,
            profile_visits: currentMetricsMap.profile_visits || 0
          };

          setContent(prev => ({
            ...prev,
            account: 'Instagram',
            contentType: parsedUrl.type,
            datePosted: fDate(video.timestamp),
            mediaUrl: video.media_url,
            metrics: currentMetrics,
            // NEW: Add the previous post data and changes
            previousMetrics: previousPost || {},
            changes: changes || {},
            hasPreviousPost: hasPreviousPost || false,
            videoData: video,
            insightData: insight,
          }));
        } else {
          throw new Error('No video data found for this URL');
        }
      } else if (parsedUrl.platform === 'TikTok') {
        // Keep your existing TikTok logic without previous post comparison for now
        const response = await axiosInstance.get(
          endpoints.creators.social.getTikTokMediaInsight(userId, encodeURIComponent(postUrl))
        );

        if (response.data?.video && response.data?.insight) {
          const { video, insight } = response.data;

          const metricsMap = {};
          insight.forEach(item => {
            metricsMap[item.name] = item.value;
          });

          setContent(prev => ({
            ...prev,
            account: 'TikTok',
            contentType: parsedUrl.type,
            datePosted: fDate(video.timestamp),
            mediaUrl: video.cover_image_url,
            metrics: {
              likes: video.like_count || metricsMap.likes || 0,
              comments: video.comment_count || metricsMap.comments || 0,
              views: video.view_count || metricsMap.views || 0,
              saved: 0,
              shares: video.share_count || metricsMap.shares || 0,
              reach: 0,
              total_interactions: metricsMap.total_interactions || 0,
              profile_visits: 0
            },
            // No previous post comparison for TikTok yet
            hasPreviousPost: false,
            changes: {},
            videoData: video,
            insightData: insight,
          }));
        } else {
          throw new Error('No TikTok video data found for this URL');
        }
      } else {
        throw new Error('Unsupported platform');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent(prev => ({
        ...prev,
        error: error.response?.data?.message || error.message || 'Failed to fetch content data. Please try again.',
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = () => {
    // Navigate back to the report list page
    navigate('/dashboard/report');
  };

  const renderStatBar = ({ label, value, maxValue }) => {
    // Default to 0 if value is undefined or null
    const displayValue = value || 0;

    // Calculate progress values based on the highest possible value among all metrics
    // This ensures the bar length accurately reflects the value proportionally
    const getProgressValue = (val) => {
      // Use the maximum value from your current data set as 100%
      return maxValue > 0 ? (val / maxValue) * 100 : 0;
    };

    return (
      <Box sx={{ width: '80%' }}>
        {/* Label in gray, large italic font */}
        <Typography
          sx={{
            fontSize: 32,
            fontStyle: 'italic',
            color: '#777',
            fontFamily: 'Aileron',
          }}
        >
          {label}
        </Typography>

        <Box sx={{ position: 'relative', width: '100%' }}>
          {/* Blue progress bar */}
          <LinearProgress
            variant="determinate"
            value={getProgressValue(displayValue)}
            sx={{
              width: '100%',
              height: 45,
              borderRadius: 50,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#0066FF',
                borderRadius: 50,
              },
            }}
          />

          {/* Number positioned to the right of the bar */}
          <Typography
            sx={{
              position: 'absolute',
              right: -70, // Adjust this value to position the number correctly
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 24,
              fontWeight: 400,
              color: '#555',
              ml: 2,
            }}
          >
            {displayValue}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderEngagementCard = ({ icon, title, value }) => {
    // For Instagram posts with previous post data
    const metricKey = title.toLowerCase();
    const actualChange = content.changes?.[metricKey];
    const hasPreviousData = content.hasPreviousPost && actualChange !== undefined;
    
    let changeDisplay = '--';
    let changeIsPositive = false;
    
    if (hasPreviousData) {
      if (actualChange === 0) {
        changeDisplay = '0%';
        changeIsPositive = true;
      } else {
        const formatted = formatPercentageChange(actualChange);
        changeDisplay = formatted.value;
        changeIsPositive = formatted.isPositive;
      }
    }

    return (
      <Grid item xs={6} sm={3}>
        <Paper
          elevation={0}
          sx={{
            backgroundColor: '#f0f0f0',
            borderRadius: 2,
            padding: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                backgroundColor: '#0066FF',
                borderRadius: 1,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1,
              }}
            >
              <Iconify icon={icon} color="#fff" width={18} height={18} />
            </Box>
            <Typography sx={{ fontSize: 14, color: '#666' }}>{title}</Typography>
          </Box>

          <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#000' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            {hasPreviousData && actualChange !== 0 && (
              <Iconify
                icon={changeIsPositive ? 'mdi:arrow-up' : 'mdi:arrow-down'}
                color={changeIsPositive ? '#4CAF50' : '#F44336'}
                width={14}
                height={14}
              />
            )}
            <Typography
              sx={{
                fontSize: 12,
                color: hasPreviousData ? 
                  (actualChange === 0 ? '#666' : (changeIsPositive ? '#4CAF50' : '#F44336')) : 
                  '#999',
                ml: hasPreviousData && actualChange !== 0 ? 0.5 : 0,
              }}
            >
              {changeDisplay} from last post
            </Typography>
          </Box>
        </Paper>
      </Grid>
    );
  };

  const renderContentDetails = () => {
    if (!content.account) return null;

    // Calculate the maximum value from all three metrics for proportional scaling
    const statsData = [
      { label: 'Profile Visits', value: content.metrics?.shares || 0 },
      { label: 'Shares', value: content.metrics?.shares || 0 },
      { label: 'Interactions', value: content.metrics?.total_interactions || 0 },
      { label: 'Reach', value: content.metrics?.reach || 0 }
    ];
    
    const maxValue = 100

    return (
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: 24,
            fontWeight: 600,
            mb: 3,
          }}
        >
          Selected Content
        </Typography>

        <Grid container spacing={3}>
          {/* Content Image and Caption */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                borderRadius: 0, // Sharp corners
                overflow: 'hidden',
                height: 'auto', // Changed from 100% to auto
                boxShadow: 'none',
                border: '1px solid #eee',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                component="img"
                src={content.videoData.media_url}
                alt={content.videoData.caption || 'Content'}
                sx={{
                  width: '100%',
                  objectFit: 'cover',
                  display: 'block', // Removes any extra spacing
                }}
              />
              <Box
                sx={{
                  p: 2,
                  borderTop: '1px solid #eee', // Add a subtle separator
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    color: '#333',
                    mb: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {content.videoData.caption} || {}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Content Stats */}
          <Grid item xs={12} md={7}>
            {/* Account, Content Type, Date Posted Row */}
            <Box
              sx={{
                display: 'flex',
                mb: 3,
                pb: 2,
              }}
            >
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontSize: 20, color: '#666', mb: 1 }}>Account</Typography>
                <Typography
                  sx={{
                    fontSize: 36,
                    color: '#0066FF',
                    fontWeight: 400,
                    fontFamily: '"Instrument Serif", serif',
                  }}
                >
                  {content.account}
                </Typography>
              </Box>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 2, borderColor: '#0066FF', borderWidth: 0.5 }}
              />

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontSize: 20, color: '#666', mb: 1 }}>Content Type</Typography>
                <Typography
                  sx={{
                    fontSize: 36,
                    color: '#0066FF',
                    fontWeight: 400,
                    fontFamily: '"Instrument Serif", serif',
                  }}
                >
                  {content.contentType}
                </Typography>
              </Box>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 2, borderColor: '#0066FF', borderWidth: 0.5 }}
              />

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontSize: 20, color: '#666', mb: 1 }}>Date Posted</Typography>
                <Typography
                  sx={{
                    fontSize: 36,
                    color: '#0066FF',
                    fontWeight: 400,
                    fontFamily: '"Instrument Serif", serif',
                  }}
                >
                  {content.datePosted}
                </Typography>
              </Box>
            </Box>

            {/* Stats bars section */}
            <Typography
              variant="h5"
              sx={{
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              Content Statistics
            </Typography>

            {/* Stats bars */}
            <Box
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                py: 2,
              }}
            >
              {renderStatBar({
                label: 'Profile Visits',
                value: content.metrics?.profile_visits || 0,
                maxValue: maxValue
              })}

              {renderStatBar({
                label: 'Shares',
                value: content.metrics?.shares || 0,
                maxValue: maxValue
              })}

              {renderStatBar({
                label: 'Interactions',
                value: content.metrics?.total_interactions || 0,
                maxValue: maxValue
              })}

              {renderStatBar({
                label: 'Reach',
                value: content.metrics?.reach || 0,
                maxValue: maxValue
              })}
            </Box>
          </Grid>
        </Grid>

        {/* Content Engagement Section */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: 20,
              fontWeight: 600,
              mb: 3,
            }}
          >
            Content Engagement
          </Typography>

          <Grid container spacing={2}>
            {renderEngagementCard({
              icon: 'mdi:eye',
              title: 'Views',
              value: content.metrics?.views || 0,
            })}

            {renderEngagementCard({
              icon: 'mdi:heart',
              title: 'Likes',
              value: content.metrics?.likes || 0,
            })}

            {renderEngagementCard({
              icon: 'mdi:comment',
              title: 'Comments',
              value: content.metrics?.comments || 0,
            })}

            {renderEngagementCard({
              icon: 'mdi:bookmark',
              title: 'Saved',
              value: content.metrics?.saved || 0,
            })}
          </Grid>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {/* Header Section */}
      <Stack
        direction="column"
        alignItems="flex-start"
        sx={{ mb: 5 }}
      >
        <Button
          startIcon={<Iconify icon="ion:chevron-back" />}
          onClick={handleBack}
          sx={{
            color: '#666',
            fontSize: 14,
            fontWeight: 600,
            '&:hover': { backgroundColor: 'transparent' },
          }}
        >
          Back
        </Button>

        <Stack
          direction={{ md: 'row' }}
          sx={{ width: '100%' }}
          justifyContent='space-between'
          alignContent={{ xs: 'flex-start' }}
        >
          {/* Left side: Creator Name and Title */}
          <Box
            alignSelf={{ xs: 'flex-start', md: 'center' }}
            mb={{ xs: 2 }}
          >
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontSize: { xs: 32, md: 48 },
                fontWeight: 400,
                lineHeight: '50px'
              }}
            >
              {content.creatorName}
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontSize: { xs: 32, md: 48 },
                fontWeight: 400,
                lineHeight: '50px'
              }}
            >
              Content Performance Report
            </Typography>
          </Box>
          {/* Right side: Logo */}
          <Box
            component="img"
            src="/logo/cultcreativelogo.svg"
            alt="Cult Creative Logo"
            sx={{
              height: { xs: 50, sm: 100, md: 144 },
              alignSelf: { xs: 'flex-start', md: 'center' },
            }}
          />

        </Stack>
      </Stack>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {content.error && (
        <Card sx={{ p: 3, mb: 3, backgroundColor: '#fff5f5' }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error Loading Content
          </Typography>
          <Typography color="error">{content.error}</Typography>
        </Card>
      )}

      {/* Content Report */}
      {!loading && !content.error && content.metrics && (
        renderContentDetails()
      )}

      {/* Empty State */}
      {!loading && !content.error && !content.metrics && (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Content Data Available
          </Typography>
          <Typography color="text.secondary">
            Unable to load performance data for this content.
          </Typography>
        </Card>
      )}
    </Container>
  );
};

export default ReportingView;