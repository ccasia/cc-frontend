import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import { keyframes } from '@emotion/react';

import { Box, Grid, Stack, useTheme, CardMedia, Typography, useMediaQuery } from '@mui/material';

// Utility function to format numbers
const formatNumber = (num) => {
  if (num == null) return 'N/A';
  if (typeof num !== 'number') return 'Invalid';

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
                  fontSize: isMobile ? '0.75rem' : '0.875rem', // Smaller font size on mobile
                }}
              >
                {`${content?.description?.slice(0, 50)}...`}
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

const MediaKitSocialContent = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Safely access nested properties
  const tiktokData =
    user?.creator?.socialMediaData?.tiktok?.data ||
    user?.user?.creator?.socialMediaData?.tiktok?.data ||
    {};
  const { followers, engagement_rate, user_performance, top_contents } = tiktokData;

  return (
    <Box>
      <Grid container spacing={isMobile ? 1 : 2} mb={isMobile ? 2 : 4}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: isMobile ? 1 : 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontSize: isMobile ? 12 : 14 }}>
              Followers
            </Typography>
            <Typography variant="h2" sx={{ fontSize: isMobile ? 40 : 20 }}>
              {followers ? formatNumber(followers) : 'N/A'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: isMobile ? 1 : 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontSize: isMobile ? 12 : 14 }}>
              Engagement Rate
            </Typography>
            <Typography variant="h2" sx={{ fontSize: isMobile ? 40 : 20 }}>
              {engagement_rate ? `${Number(engagement_rate).toFixed(2)}%` : 'N/A'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: isMobile ? 1 : 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontSize: isMobile ? 12 : 14 }}>
              {/* Average Likes */}
            </Typography>
            <Typography variant="h2" sx={{ fontSize: isMobile ? 40 : 20 }}>
              {user_performance?.avg_likes_per_post
                ? formatNumber(user_performance?.avg_likes_per_post)
                : 'N/A'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Typography variant="h6" mb={isMobile ? 1 : 2} sx={{ fontSize: isMobile ? 18 : 20 }}>
        Top Content
      </Typography>
      {(() => {
        const topContents = top_contents;

        if (topContents && topContents.length > 0) {
          return <TopContentGrid topContents={topContents} />;
        }
        return <Typography>No top content data available</Typography>;
      })()}
    </Box>
  );
};

export default MediaKitSocialContent;

MediaKitSocialContent.propTypes = {
  user: PropTypes.object,
};
