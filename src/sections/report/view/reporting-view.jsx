import { 
  Container, 
  Stack, 
  Typography, 
  Box, 
  TextField, 
  Grid,
  Button
} from '@mui/material';
import { useSettingsContext } from 'src/components/settings';
import { useState, useCallback, useEffect } from 'react';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { fDate } from 'src/utils/format-time';
import Iconify from 'src/components/iconify';

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

  // Parse URL to determine platform and content type
  const parseContentUrl = (inputUrl) => {
    try {
      const urlObj = new URL(inputUrl);
      // Instagram
      if (urlObj.hostname.includes('instagram.com')) {
        let contentId = '';
        let type = 'Post';
        
        if (urlObj.pathname.includes('/reel/')) {
          type = 'Reel';
          contentId = urlObj.pathname.split('/reel/')[1].split('/')[0];
        } else if (urlObj.pathname.includes('/p/')) {
          type = 'Post';
          contentId = urlObj.pathname.split('/p/')[1].split('/')[0];
        } else {
          return null;
        }
        
        return {
          platform: 'Instagram',
          type,
          id: contentId,
        };
      }
      // TikTok
      if (urlObj.hostname.includes('tiktok.com')) {
        const videoId = urlObj.pathname.split('/video/')[1]?.split('?')[0] || 
                      urlObj.pathname.split('/photo/')[1]?.split('?')[0];
        const username = urlObj.pathname.split('@')[1]?.split('/')[0];
        
        if (!videoId || !username) return null;

        return {
          platform: 'TikTok',
          type: urlObj.pathname.includes('/photo/') ? 'Photo' : 'Video',
          id: videoId,
          username
        };
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
        // First get the content details
        const response = await axiosInstance.get(
          endpoints.creators.social.instagramContent(parsedUrl.id)
        );
        
        if (response.data?.instagramVideo) {
          const video = response.data.instagramVideo;
          
          // Get creator information
          try {
            const creatorInfo = await axiosInstance.get(
              endpoints.creators.social.getCreatorByInstagramContent(parsedUrl.id)
            );
            
            // Format the timestamp if available
            const formattedDate = video.timestamp ? fDate(video.timestamp, 'dd/MM/yy') : 'Not available';
            
            setContentData({
              account: 'Instagram',
              contentType: parsedUrl.type,
              datePosted: formattedDate,
              creatorName: creatorInfo.data?.name || 'Unknown Creator',
              caption: video.caption || "No caption available",
              metrics: {
                likes: video.like_count || 0,
                comments: video.comments_count || 0,
                shares: 0, // Instagram doesn't provide share counts
                views: 0, // Only use real data
                mediaType: video.media_type,
                permalink: video.permalink,
                mediaUrl: video.media_url || video.thumbnail_url || '/assets/images/placeholder-image.jpg'
              },
            });
          } catch (creatorError) {
            // If creator info fails, still show content but with limited info
            console.error('Error fetching creator info:', creatorError);
            setContentData({
              account: 'Instagram',
              contentType: parsedUrl.type,
              datePosted: video.timestamp ? format(new Date(video.timestamp), 'dd/MM/yy') : 'Not available',
              creatorName: 'Creator',
              caption: video.caption || "No caption available",
              metrics: {
                likes: video.like_count || 0,
                comments: video.comments_count || 0,
                shares: 0, // Instagram doesn't provide share counts
                views: 0, // Only use real data
                mediaType: video.media_type,
                permalink: video.permalink,
                mediaUrl: video.media_url || video.thumbnail_url || '/assets/images/placeholder-image.jpg'
              },
            });
          }
        } else {
          setContentData({
            error: "This content is not tracked in our system. Only content from connected creator accounts can be analyzed."
          });
        }
      }

      if (parsedUrl.platform === 'TikTok') {
        // First get the content details
        const response = await axiosInstance.get(
          endpoints.creators.social.tiktokContent(parsedUrl.id)
        );
        
        if (response.data?.tiktokVideo) {
          const video = response.data.tiktokVideo;
          
          // Get creator information
          try {
            const creatorInfo = await axiosInstance.get(
              endpoints.creators.social.getCreatorByTiktokContent(parsedUrl.id)
            );
            
            // Calculate interactions from actual data
            const likes = video.like_count || 0;
            const comments = video.comment_count || 0;
            const shares = video.share_count || 0;
            const interactions = video.interactions || (likes + comments + shares);
            
            setContentData({
              account: 'TikTok',
              contentType: parsedUrl.type,
              datePosted: video.create_time ? fDate(video.create_time, 'dd/MM/yy') : 'Not available',
              creatorName: creatorInfo.data?.display_name || 'Unknown Creator',
              caption: video.description || "No caption available",
              metrics: {
                likes: likes,
                comments: comments,
                shares: shares,
                views: video.view_count || 0,
                favorites: video.favorites_count || 0,
                interactions: interactions,
                mediaType: parsedUrl.type,
                permalink: video.embed_link,
                mediaUrl: video.cover_image_url || '/assets/images/placeholder-image.jpg'
              },
            });
          } catch (creatorError) {
            console.error('Error fetching creator info:', creatorError);
            
            // Calculate interactions from actual data
            const likes = video.like_count || 0;
            const comments = video.comment_count || 0;
            const shares = video.share_count || 0;
            const interactions = video.interactions || (likes + comments + shares);
            
            setContentData({
              account: 'TikTok',
              contentType: parsedUrl.type,
              datePosted: video.create_time ? fDate(video.create_time, 'dd/MM/yy') : 'Not available',
              creatorName: parsedUrl.username || 'Creator',
              caption: video.description || "No caption available",
              metrics: {
                likes: likes,
                comments: comments,
                shares: shares,
                views: video.view_count || 0,
                favorites: video.favorites_count || 0,
                interactions: interactions,
                mediaType: parsedUrl.type,
                permalink: video.embed_link,
                mediaUrl: video.cover_image_url || '/assets/images/placeholder-image.jpg'
              },
            });
          }
        } else {
          setContentData({
            error: "This content is not tracked in our system. Only content from connected creator accounts can be analyzed."
          });
        }
      }   
    } catch (error) {
      console.error('Error fetching content:', error);
      setContentData({
        error: error.message || "Failed to fetch content data. Please try again."
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback(
    debounce((inputUrl) => {
      if (inputUrl.trim() === '') {
        handleClearContent();
        return;
      }
      
      const parsedUrl = parseContentUrl(inputUrl);
      if (parsedUrl) {
        fetchContentData(parsedUrl);
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
            gap: 4
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Instrument Serif',
              fontSize: { xs: 28, md: 36 },
              color: '#0066FF',
              textAlign: 'center',
              maxWidth: 600,
              lineHeight: 1.2
            }}
          >
            Get insights and analytics into the posts of any creator!
          </Typography>

          <Box
            component="img"
            alt="empty content"
            src={'/assets/icons/components/ic_report.svg'}
            sx={{ width: 1, maxWidth: 160 }}
          />
        </Box>
      );
    }
    return null;
  };

  const renderContentSection = () => {
    if (!url || !contentData.account) {
      return null;
    }

    if (contentData.error) {
      return (
        <Typography 
          color="error" 
          sx={{ mt: 3 }}
        >
          {contentData.error}
        </Typography>
      );
    }

    return (
      <Box mt={5}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: 'Aileron, sans-serif',
            fontWeight: 600,
            fontSize: 24,
            color: '#231F20',
            mb: 1
          }}
        >
          Selected Content
        </Typography>
        
        <Grid container spacing={3}>
          {/* Left Side - Image */}
          <Grid item xs={12} md={5}>
            <Box 
              sx={{ 
                width: '100%', 
                height: 623,
                bgcolor: '#f5f5f5',
                mb: 2,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <Box
                component="img"
                src={contentData.metrics?.mediaUrl || '/assets/images/placeholder-image.jpg'}
                alt="Content Preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                onError={(e) => {
                  e.target.src = '/assets/icons/platforms/instagram.svg';
                  e.target.style.padding = '40px';
                  e.target.style.background = '#f5f5f5';
                }}
              />
            </Box>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                mt: 1, 
                fontSize: 16,
                lineHeight: 1.6,
                fontFamily: 'Aileron, sans-serif',
              }}
            >
              {contentData.caption}
            </Typography>
          </Grid>
          
          {/* Right Side - Content Info */}
          <Grid item xs={12} md={7}>
            <Grid container spacing={0}>
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    p: 3, 
                    borderRight: '1px solid #0077FF',
                    height: '100%' 
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    color="text.secondary"
                    sx={{ mb: 2, fontFamily: "'Aileron', sans-serif", fontSize: 20, fontWeight: 600, color: '#606060' }}
                  >
                    Account
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: {xs: 28, md: 36},
                      fontWeight: 400, 
                      color: '#0066FF',
                      fontFamily: 'Instrument Serif',
                    }}
                  >
                    {contentData.account}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    p: 3, 
                    borderRight: '1px solid #0077FF',
                    height: '100%' 
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    color="text.secondary"
                    sx={{ mb: 2, fontFamily: "'Aileron', sans-serif", fontSize: 20, fontWeight: 600, color: '#606060' }}
                  >
                    Content Type
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: {xs: 28, md: 36}, 
                      fontWeight: 400, 
                      color: '#0066FF',
                      fontFamily: 'Instrument Serif',
                    }}
                  >
                    {contentData.contentType}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    p: 3,
                    height: '100%' 
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    color="text.secondary"
                    sx={{ mb: 2, fontFamily: "'Aileron', sans-serif", fontSize: 20, fontWeight: 600, color: '#606060' }}
                  >
                    Date Posted
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: {xs: 28, md: 36},
                      fontWeight: 400, 
                      color: '#0066FF',
                      fontFamily: 'Instrument Serif',
                    }}
                  >
                    {contentData.datePosted}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Content Statistics */}
            <Box mt={4} p={3}>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'Aileron, sans-serif',
                  fontWeight: 600,
                  fontSize: 24,
                  color: '#231F20',
                  mb: 2
                }}
              >
                Content Statistics
              </Typography>
              
              {/* Shares */}
              <Box mb={3}>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 32,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: '#606060',
                    mb: 1
                  }}
                >
                  Shares
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{ 
                      height: 45,
                      bgcolor: '#0066FF',
                      borderRadius: 10,
                      width: contentData.metrics?.shares > 0 ? 
                        `${Math.min(Math.max((contentData.metrics?.shares || 0) / 100 * 80, 10), 85)}%` : 
                        '10%', // Minimum width for visual consistency
                      mr: 2
                    }}
                  />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Aileron, sans-serif',
                      fontSize: 20,
                      fontWeight: 500,
                    }}
                  >
                    {contentData.metrics?.shares?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Box>
              
              {/* Interactions */}
              <Box mb={3}>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 32,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: '#606060',
                    mb: 1
                  }}
                >
                  Interactions
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{ 
                      height: 45,
                      bgcolor: '#0066FF',
                      borderRadius: 10,
                      width: contentData.metrics?.interactions > 0 ? 
                        `${Math.min(Math.max((contentData.metrics?.interactions || 0) / 200 * 70, 20), 90)}%` : 
                        '20%', // Minimum width for visual consistency
                      mr: 2
                    }}
                  />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Aileron, sans-serif',
                      fontSize: 20,
                      fontWeight: 500,
                    }}
                  >
                    {contentData.metrics?.interactions?.toLocaleString() || 
                     ((contentData.metrics?.likes || 0) + 
                      (contentData.metrics?.comments || 0) + 
                      (contentData.metrics?.shares || 0)).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              
              {/* Reach */}
              <Box mb={4}>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 32,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: '#606060',
                    mb: 1
                  }}
                >
                  Reach
                </Typography>
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{ 
                      height: 45,
                      bgcolor: '#0066FF',
                      borderRadius: 10,
                      width: contentData.metrics?.views > 0 ? 
                        `${Math.min(Math.max((contentData.metrics?.views || 0) / 1000 * 60, 30), 80)}%` : 
                        '30%', // Minimum width for visual consistency
                      mr: 2
                    }}
                  />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Aileron, sans-serif',
                      fontSize: 20,
                      fontWeight: 500,
                    }}
                  >
                    {contentData.metrics?.views?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        {/* Content Engagement Section - Moved below both columns */}
        <Box mt={5}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'Aileron, sans-serif',
              fontWeight: 600,
              fontSize: 24,
              color: '#231F20',
              mb: 3
            }}
          >
            Content Engagement
          </Typography>
          
          <Grid container spacing={2}>
            {/* Views */}
            <Grid item xs={6} sm={3}>
              <Box 
                sx={{ 
                  bgcolor: '#f0f0f0',
                  borderRadius: 2,
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                  <Iconify icon="mdi:eye" color="#0066FF" width={28} height={28} />
                </Box>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 16,
                    color: '#606060',
                    mb: 0.5
                  }}
                >
                  Views
                </Typography>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#231F20',
                    textAlign: 'center'
                  }}
                >
                  {contentData.metrics?.views?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Iconify 
                    icon="mdi:arrow-up" 
                    color="#4CAF50" 
                    width={16} 
                    height={16} 
                  />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Aileron, sans-serif',
                      fontSize: 14,
                      color: '#4CAF50',
                      ml: 0.5
                    }}
                  >
                    12% from last post
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {/* Likes */}
            <Grid item xs={6} sm={3}>
              <Box 
                sx={{ 
                  bgcolor: '#f0f0f0',
                  borderRadius: 2,
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                  <Iconify icon="mdi:heart" color="#0066FF" width={28} height={28} />
                </Box>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 16,
                    color: '#606060',
                    mb: 0.5
                  }}
                >
                  Likes
                </Typography>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#231F20',
                    textAlign: 'center'
                  }}
                >
                  {contentData.metrics?.likes?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Iconify 
                    icon="mdi:arrow-down" 
                    color="#F44336" 
                    width={16} 
                    height={16} 
                  />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Aileron, sans-serif',
                      fontSize: 14,
                      color: '#F44336',
                      ml: 0.5
                    }}
                  >
                    5% from last post
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {/* Comments */}
            <Grid item xs={6} sm={3}>
              <Box 
                sx={{ 
                  bgcolor: '#f0f0f0',
                  borderRadius: 2,
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                  <Iconify icon="mdi:comment" color="#0066FF" width={28} height={28} />
                </Box>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 16,
                    color: '#606060',
                    mb: 0.5
                  }}
                >
                  Comments
                </Typography>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#231F20',
                    textAlign: 'center'
                  }}
                >
                  {contentData.metrics?.comments?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Iconify 
                    icon="mdi:arrow-up" 
                    color="#4CAF50" 
                    width={16} 
                    height={16} 
                  />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Aileron, sans-serif',
                      fontSize: 14,
                      color: '#4CAF50',
                      ml: 0.5
                    }}
                  >
                    10% from last post
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {/* Saved */}
            <Grid item xs={6} sm={3}>
              <Box 
                sx={{ 
                  bgcolor: '#f0f0f0',
                  borderRadius: 2,
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                  <Iconify icon="mdi:bookmark" color="#0066FF" width={28} height={28} />
                </Box>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 16,
                    color: '#606060',
                    mb: 0.5
                  }}
                >
                  Saved
                </Typography>
                <Typography 
                  sx={{ 
                    fontFamily: 'Aileron, sans-serif',
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#231F20',
                    textAlign: 'center'
                  }}
                >
                  {contentData.metrics?.favorites?.toLocaleString() || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Iconify 
                    icon="mdi:arrow-down" 
                    color="#F44336" 
                    width={16} 
                    height={16} 
                  />
                  <Typography 
                    sx={{ 
                      fontFamily: 'Aileron, sans-serif',
                      fontSize: 14,
                      color: '#F44336',
                      ml: 0.5
                    }}
                  >
                    11% from last post
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {/* Header Section */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        sx={{
          alignItems: { xs: 'center', md: 'flex-end' }
        }}
      >
        {/* Content Title & URL Section */}
        <Stack>
          {(contentData.account) && (
            <Button
              startIcon={<Iconify icon="ion:chevron-back" />}
              onClick={handleBack}
              sx={{
                justifyContent: 'flex-start',
                color: '#636366',
                fontFamily: 'Aileron, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#fff',
                }
              }}
            >
              Back
            </Button>
          )}
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'Aileron, sans-serif',
              fontWeight: 400,
              fontSize: { xs: 35, md: 48 },
              color: '#231F20',
            }}
          >
            {contentData.creatorName || ''}
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Aileron, sans-serif',
              fontWeight: 400,
              fontSize: { xs: 35, md: 48 },
              color: '#231F20',
            }}
            mb={1}
          >
            Content Performance Report
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Aileron, sans-serif',
              fontWeight: 400,
              fontSize: 16,
              color: '#231F20',
              mb: 1
            }}
          >
            Post Link
          </Typography>
          <TextField
            fullWidth
            placeholder="https://www.instagram.com/p/contentperformancereport/"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (e.target.value) {
                debouncedFetch(e.target.value);
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: '#fff',
                '& fieldset': {
                  borderColor: '#E0E0E0',
                },
                '&:hover fieldset': {
                  borderColor: '#1340FF',
                },
              },
            }}
          />
        </Stack>
        
        {/* Logo Section */}
        {(url && contentData.account) && (
          <Stack>
            <Box
              component="img"
              src="/logo/cultcreativelogo.svg"
              alt="Cult Creative Logo"
              draggable="false"
              sx={{
                height: { xs: 60, sm: 100, md: 135 },
                mt: { xs: 3 }
              }}
            />
          </Stack>
        )}
      </Stack>

      {/* Conditionally render either content or landing page */}
      {renderContentSection()}
      {reportLanding()}
    </Container>
  );
};

export default ReportingView;