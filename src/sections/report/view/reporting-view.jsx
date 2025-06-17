import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Stack,
  Button,
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
  const navigate = useNavigate();

  const settings = useSettingsContext();
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState({
    account: '',
    contentType: '',
    datePosted: '',
    creatorId: '',
    creatorName: '',
    campaignId: '',
    campaignName: '',    
    metrics: null,
    campaignAverages: null,
    campaignComparison: null,
    hasCampaignData: false,
    error: null,
  });

  const formatNumber = (num) => {
    if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(1);
      // Remove .0 if the decimal part is zero
      return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
    } else if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1);
      // Remove .0 if the decimal part is zero
      return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
    }
    return num.toLocaleString();
  };

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

  // Fetch content data using the media insight endpoint
  const fetchContentData = useCallback(async (postUrl, userId, campaignId) => {
    setLoading(true);
    setContent(prev => ({ ...prev, error: null }));

    try {
      const parsedUrl = parseContentUrl(postUrl);

      if (!parsedUrl) {
        throw new Error('Invalid or unsupported URL format');
      }

      if (parsedUrl.platform === 'Instagram') {
        // Build URL with campaignId if provided
        let apiUrl = endpoints.creators.social.getInstagramMediaInsight(userId, encodeURIComponent(postUrl), campaignId);

        const response = await axiosInstance.get(apiUrl);

        if (response.data?.video && response.data?.insight) {
          const { 
            video, 
            insight, 
            campaignAverages, 
            campaignComparison, 
            hasCampaignData 
          } = response.data;

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
            mediaUrl: video.thumbnail_url || video.media_url,
            caption: video.caption,
            metrics: currentMetrics,
            campaignAverages: campaignAverages,
            campaignComparison: campaignComparison,
            hasCampaignData: hasCampaignData,
            videoData: video,
            insightData: insight,
          }));
        } else {
          throw new Error('No video data found for this URL');
        }
      } else if (parsedUrl.platform === 'TikTok') {
        let apiUrl = endpoints.creators.social.getTikTokMediaInsight(userId, encodeURIComponent(postUrl), campaignId);

        const response = await axiosInstance.get(apiUrl);

        if (response.data?.video && response.data?.insight) {
          const { 
            video, 
            insight, 
            campaignAverages, 
            campaignComparison, 
            hasCampaignData
          } = response.data;

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
            caption: video.description,
            metrics: {
              likes: video.like_count || metricsMap.likes || 0,
              comments: video.comment_count || metricsMap.comments || 0,
              views: video.view_count || metricsMap.views || 0,
              shares: video.share_count || metricsMap.shares || 0,
              total_interactions: metricsMap.total_interactions || 0,
            },
            campaignAverages: campaignAverages,
            campaignComparison: campaignComparison,
            hasCampaignData: hasCampaignData || false,
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
    const campaignId = searchParams.get('campaignId');
    const campaignName = searchParams.get('campaignName');
    const userId = searchParams.get('userId');

    if (urlParam && userId) {
      setUrl(urlParam);
      setContent(prev => ({
        ...prev,
        creatorId: userId || '',
        creatorName: creatorName || '',
        campaignId: campaignId || '',
        campaignName: campaignName || '',
      }));

      const parsedUrl = parseContentUrl(urlParam);
      if (parsedUrl) {
        fetchContentData(urlParam, userId, campaignId);
      }
    }
  }, [searchParams, fetchContentData]);

  const handleBack = () => {
    navigate('/dashboard/report');
  };

  const renderCircularStat = ({ width, label, value, metricKey }) => {
    const displayValue = value || 0;
    
    // Use campaign averages if available, otherwise fallback to hardcoded values
    let avgValue = 0;
    let percentageDiff = 0;
    let isAboveAverage = false;

    if (content.hasCampaignData && content.campaignComparison && content.campaignComparison[metricKey]) {
      const comparison = content.campaignComparison[metricKey];
      avgValue = comparison.average;
      percentageDiff = Math.abs(comparison.change);
      isAboveAverage = comparison.isAboveAverage;
    } else {
      // Fallback values if no campaign data
      const fallbackAverages = {
        'total_interactions': 300,
        'reach': 8000,
        'shares': 100
      };
      avgValue = fallbackAverages[metricKey] || 0;
      isAboveAverage = displayValue > avgValue;
      percentageDiff = avgValue > 0 ? Math.abs(((displayValue - avgValue) / avgValue) * 100) : 0;
    }
    
    // Calculate current progress as percentage of average
    // If current is above average, show full circle (100%)
    // If current is below average, show partial circle based on ratio
    const currentProgress = isAboveAverage ? 100 : avgValue > 0 ? (displayValue / avgValue) * 100 : 0;

    const comparisonText = content.hasCampaignData ? 'campaign avg' : 'average creator';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'center', md: 'center' }, width: '100%' }}>
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 600,
            color: '#000',
            mb: 1,
            textAlign: 'center',
          }}
        >
          {label}
        </Typography>

        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2, width: 160, height: 160 }}>
          {/* Average circle - always full (100%) */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={160}
            thickness={6}
            sx={{
              color: '#bbb',
              position: 'absolute',
            }}
          />
          
          {/* Current value circle - partial based on performance vs average */}
          <CircularProgress
            variant="determinate"
            value={currentProgress}
            size={160}
            thickness={6}
            sx={{
              color: '#1340FF',
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
                color: '#1340FF',
              }}
            >
              {formatNumber(displayValue)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Iconify
                icon={isAboveAverage ? 'mdi:arrow-up' : 'mdi:arrow-down'}
                color={isAboveAverage ? '#4CAF50' : '#F44336'}
                width={15}
                height={15}
              />
              <Typography
                sx={{
                  fontSize: 12,
                  color: isAboveAverage ? '#4CAF50' : '#F44336',
                  ml: 0.5,
                }}
              >
                {Math.round(percentageDiff)}% 
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: '#666',
                  ml: 0.5
                }}
              >
                from
              </Typography>
            </Box>
            
            <Typography
              sx={{
                fontSize: 12,
                color: '#666',
                textAlign: 'center',
              }}
            >
              {comparisonText}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderEngagementCard = ({ height, title, value, metricKey }) => {
    let changeDisplay = '+100%';
    let changeIsPositive = true;
    let comparisonText = 'campaign average';

    // Use campaign comparison data if available
    if (content.hasCampaignData && content.campaignComparison && content.campaignComparison[metricKey]) {
      const comparison = content.campaignComparison[metricKey];
      changeDisplay = comparison.changeText;
      changeIsPositive = comparison.isAboveAverage;
    } else {
      comparisonText = 'no campaign data';
      changeDisplay = '--';
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 2,
          px: { sm: 3, xs: 6 },
          height: height || 116,
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
            justifyContent: 'space-between'
          }}
        >
          {/* Left side - Title and comparison info */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
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

            {/* Comparison section */}            
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              {content.hasCampaignData && changeDisplay !== '--' && !changeDisplay.startsWith('0%') && (
                <Iconify
                  icon={changeIsPositive ? 'mdi:arrow-up' : 'mdi:arrow-down'}
                  sx={{
                    width: 18,
                    height: 17,
                    color: changeIsPositive ? '#1ABF66' : '#F44336',
                  }}
                />
              )}
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: 16,
                  color: (() => {
                    if (!content.hasCampaignData) return '#999';
                    if (changeDisplay.startsWith('0%')) return '#636366';
                    return changeIsPositive ? '#1ABF66' : '#F44336';
                  })(),
                }}
              >
                {changeDisplay}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: 16,
                  textAlign: 'right',
                  color: '#636366',
                  ml: 1,
                }}
              >
                from
              </Typography>
            </Box>

            {/* "campaign average" text */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                height: 20,
              }}
            >
              <Typography
                sx={{
                  height: 20,
                  fontWeight: 500,
                  fontSize: 16,
                  lineHeight: '20px',
                  color: '#636366',
                }}
              >
                {comparisonText}
              </Typography>
            </Box>
          </Box>

          {/* Right side - Icon and value */}
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

  const renderContentDetails = () => {
    if (!content.account) return null;

    return (
      <Box sx={{ mt: 4, mr: { sm: 4, xs: 0 } }}>
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

        {/* Campaign Info Banner - for dev testing only */}
        {/* {content.hasCampaignData && (
          <Card sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa', border: '1px solid #e3f2fd' }}>
            <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
              📊 Campaign Analysis Active
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Comparing with <strong>{content.campaignName || 'campaign'}</strong> averages from {content.campaignAverages?.postCount || 0} posts
            </Typography>
          </Card>
        )} */}

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
            mb: 2,
            mt: 1,
          }}
        >
          Back
        </Button>

        <Stack
          direction={{ md: 'row' }}
          sx={{ width: '100%' }}
          justifyContent='space-between'
          alignContent={{ xs: 'flex-start' }}
          flexDirection={{ xs: 'column-reverse', md: 'row' }}
        >
          {/* Left side: Creator Name and Title */}
          <Box
            alignSelf={{ xs: 'flex-start', md: 'center' }}
          >
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontSize: { xs: 32, md: 42 },
                fontWeight: 400,
                lineHeight: { xs: '35px', sm: '50px'}
              }}
            >
              {content.creatorName}
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontSize: { xs: 32, md: 42 },
                fontWeight: 400,
                lineHeight: { xs: '35px', sm: '50px'}
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
              height: { xs: 50, sm: 100, md: 130 },
              alignSelf: { xs: 'flex-start', md: 'center' },
              mb: { xs: 2, md: 0 }
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