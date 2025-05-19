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
import { useState, useCallback } from 'react';
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
      if (urlObj.hostname.includes('instagram.com')) {
        // For Instagram URLs
        let contentId = '';
        let type = 'Post';
        
        if (urlObj.pathname.includes('/reel/')) {
          type = 'Reel';
          contentId = urlObj.pathname.split('/reel/')[1].split('/')[0];
        } else if (urlObj.pathname.includes('/p/')) {
          type = 'Post';
          contentId = urlObj.pathname.split('/p/')[1].split('/')[0];
        } else {
          return null; // Unrecognized Instagram URL format
        }
        
        return {
          platform: 'Instagram',
          type,
          id: contentId,
        };
      }
      if (urlObj.hostname.includes('tiktok.com')) {
        return {
          platform: 'TikTok',
          type: 'Video',
          id: urlObj.pathname.split('/video/')[1]?.split('?')[0],
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
    const parsedUrl = parseContentUrl(inputUrl);
    if (parsedUrl) {
      fetchContentData(parsedUrl);
    }
  }, 500),
  [fetchContentData]
);

  const handleBack = () => {
    setUrl('');
    setContentData({
      account: '',
      contentType: '',
      datePosted: '',
      creatorName: '',
    });
  };

  const page = () => {
    if (!url || (!contentData.account && !contentData.error)) {
      return (<Typography>This is a CPR</Typography>)
    }
    return null
  }

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

      {/* Selected Content Section - Matching the image */}
      {!contentData.error && contentData.account ? (
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
                  height: 580,
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
              <Box mt={4}>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={6}>
                    <Box 
                      sx={{ 
                        p: 3, 
                        bgcolor: '#f8f9fa',
                        borderRadius: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        color="text.secondary"
                        sx={{ mb: 1, fontSize: 18 }}
                      >
                        Likes
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#0D47A1'
                        }}
                      >
                        {contentData.metrics?.likes?.toLocaleString() || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={6}>
                    <Box 
                      sx={{ 
                        p: 3, 
                        bgcolor: '#f8f9fa',
                        borderRadius: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        color="text.secondary"
                        sx={{ mb: 1, fontSize: 18 }}
                      >
                        Comments
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#0D47A1'
                        }}
                      >
                        {contentData.metrics?.comments?.toLocaleString() || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ) : (
        contentData.error && (
          <Typography 
            color="error" 
            sx={{ mt: 3 }}
          >
            {contentData.error}
          </Typography>
        )
      )}

      {page()}
    </Container>
  );
};

export default ReportingView;