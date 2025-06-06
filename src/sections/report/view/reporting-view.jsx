// reporting-view.jsx
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
  const settings = useSettingsContext();
  const navigate = useNavigate();
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
            mediaUrl: video.thumbnail_url,
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
            hasCampaignData: false,
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
    
    const maxVal = Math.max(displayValue, avgValue) * 1.2;
    const currentProgress = maxVal > 0 ? (displayValue / maxVal) * 100 : 0;
    const averageProgress = maxVal > 0 ? (avgValue / maxVal) * 100 : 0;

    const comparisonText = content.hasCampaignData ? 'campaign average' : 'average creator';

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

        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2, width: 165, height: 165 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={165}
            thickness={6}
            sx={{
              color: '#e0e0e0',
              position: 'absolute',
            }}
          />
          
          <CircularProgress
            variant="determinate"
            value={averageProgress}
            size={165}
            thickness={6}
            sx={{
              color: '#bbb',
              position: 'absolute',
            }}
          />
          
          <CircularProgress
            variant="determinate"
            value={currentProgress}
            size={165}
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
              {displayValue.toLocaleString()}
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
                {Math.round(percentageDiff)}% from
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

  const renderEngagementCard = ({ height, icon, title, value, metricKey }) => {
    let changeDisplay = '--';
    let changeIsPositive = false;
    let comparisonText = 'from campaign avg';

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
          height: height ? height : 116,
          backgroundColor: '#f0f0f0',
          borderRadius: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 2fr 1fr', // 4 columns: icon, title, comparison, value
          gridTemplateRows: '1fr 1fr',
          p: 2,
          alignItems: 'center',
        }}
      >
        {/* Top Row - Icon */}
        <Box
          sx={{
            gridColumn: '1 / 3',
            gridRow: '1',
            display: 'flex',
            ml: 8,
            justifyContent: 'center',
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

        {/* Top Row - Title */}
        <Box
          sx={{
            gridColumn: '3 / -1', // Spans from column 3 to the end
            gridRow: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Typography 
            sx={{ 
              fontSize: 24,
              color: '#666',
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Bottom Row - Comparison Change */}
        <Box
          sx={{
            gridColumn: '1 / 4', // Spans columns 1-3
            gridRow: '2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            mt: 1,
          }}
        >
          {content.hasCampaignData && changeDisplay !== '--' && !changeDisplay.startsWith('0%') && (
            <Iconify
              icon={changeIsPositive ? 'mdi:arrow-up' : 'mdi:arrow-down'}
              color={changeIsPositive ? '#4CAF50' : '#F44336'}
              width={18}
              height={18}
              sx={{ mr: 0.5 }}
            />
          )}
          <Typography
            sx={{
              fontSize: 18,
              color: (() => {
                if (!content.hasCampaignData) return '#999';
                if (changeDisplay.startsWith('0%')) return '#666';
                return changeIsPositive ? '#4CAF50' : '#F44336';
              })(),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {changeDisplay} {comparisonText}
          </Typography>
        </Box>

        {/* Bottom Row - Value */}
        <Box
          sx={{
            mt: 1,
            gridColumn: '3 / -1', // Spans from column 3 to the end
            gridRow: '2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Typography 
            sx={{ 
              fontSize: 24,
              fontWeight: 600, 
              color: '#000',
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

        {/* Campaign Info Banner */}
        {content.hasCampaignData && (
          <Card sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa', border: '1px solid #e3f2fd' }}>
            <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
              📊 Campaign Analysis Active
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Comparing with <strong>{content.campaignName || 'campaign'}</strong> averages from {content.campaignAverages?.postCount || 0} posts
            </Typography>
          </Card>
        )}

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