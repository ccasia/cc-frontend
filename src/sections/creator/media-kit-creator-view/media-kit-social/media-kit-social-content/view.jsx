import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';
import axiosInstance, { endpoints } from 'src/utils/axios';

const MediaKitSocialContent = () => {
  const [socialMediaData, setSocialMediaData] = useState(null);
  const [creatorData, setCreatorData] = useState(null);
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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="subtitle2">Engagement Rate</Typography>
          <Typography variant="h3">{(socialMediaData.instagram.engagement_rate * 100).toFixed(2)} %</Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="subtitle2">Followers</Typography>
          <Typography variant="h3">{socialMediaData.instagram.followers}</Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="subtitle2">Average Likes</Typography>
          <Typography variant="h3">{socialMediaData.instagram.user_performance.avg_likes_per_post}</Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default MediaKitSocialContent;