import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
// import { keyframes } from '@emotion/react';

import { Box, Grid, Stack, alpha, useTheme, Typography, useMediaQuery } from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

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

// const typeAnimation = keyframes`
//   from { width: 0; }
//   to { width: 100%; }
// `;

const TopContentGrid = ({ topContents, tiktokUsername }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Sort by like_count in descending order and take top 3
  const topThreeContents = topContents
    ?.sort((a, b) => (b?.like_count || 0) - (a?.like_count || 0))
    .slice(0, 3);

  // Helper function to construct TikTok URL
  const getTikTokVideoUrl = (content) => {
    // Try to construct URL from username and video_id
    if (tiktokUsername && content?.video_id) {
      return `https://www.tiktok.com/@${tiktokUsername}/video/${content.video_id}`;
    }
    
    // Fallback: try to extract from embed_link
    if (content?.embed_link) {
      const videoIdMatch = content.embed_link.match(/\/v1\/(\d+)/);
      if (videoIdMatch && videoIdMatch[1] && tiktokUsername) {
        return `https://www.tiktok.com/@${tiktokUsername}/video/${videoIdMatch[1]}`;
      }
    }
    
    return null;
  };

  return (
    <Grid
      container
      spacing={isMobile ? 1 : 2}
      component={m.div}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.2, // Delay between each child
          },
        },
      }}
      animate="show"
      initial="hidden"
    >
      {topThreeContents.map((content, index) => (
        <Grid
          item
          xs={12}
          md={4}
          sm={6}
          key={index}
          component={m.div}
          variants={{
            hidden: { opacity: 0, y: 50 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              height: 600,
              overflow: 'hidden',
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover .image': {
                scale: 1.05,
              },
            }}
            onClick={() => {
              const videoUrl = getTikTokVideoUrl(content);
              if (videoUrl) {
                window.open(videoUrl, '_blank');
              }
            }}
          >
            <Box
              component="img"
              className="image"
              src={content?.cover_image_url}
              alt={content?.title || `TikTok video ${index + 1}`}
              sx={{
                height: 1,
                width: '100%',
                transition: 'all .2s linear',
                objectFit: 'cover',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                color: 'white',
                p: isMobile ? 2 : 2,
                px: 3,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  mb: 1,
                }}
              >
                {content?.description?.slice(0, 100) || content?.title || 'TikTok Video'}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="material-symbols:favorite-outline" width={20} />
                  <Typography variant="subtitle2">{formatNumber(content?.like_count)}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="iconamoon:comment" width={20} />
                  <Typography variant="subtitle2">{formatNumber(content?.comment_count)}</Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
          {/* <Box
            sx={{
              position: 'relative',
              height: 600,
              overflow: 'hidden',
              borderRadius: 3,
              cursor: 'pointer',
              '&:hover .image': {
                scale: 1.05,
              },
            }}
          >
            <CardMedia
              component="Box"
              className="image"
              alt={`Top content ${index + 1}`}
              sx={{
                height: 1,
                transition: 'all .2s linear',
                objectFit: 'cover',
                background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45%, rgba(0, 0, 0, 0.70) 80%), url(${content?.cover_image_url}) lightgray 50% / cover no-repeat`,
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                color: 'white',
                p: isMobile ? 2 : 1.5,
                px: 3,
                borderRadius: '0 0 24px 24px',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                  animation: `${typeAnimation} 0.5s steps(40, end)`,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  mb: 1,
                }}
              >
                {`${content?.video_description?.slice(0, 50)}...`}
              </Typography>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="material-symbols:favorite-outline" width={20} />
                  <Typography variant="subtitle2">{formatNumber(content?.like)}</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="iconamoon:comment" width={20} />
                  <Typography variant="subtitle2">{formatNumber(content?.comment)}</Typography>
                </Stack>
              </Stack>
            </Box>
          </Box> */}
        </Grid>
      ))}
    </Grid>
  );
};

TopContentGrid.propTypes = {
  topContents: PropTypes.arrayOf(
    PropTypes.shape({
      video_id: PropTypes.string,
      cover_image_url: PropTypes.string,
    })
  ).isRequired,
  tiktokUsername: PropTypes.string,
};

const MediaKitSocialContent = ({ tiktokVideos, tiktokUsername, forceDesktop = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) && !forceDesktop;

  if (!tiktokVideos?.length)
    return (
      <Label
        color="info"
        sx={{
          height: 250,
          textAlign: 'center',
          borderStyle: 'dashed',
          borderColor: theme.palette.divider,
          borderWidth: 1.5,
          bgcolor: alpha(theme.palette.warning.main, 0.16),
          width: 1,
        }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="subtitle2">TikTok account is not connected.</Typography>
        </Stack>
      </Label>
    );

  return (
    <Box width={1}>
      <TopContentGrid topContents={tiktokVideos} tiktokUsername={tiktokUsername} />
    </Box>
  );
};

export default MediaKitSocialContent;

MediaKitSocialContent.propTypes = {
  tiktokVideos: PropTypes.array,
  tiktokUsername: PropTypes.string,
  forceDesktop: PropTypes.bool,
};
