import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, CircularProgress, CardMedia, Stack, useTheme, useMediaQuery } from '@mui/material';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { keyframes } from '@emotion/react';

// Utility function to format numbers
const formatNumber = (num) => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}G`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const typeAnimation = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

const TopContentGrid = ({ topContents }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const topFiveContents = topContents.slice(0, 5);

  return (
    <Grid container spacing={isMobile ? 1 : 2}>
      {topFiveContents.map((content, index) => (
        <Grid item xs={12} sm={4} key={index}>
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1,
              '&:hover .image': {
                opacity: 0,
              },
              '&:hover .description': {
                opacity: 1,
              },
            }}
          >
            <CardMedia
              component="img"
              image={content.image_url}
              alt={`Top content ${index + 1}`}
              sx={{
                aspectRatio: '1 / 1',
                objectFit: 'cover',
                transition: 'opacity 0.3s ease-in-out',
              }}
              className="image"
            />
            <Box
              className="description"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                p: isMobile ? 1 : 2,
                opacity: 0,
                transition: 'opacity 0.3s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'justify',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                  animation: `${typeAnimation} 0.5s steps(40, end)`,
                }}
              >
                {content.description}
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                p: isMobile ? 0.5 : 1,
              }}
            >
              <Stack direction="row" justifyContent="space-around">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Icon icon="mdi:heart" width={isMobile ? 16 : 24} height={isMobile ? 16 : 24} />
                  <Typography variant="caption" sx={{ fontSize: isMobile ? 16 : 14 }}>
                    {formatNumber(content.like)}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Icon icon="mdi:comment" width={isMobile ? 16 : 24} height={isMobile ? 16 : 24} />
                  <Typography variant="caption" sx={{ fontSize: isMobile ? 16 : 14 }}>
                    {formatNumber(content.comment)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

TopContentGrid.propTypes = {
  topContents: PropTypes.arrayOf(
    PropTypes.shape({
      image_url: PropTypes.string.isRequired,
    })
  ).isRequired,
};

const MediaKitSocialContent = () => {
  const [socialMediaData, setSocialMediaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchSocialMediaData = async () => {
      try {
        const response = await axiosInstance.get(endpoints.creators.getCreatorCrawlerResult);
        setSocialMediaData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSocialMediaData();
  }, []);

  // useEffect(() => {
  //   const fetchCreatorData = async () => {
  //     try {
  //       // First, we need to get the creator's Instagram username
  //       const creatorResponse = await axiosInstance.get(endpoints.auth.getCurrentUser);
  //       console.log(creatorResponse);
  //       const instagramUsername = creatorResponse.data.user.creator.instagram;
  //       console.log(instagramUsername);

  //       // Now we can make the request to the crawler API
  //       const response = await axiosInstance.post(endpoints.creators.getCreatorCrawler, {
  //         identifier: 'cristiano',
  //         platform: 'Instagram'
  //       });

  //       console.log(response);

  //       setCreatorData(response.data);
  //       setLoading(false);
  //     } catch (err) {
  //       setError(err.message);
  //       setLoading(false);
  //     }
  //   };

  //   fetchCreatorData();
  // }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!socialMediaData || !socialMediaData.tiktok) {
    return <Typography>No Instagram data available.</Typography>;
  }

  const { tiktok } = socialMediaData;

  return (
    <Box>
      <Grid container spacing={isMobile ? 1 : 2} mb={isMobile ? 2 : 4}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: isMobile ? 1 : 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontSize: isMobile ? 12 : 14 }}>Followers</Typography>
            <Typography variant="h2" sx={{ fontSize: isMobile ? 40 : 20 }}>{formatNumber(tiktok.followers)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: isMobile ? 1 : 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontSize: isMobile ? 12 : 14 }}>Engagement Rate</Typography>
            <Typography variant="h2" sx={{ fontSize: isMobile ? 40 : 20 }}>
              {Number(tiktok.engagement_rate).toFixed(2)}%
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: isMobile ? 1 : 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontSize: isMobile ? 12 : 14 }}>Average Likes</Typography>
            <Typography variant="h2" sx={{ fontSize: isMobile ? 40 : 20 }}>
              {tiktok.user_performance?.avg_likes_per_post
                ? formatNumber(tiktok.user_performance.avg_likes_per_post)
                : 'N/A'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Typography variant="h6" mb={isMobile ? 1 : 2} sx={{ fontSize: isMobile ? 18 : 20 }}>Top Content</Typography>
      <TopContentGrid topContents={tiktok.top_contents || []} />
    </Box>
  );
};

export default MediaKitSocialContent;