// reporting-view.jsx
import { debounce } from 'lodash';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Grid,
  Card,
  Stack,
  Button,
  Divider,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';

import { fDate } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

// Import platform-specific layout components
import InstagramLayout from '../components/InstagramLayout';
import TikTokLayout from '../components/TikTokLayout';

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

  const parseContentUrl = (inputUrl) => {
    try {
      const urlObj = new URL(inputUrl);

      // Instagram
      if (urlObj.hostname.includes('instagram.com')) {
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
        if (urlObj.pathname.includes('/video/')) {
          const videoId = urlObj.pathname.split('/video/')[1].split('?')[0];
          return {
            platform: 'TikTok',
            type: 'Video',
            id: videoId,
          };
        }
        if (urlObj.pathname.match(/\/@[^/]+\/[^/]+/)) {
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
      isPositive,
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
        const response = await axiosInstance.get(
          endpoints.creators.social.getInstagramMediaInsight(userId, encodeURIComponent(postUrl))
        );

        if (response.data?.video && response.data?.insight) {
          const { video, insight, previousPost, changes, hasPreviousPost } = response.data;

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
          };

          setContent(prev => ({
            ...prev,
            account: 'Instagram',
            contentType: parsedUrl.type,
            datePosted: fDate(video.timestamp),
            mediaUrl: video.thumbnail_url,
            metrics: currentMetrics,
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
              shares: video.share_count || metricsMap.shares || 0,
              total_interactions: metricsMap.total_interactions || 0,
            },
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

  useEffect(() => {
    const urlParam = searchParams.get('url');
    const creatorName = searchParams.get('creatorName');
    const campaignName = searchParams.get('campaignName');
    const userId = searchParams.get('userId');

    if (urlParam && userId) {
      setUrl(urlParam);
      setContent(prev => ({
        ...prev,
        creatorName: creatorName || '',
        campaignName: campaignName || '',
        creatorId: userId || '',
      }));

      const parsedUrl = parseContentUrl(urlParam);
      if (parsedUrl) {
        fetchContentData(urlParam, userId);
      }
    }
  }, [searchParams, fetchContentData]);

  const handleBack = () => {
    navigate('/dashboard/report');
  };

  const renderCircularStat = ({ width, label, value, averageValue, isAboveAverage, percentageDiff }) => {
    const displayValue = value || 0;
    const avgValue = averageValue || 0;
    
    const maxVal = Math.max(displayValue, avgValue) * 1.2;
    const currentProgress = maxVal > 0 ? (displayValue / maxVal) * 100 : 0;
    const averageProgress = maxVal > 0 ? (avgValue / maxVal) * 100 : 0;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'center', md: 'center' }, width: '100%' }}>
        <Typography
          sx={{
            width: width ? width : '50%',
            fontSize: 24,
            fontWeight: 600,
            color: '#000',
            mb: 2,
            alignSelf: 'center'
          }}
        >
          {label}
        </Typography>

        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2, width: 157, height: 157 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={157}
            thickness={6}
            sx={{
              color: '#e0e0e0',
              position: 'absolute',
            }}
          />
          
          <CircularProgress
            variant="determinate"
            value={averageProgress}
            size={157}
            thickness={6}
            sx={{
              color: '#bbb',
              position: 'absolute',
            }}
          />
          
          <CircularProgress
            variant="determinate"
            value={currentProgress}
            size={157}
            thickness={6}
            sx={{
              color: '#0066FF',
            }}
          />
          
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Instrument Serif", serif',
                fontWeight: 400,
                fontSize: 36,
                lineHeight: '28px',
                letterSpacing: '0%',
                textAlign: 'center',
                color: '#0066FF',
              }}
            >
              {displayValue}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Iconify
                icon={isAboveAverage ? 'mdi:arrow-up' : 'mdi:arrow-down'}
                color={isAboveAverage ? '#4CAF50' : '#F44336'}
                width={16}
                height={16}
              />
              <Typography
                sx={{
                  fontSize: 12,
                  color: isAboveAverage ? '#4CAF50' : '#F44336',
                  ml: 0.5,
                }}
              >
                {percentageDiff}% from
              </Typography>
            </Box>
            
            <Typography
              sx={{
                fontSize: 12,
                color: '#666',
                textAlign: 'center',
              }}
            >
              average creator
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderEngagementCard = ({ height, icon, title, value }) => {
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
      <Box
        elevation={0}
        sx={{
          height: height ? height : 116,
          backgroundColor: '#f0f0f0',
          borderRadius: '20px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          p: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            ml: 10
          }}
        >
          <Box
            sx={{
              backgroundColor: '#0066FF',
              borderRadius: 1,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify 
              icon={icon} 
              color="#fff" 
              width={24} 
              height={24} 
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
          }}
        >
          <Typography 
            sx={{ 
              fontSize: 24,
              color: '#666',
              textAlign: 'right',
            }}
          >
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            pr: { xs: 1, sm: 2 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >            
            {hasPreviousData && actualChange !== 0 && (
              <Iconify
                icon={changeIsPositive ? 'mdi:arrow-up' : 'mdi:arrow-down'}
                color={changeIsPositive ? '#4CAF50' : '#F44336'}
                width={{ xs: 12, sm: 18 }}
                height={{ xs: 12, sm: 18 }}
              />
            )}
            <Typography
              sx={{
                fontSize: 18,
                color: (() => {
                  if (!hasPreviousData) return '#999';
                  if (actualChange === 0) return '#666';
                  return changeIsPositive ? '#4CAF50' : '#F44336';
                })(),
                ml: hasPreviousData && actualChange !== 0 ? 0.5 : 0,
                lineHeight: 1.2,
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
              }}
            >
              {changeDisplay} from last post
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
          }}
        >
          <Typography 
            sx={{ 
              fontSize: 24,
              fontWeight: 600, 
              color: '#000',
              textAlign: 'right',
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderContentDetails = () => {
    if (!content.account) return null;

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

        {/* Conditionally render platform-specific layouts */}
        {content.account === 'Instagram' ? (
          <InstagramLayout
            content={content}
            renderEngagementCard={renderEngagementCard}
            renderCircularStat={renderCircularStat}
          />
        ) : content.account === 'TikTok' ? (
          <TikTokLayout
            content={content}
            renderEngagementCard={renderEngagementCard}
            renderCircularStat={renderCircularStat}
          />
        ) : null}
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