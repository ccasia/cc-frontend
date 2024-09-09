import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, CircularProgress, CardMedia, Stack, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import axiosInstance, { endpoints } from 'src/utils/axios';

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

const TopContentGrid = ({ topContents }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={1}>
      {topContents.map((content, index) => (
        <Grid item xs={4} key={index}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              image={content.image_url}
              alt={`Top content ${index + 1}`}
              sx={{
                aspectRatio: '1 / 1',
                objectFit: 'cover',
                borderRadius: 1,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                p: 1,
              }}
            >
              <Stack direction="row" justifyContent="space-around">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Icon icon="mdi:heart" width={theme.spacing(3.5)} height={theme.spacing(3.5)} />
                  <Typography variant="caption" sx={{ fontSize: theme.typography.pxToRem(20) }}>
                    {formatNumber(content.like)}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Icon icon="mdi:comment" width={theme.spacing(3.5)} height={theme.spacing(3.5)} />
                  <Typography variant="caption" sx={{ fontSize: theme.typography.pxToRem(20) }}>
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

  const { instagram } = socialMediaData;

  return (
    <Box>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2">Followers</Typography>
            <Typography variant="h2">{formatNumber(instagram.followers)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2">Engagement Rate</Typography>
            <Typography variant="h2">{(instagram.engagement_rate * 100).toFixed(1)} %</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2">Average Likes</Typography>
            <Typography variant="h2">
              {instagram.user_performance?.avg_likes_per_post
                ? formatNumber(instagram.user_performance.avg_likes_per_post)
                : 'N/A'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Typography variant="h6" mb={2}>Top Content</Typography>
      <TopContentGrid topContents={instagram.top_contents || []} />
    </Box>
  );
};

export default MediaKitSocialContent;