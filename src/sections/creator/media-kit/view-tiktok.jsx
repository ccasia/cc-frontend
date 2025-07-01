import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
// import { keyframes } from '@emotion/react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Stack,
  alpha,
  Button,
  useTheme,
  Typography,
  useMediaQuery,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';
import { useSocialMediaData } from 'src/utils/store';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

// Utility function to format numbers
export const formatNumber = (num) => {
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

const TopContentGrid = ({ topContents }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const isMedium = useMediaQuery(theme.breakpoints.down('md'));

  const topThreeContents = topContents.slice(0, 3);

  // Only use real data
  const displayContents = topThreeContents;

  // Carousel layout for mobile
  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          width: '100%',
          gap: 3, // Copy Instagram gap value for consistency
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
        {displayContents.length > 0 && displayContents.map((content, index) => (
          <Box
            key={index}
            sx={{
              minWidth: 200, // Copy Instagram card sizing
              maxWidth: 240, // Copy Instagram card sizing
              flex: '0 0 auto',
              scrollSnapAlign: 'center',
              borderRadius: 0,
              overflow: 'hidden',
              boxShadow: 'none', // Remove visible box shadow
              bgcolor: 'transparent', // Make background transparent
              display: 'flex',
              flexDirection: 'column',
              mx: 0,
              height: 'auto', // Copy Instagram card styling
              minHeight: 520, // Copy Instagram minimum height
            }}
          >
            <Box
              sx={{
                position: 'relative',
                height: 420, // Copy Instagram image height for consistency
                width: '100%',
                overflow: 'hidden',
                borderRadius: 0,
              }}
            >
              <iframe
                src={content?.embed_link}
                title={`TikTok video ${index + 1}`}
                style={{ 
                  height: '100%', 
                  width: '100%', 
                  border: 'none',
                  borderRadius: '0px',
                }}
                allowFullScreen
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  color: 'white',
                  p: 2,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                }}
                className="media-kit-engagement-icons"
              >
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
            </Box>
            <Box
              sx={{
                flex: 1, // Copy Instagram caption wrapper styling
                display: 'flex',
                flexDirection: 'column',
                pt: 1.5, // Copy Instagram padding
                px: 0.5, // Copy Instagram padding
                pb: 0.5, // Copy Instagram padding
                minHeight: 0, // Copy Instagram styling
                maxHeight: 120, // Copy Instagram caption height limit
                border: 'none', // Copy Instagram styling
                boxShadow: 'none', // Copy Instagram styling
                bgcolor: 'transparent', // Copy Instagram styling
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.8rem', // Copy Instagram font size
                  color: 'text.primary',
                  fontWeight: 500, // Copy Instagram font weight
                  lineHeight: 1.4, // Copy Instagram line height
                  wordBreak: 'break-word', // Copy Instagram word break
                  overflowWrap: 'break-word', // Copy Instagram overflow wrap
                  hyphens: 'auto', // Copy Instagram hyphens
                  flex: 1, // Copy Instagram flex styling
                  display: 'flex',
                  alignItems: 'flex-start',
                  ...((content.video_description?.length || 0) > 120 ? {
                    // Copy Instagram long caption handling
                    maxHeight: 'none', // Remove height restriction
                  } : {
                    // Copy Instagram short caption handling
                    display: '-webkit-box',
                    WebkitLineClamp: 5, // Copy Instagram line clamp
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }),
                }}
              >
                {content.video_description || 'No description available'}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // Desktop layout (unchanged)
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
        overflow: 'auto'
      }}
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
      {displayContents.length > 0 && displayContents.map((content, index) => (
        <Box
          key={index}
          component={m.div}
          variants={{
            hidden: { opacity: 0, y: 50 },
            show: { opacity: 1, y: 0 },
          }}
          sx={{
            width: { xs: '100%', sm: '30%', md: 350 },
            minWidth: { xs: '280px', sm: '250px', md: '320px' },
            maxWidth: { xs: '100%', sm: '350px' },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              height: { xs: 480, sm: 550, md: 650 },
              width: '100%',
              overflow: 'hidden',
              borderRadius: 0,
              cursor: 'pointer',
            }}
          >
            <iframe
              src={content?.embed_link}
              title={`TikTok video ${index + 1}`}
              style={{ 
                height: '100%', 
                width: '100%', 
                border: 'none',
                borderRadius: '0px',
              }}
              allowFullScreen
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
                borderRadius: '0 0 0px 0px',
                pointerEvents: 'none', // Allow clicks to pass through to iframe
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
              }}
              className="media-kit-engagement-icons"
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="material-symbols:favorite-outline" width={20} />
                  <Typography variant="subtitle2">{formatNumber(content?.like)}</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="iconamoon:comment" width={20} />
                  <Typography variant="subtitle2">
                    {formatNumber(content?.comment)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
          
          <Box
            sx={{
              mt: 1,
              maxHeight: isMobile ? 120 : 50, // Much shorter caption area for desktop - more rectangular
              overflow: 'hidden',
              border: 'none', // Remove any borders
              boxShadow: 'none', // Remove any shadows
              bgcolor: 'transparent', // Make background transparent
            }}
          >
            <Typography
              variant="body2"
              className="media-kit-caption"
              sx={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'text.primary',
                width: '100%',
                maxWidth: '100%',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                ...(() => {
                  const length = content?.video_description?.length || 0;
                  const isLongCaption = length > 120;
                  
                  if (isLongCaption) {
                    // For longer captions, limit lines for desktop
                    return {
                      display: '-webkit-box',
                      WebkitLineClamp: isMobile ? 4 : 2, // Even fewer lines for desktop
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    };
                  } else {
                    // For shorter captions, use line clamp
                    return {
                      display: '-webkit-box',
                      WebkitLineClamp: isMobile ? 3 : 2, // Fewer lines for desktop
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    };
                  }
                })(),
              }}
            >
              {content?.video_description}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

TopContentGrid.propTypes = {
  topContents: PropTypes.arrayOf(
    PropTypes.shape({
      embed_link: PropTypes.string,
      video_description: PropTypes.string,
      like: PropTypes.number,
      comment: PropTypes.number,
    })
  ),
};

TopContentGrid.defaultProps = {
  topContents: [],
};

const MediaKitSocialContent = ({ tiktok, forceDesktop = false }) => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) && !forceDesktop;

  const tiktokData = useSocialMediaData((state) => state.tiktok);

  // Get the real data from store
  const realTopContent = tiktokData?.creator?.tiktokUser?.sortedVideos;
  // Check if we have real content
  const hasContent = Array.isArray(realTopContent) && realTopContent.length > 0;
  const isConnected = !!user?.creator?.isTiktokConnected;

  const connectTiktok = async () => {
    try {
      const { data: url } = await axiosInstance.get('/api/social/oauth/tiktok');
      enqueueSnackbar('Redirecting...');
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  };

  // Show connect TikTok prompt if not connected
  if (!isConnected) {
    // Show connect TikTok prompt
    return (
      <Box
        component={m.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        sx={{
          height: { xs: 450, sm: 500, md: 550 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          borderRadius: 2,
          mb: 4,
          bgcolor: alpha(theme.palette.background.neutral, 0.4),
          border: `1px dashed ${alpha(theme.palette.divider, 0.8)}`,
          boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Stack spacing={3} alignItems="center" sx={{ maxWidth: 320, textAlign: 'center', p: 3 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 0,
              bgcolor: '#FFFFFF',
              boxShadow: '0px 0px 15px 0px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="logos:tiktok-icon" width={42} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Connect TikTok
          </Typography>

          <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Connect your TikTok account to showcase your top content and analytics in your media kit.
          </Typography>

          <Button
            variant="contained"
            size="large"
            sx={{
              borderRadius: 1.5,
              px: 3,
              py: 1.5,
              mt: 2,
              backgroundColor: '#000000',
              color: '#FFFFFF',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: '#222222',
                boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
              },
            }}
            startIcon={<Iconify icon="mingcute:link-line" width={22} />}
            onClick={connectTiktok}
          >
            Connect TikTok
          </Button>
        </Stack>
      </Box>
    );
  }

  // Use real content if available
  const contentToShow = hasContent ? realTopContent : [];

  // Carousel for mobile, grid for desktop
  return (
    <Box>
      {isMobile ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            px: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            id="tiktok-mobile-connected"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              width: '100%',
              gap: 2, // Match Instagram wrapper container gap
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
            <TopContentGrid topContents={contentToShow} mobileCarousel />
          </Box>
        </Box>
      ) : (
        <TopContentGrid topContents={contentToShow} />
      )}
    </Box>
  );
};

export default MediaKitSocialContent;

MediaKitSocialContent.propTypes = {
  tiktok: PropTypes.object,
  forceDesktop: PropTypes.bool,
};
