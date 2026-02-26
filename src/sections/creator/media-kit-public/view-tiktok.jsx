import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
// import { keyframes } from '@emotion/react';

import { Box, Stack, alpha, useTheme, Typography, useMediaQuery } from '@mui/material';

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

  const topThreeContents = [...(topContents || [])]
    .sort((a, b) => (b?.like_count || 0) - (a?.like_count || 0))
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

  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          width: '100%',
          gap: 0.5,
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { height: 0, display: 'none' },
          pb: 2,
          scrollSnapType: 'x mandatory',
          px: 0,
          pt: 1,
        }}
      >
        {topThreeContents.map((content, index) => (
          <Box
            key={index}
            sx={{
              minWidth: 200,
              maxWidth: 240,
              flex: '0 0 auto',
              scrollSnapAlign: 'center',
              borderRadius: 0,
              overflow: 'hidden',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              mx: 0,
            }}
            onClick={() => {
              const videoUrl = getTikTokVideoUrl(content);
              if (videoUrl) {
                window.open(videoUrl, '_blank');
              }
            }}
          >
            <Box
              component="div"
              sx={{
                position: 'relative',
                height: 400,
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <Box
                component="img"
                className="image"
                src={content?.cover_image_url}
                alt={content?.title || `TikTok video ${index + 1}`}
                sx={{
                  height: '100%',
                  width: '100%',
                  transition: 'all .3s ease',
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
                  p: 2,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                }}
              >
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

            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.8rem',
                mt: 2,
                mx: 2,
                mb: 2,
                color: 'text.primary',
                fontWeight: 500,
                width: '100%',
                maxWidth: '100%',
                lineHeight: 1.5,
              }}
            >
              {`${(content?.description || content?.title || 'TikTok Video').slice(0, 100)}...`}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        flexWrap: { xs: 'nowrap', md: 'nowrap' },
        width: '100%',
        gap: { xs: 2, md: 4 },
        justifyContent: { xs: 'center', sm: 'flex-start' },
        alignItems: { xs: 'center', sm: 'flex-start' },
        overflow: 'auto',
      }}
      component={m.div}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.2,
          },
        },
      }}
      animate="show"
      initial="hidden"
    >
      {topThreeContents.map((content, index) => (
        <Box
          key={index}
          component={m.div}
          variants={{
            hidden: { opacity: 0, y: 50 },
            show: { opacity: 1, y: 0 },
          }}
          onClick={() => {
            const videoUrl = getTikTokVideoUrl(content);
            if (videoUrl) {
              window.open(videoUrl, '_blank');
            }
          }}
          sx={{
            width: { xs: '100%', sm: '30%', md: 350 },
            minWidth: { xs: '280px', sm: '250px', md: '320px' },
            maxWidth: { xs: '100%', sm: '350px' },
          }}
        >
          <Box
            component="div"
            sx={{
              position: 'relative',
              height: { xs: 400, sm: 450, md: 550 },
              width: '100%',
              overflow: 'hidden',
              borderRadius: 3,
              cursor: 'pointer',
              '&:hover .image': {
                scale: 1.05,
              },
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
                p: isMobile ? 2 : 1.5,
                px: 2,
                mb: 1,
                borderRadius: '0 0 24px 24px',
              }}
              className="media-kit-engagement-icons"
            >
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

          <Typography
            variant="body2"
            className="media-kit-caption"
            sx={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              mt: 1,
              color: 'text.primary',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            {`${(content?.description || content?.title || 'TikTok Video').slice(0, 80)}...`}
          </Typography>
        </Box>
      ))}
    </Box>
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

const MediaKitSocialContent = ({ tiktokVideos, tiktokUsername, isLoading = false, forceDesktop = false }) => {
  const theme = useTheme();

  if (isLoading)
    return (
      <Label
        color="info"
        sx={{
          height: 250,
          textAlign: 'center',
          borderStyle: 'dashed',
          borderColor: theme.palette.divider,
          borderWidth: 1.5,
          bgcolor: alpha(theme.palette.info.main, 0.08),
          width: 1,
        }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="subtitle2">Loading TikTok content...</Typography>
        </Stack>
      </Label>
    );

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
  isLoading: PropTypes.bool,
  forceDesktop: PropTypes.bool,
};
