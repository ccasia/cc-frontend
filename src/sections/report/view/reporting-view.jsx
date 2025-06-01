import { debounce } from 'lodash';
import { useMemo, useState, useEffect, useCallback } from 'react';

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
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [contentData, setContentData] = useState({
    account: '',
    contentType: '',
    datePosted: '',
    creatorName: '',
  });

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

  // Fetch content data from our existing endpoints
  const fetchContentData = useCallback(async (parsedUrl) => {
    setLoading(true);
    try {
      if (parsedUrl.platform === 'Instagram') {
        // Fetch basic video data first
        const response = await axiosInstance.get(
          endpoints.creators.social.instagramV2(parsedUrl.originalUrl)
        );

        if (response.data?.instagramVideo) {
          const video = response.data.instagramVideo;

          // Get creator information
          const creatorResponse = await axiosInstance.get(
            endpoints.creators.social.getCreatorByInstagramContent(video.id)
          );

          // Prepare metrics with video data as fallback
          const metrics = {
            likes: video.like_count,
            comments: video.comments_count,
            shares: video.shares_count,
            views: 0,
            reach: video.reach_count,
            saved: video.saved_count,
            profileVisits: 0,
            interactions: (video.like_count || 0) + (video.comments_count || 0),
            engagementRate: 0,
            mediaType: video.media_type,
            permalink: video.permalink,
            mediaUrl:
              video.media_url || video.thumbnail_url || '/assets/images/placeholder-image.jpg',
            comparisonMetrics: {
              likesChange: '+8%',
              commentsChange: '+5%',
              viewsChange: '+20%',
              savedChange: '+15%',
            },
          };

          // Try to get insights data if we have creator ID
          if (creatorResponse.data?.id) {
            try {
              const insightResponse = await axiosInstance.get(
                endpoints.creators.social.getInstagramMediaInsight(creatorResponse.data?.id),
                { params: { url: parsedUrl.originalUrl } }
              );

              // If insights exist, update metrics with real data
              if (insightResponse.data?.insight && insightResponse.data.insight.length > 0) {
                const { insight } = insightResponse.data;

                // Override fallback metrics with real insight data
                metrics.likes =
                  insight.find((item) => item.name === 'likes')?.value || metrics.likes;
                metrics.comments =
                  insight.find((item) => item.name === 'comments')?.value || metrics.comments;
                metrics.shares =
                  insight.find((item) => item.name === 'shares')?.value || metrics.shares;
                metrics.views =
                  insight.find((item) => item.name === 'views')?.value || metrics.views;
                metrics.reach =
                  insight.find((item) => item.name === 'reach')?.value || metrics.reach;
                metrics.saved =
                  insight.find((item) => item.name === 'saved')?.value || metrics.saved;
                metrics.interactions =
                  insight.find((item) => item.name === 'total_interactions')?.value ||
                  metrics.interactions;
              }
            } catch (error) {
              console.log('Insights not available, using fallback data:', error);
            }
          }

          // Set content data with our best available metrics
          setContentData({
            account: 'Instagram',
            contentType:
              // eslint-disable-next-line no-nested-ternary
              video.media_type === 'CAROUSEL_ALBUM'
                ? 'Carousel'
                : video.media_type === 'VIDEO'
                  ? 'Reel'
                  : 'Post',
            datePosted: video.datePosted ? fDate(video.datePosted) : 'Not available',
            creatorName: creatorResponse.data?.name || 'Unknown Creator',
            caption: video.caption || 'No caption available',
            metrics,
          });
        } else {
          setContentData({
            error:
              'This content is not tracked in our system. Only content from connected creator accounts can be analyzed.',
          });
        }
      } else if (parsedUrl.platform === 'TikTok') {
        // First get the content details
        const response = await axiosInstance.get(
          endpoints.creators.social.tiktokContent(parsedUrl.id)
        );

        if (response.data?.tiktokVideo) {
          const video = response.data.tiktokVideo;

          // Get creator information
          try {
            const creatorResponse = await axiosInstance.get(
              endpoints.creators.social.getCreatorByTiktokContent(parsedUrl.id)
            );

            // Calculate interactions from actual data
            const likes = video.like_count || 0;
            const comments = video.comment_count || 0;
            const shares = video.share_count || 0;
            const views = video.view_count || 0;
            const favorites = video.favorites_count || 0;
            const interactions = video.interactions || likes + comments + shares;

            // Estimate reach (not directly provided by TikTok API)
            const estimatedReach = Math.round(views * 0.5);
            const engagementRate = estimatedReach
              ? ((interactions / estimatedReach) * 100).toFixed(2)
              : 0;

            setContentData({
              account: 'TikTok',
              contentType: 'Video',
              datePosted: video.create_time ? fDate(video.create_time) : 'Not available',
              creatorName: creatorResponse.data?.display_name || 'Unknown Creator',
              caption: video.description || 'No caption available',
              metrics: {
                likes,
                comments,
                shares,
                views,
                reach: estimatedReach,
                saved: favorites,
                interactions,
                engagementRate,
                mediaType: 'Video',
                permalink: video.embed_link,
                mediaUrl: video.cover_image_url || '/assets/images/placeholder-image.jpg',
                comparisonMetrics: {
                  likesChange: '--',
                  commentsChange: '--',
                  viewsChange: '--',
                  savedChange: '--',
                },
              },
            });
          } catch (creatorError) {
            console.error('Error fetching creator info:', creatorError);

            // Calculate interactions from actual data without creator info
            const likes = video.like_count || 0;
            const comments = video.comment_count || 0;
            const shares = video.share_count || 0;
            const views = video.view_count || 0;
            const favorites = video.favorites_count || 0;
            const interactions = video.interactions || likes + comments + shares;

            // Estimate reach (not directly provided by TikTok API)
            const estimatedReach = Math.round(views * 0.5);

            setContentData({
              account: 'TikTok',
              contentType: 'Video',
              datePosted: video.create_time
                ? fDate(new Date(video.create_time * 1000))
                : 'Not available',
              creatorName: 'Creator',
              caption: video.description || 'No caption available',
              metrics: {
                likes,
                comments,
                shares,
                views,
                reach: estimatedReach,
                saved: favorites,
                interactions,
                mediaType: 'Video',
                permalink: video.embed_link,
                mediaUrl: video.cover_image_url || '/assets/images/placeholder-image.jpg',
                comparisonMetrics: {
                  likesChange: '--',
                  commentsChange: '--',
                  viewsChange: '--',
                  savedChange: '--',
                },
              },
            });
          }
        } else {
          setContentData({
            error:
              'This content is not tracked in our system. Only content from connected creator accounts can be analyzed.',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setContentData({
        error: error.message || 'Failed to fetch content data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useMemo(
    () =>
      debounce((inputUrl) => {
        if (inputUrl.trim() === '') {
          handleClearContent();
          return;
        }

        console.log('Original input URL:', inputUrl);

        const parsedUrl = parseContentUrl(inputUrl);

        console.log('Parsed URL result:', parsedUrl);

        if (parsedUrl) {
          parsedUrl.originalUrl = inputUrl;
          fetchContentData(parsedUrl);
        } else {
          setContentData({
            error: 'Invalid URL format. Please enter a valid Instagram or TikTok post URL.',
          });
          setLoading(false);
        }
      }, 500),
    [fetchContentData]
  );

  // Clear all content when URL is emptied
  useEffect(() => {
    if (url.trim() === '') {
      handleClearContent();
    }
  }, [url]);

  const handleClearContent = () => {
    setContentData({
      account: '',
      contentType: '',
      datePosted: '',
      creatorName: '',
    });
  };

  const handleBack = () => {
    setUrl('');
    handleClearContent();
  };

  const renderStatBar = ({ label, value }) => {
    // Default to 0 if value is undefined or null
    const displayValue = value || 0;

    // Calculate progress values based on the highest possible value among all metrics
    // This ensures the bar length accurately reflects the value proportionally
    const getProgressValue = (val) => {
      // Assuming maximum value we might encounter is around 200
      // Adjust this if your data has different ranges
      const maxPossibleValue = 200;
      return (val / maxPossibleValue) * 100;
    };

    return (
      <Box sx={{ mb: 1, width: '80%' }}>
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

  const renderEngagementCard = ({ icon, title, value, change, isPositive }) => (
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

        {change && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Iconify
              icon={isPositive ? 'mdi:arrow-up' : 'mdi:arrow-down'}
              color={isPositive ? '#4CAF50' : '#F44336'}
              width={14}
              height={14}
            />
            <Typography
              sx={{
                fontSize: 12,
                color: isPositive ? '#4CAF50' : '#F44336',
                ml: 0.5,
              }}
            >
              {change} from last post
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );

  const reportLanding = () => {
    if (!url || !contentData.account) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 4,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Instrument Serif',
              fontSize: { xs: 28, md: 36 },
              color: '#0066FF',
              textAlign: 'center',
              maxWidth: 600,
              lineHeight: 1.2,
            }}
          >
            Get insights and analytics into the posts of any creator!
          </Typography>

          <Box
            component="img"
            alt="empty content"
            src="/assets/icons/components/ic_report.svg"
            sx={{ width: 1, maxWidth: 160 }}
          />
        </Box>
      );
    }
    return null;
  };

  const renderContentDetails = () => {
    if (!contentData.account) return null;

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
                src={contentData.metrics?.mediaUrl}
                alt={contentData.caption || 'Content'}
                sx={{
                  width: '100%',
                  aspectRatio: '1', // Square aspect ratio
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
                  {contentData.caption}
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
                  {contentData.account}
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
                  {contentData.contentType}
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
                  {contentData.datePosted}
                </Typography>
              </Box>
            </Box>

            {/* Stats bars section */}
            <Typography
              variant="h5"
              sx={{
                fontSize: 32,
                fontWeight: 600,
                mb: 4,
              }}
            >
              Content Statistics
            </Typography>

            {/* Stats bars */}
            {renderStatBar({
              label: 'Profile Visits',
              value: contentData.metrics?.profileVisits || 0,
            })}

            {renderStatBar({
              label: 'Shares',
              value: contentData.metrics?.shares_count || 0,
            })}

            {renderStatBar({
              label: 'Interactions',
              value: contentData.metrics?.interactions || 0,
            })}

            {renderStatBar({
              label: 'Reach',
              value: contentData.metrics?.reach || 0,
            })}
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
              value: contentData.metrics?.views || 0,
              change: '--',
              isPositive: false,
            })}

            {renderEngagementCard({
              icon: 'mdi:heart',
              title: 'Likes',
              value: contentData.metrics?.likes || 0,
              change: '--',
              isPositive: false,
            })}

            {renderEngagementCard({
              icon: 'mdi:comment',
              title: 'Comments',
              value: contentData.metrics?.comments || 0,
              change: '--',
              isPositive: false,
            })}

            {renderEngagementCard({
              icon: 'mdi:bookmark',
              title: 'Saved',
              value: contentData.metrics?.saved || 0,
              change: '--',
              isPositive: false,
            })}
          </Grid>
        </Box>
      </Box>
    );
  };

  const renderContentSection = () => {
    if (!url) {
      return null;
    }

    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (contentData.error) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '30vh',
            gap: 2,
            mt: 5,
          }}
        >
          <Iconify icon="mdi:alert-circle-outline" color="#F44336" width={48} height={48} />
          <Typography
            color="error"
            sx={{
              mt: 1,
              textAlign: 'center',
              maxWidth: 600,
              fontFamily: 'Aileron, sans-serif',
            }}
          >
            {contentData.error}
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleBack} sx={{ mt: 2 }}>
            Try Another URL
          </Button>
        </Box>
      );
    }

    return renderContentDetails();
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {/* Header Section */}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        sx={{ mb: 5 }}
      >
        {/* Left side: Back button, Title, Description, URL input */}
        <Box sx={{ width: '100%' }}>
          {contentData.account && (
            <Button
              startIcon={<Iconify icon="ion:chevron-back" />}
              onClick={handleBack}
              sx={{
                color: '#666',
                fontWeight: 500,
                '&:hover': { backgroundColor: 'transparent' },
              }}
            >
              Back
            </Button>
          )}

          <Typography
            sx={{
              fontFamily: 'Aileron',
              fontSize: { xs: 24, md: 48 },
              fontWeight: 400,
            }}
          >
            {contentData.creatorName || 'Content Performance Report'}
          </Typography>

          {contentData.creatorName && (
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontSize: { xs: 24, md: 48 },
                fontWeight: 400,
              }}
            >
              Content Performance Report
            </Typography>
          )}

          <Typography
            sx={{
              fontSize: 14,
              mb: 1,
            }}
          >
            Post Link
          </Typography>

          <TextField
            placeholder="https://www.instagram.com/p/contentperformancereport/"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (e.target.value) {
                debouncedFetch(e.target.value);
              }
            }}
            sx={{
              width: '90%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: '#fff',
              },
            }}
          />
        </Box>

        {/* Right side: Logo (only shown when content is loaded) */}
        {url && contentData.account && (
          <Box
            component="img"
            src="/logo/cultcreativelogo.svg"
            alt="Cult Creative Logo"
            sx={{
              height: { xs: 50, sm: 100, md: 130 },
              alignSelf: { xs: 'flex-start', md: 'flex-end' },
            }}
          />
        )}
      </Stack>
      {/* Content or Landing Page */}
      {renderContentSection()}
      {reportLanding()}
    </Container>
  );
};

export default ReportingView;
