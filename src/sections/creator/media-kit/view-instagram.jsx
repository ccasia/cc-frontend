import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Stack, CardMedia, Typography } from '@mui/material';

import { useMediaKitResponsive } from 'src/hooks/use-media-kit-responsive';

import { useSocialMediaData } from 'src/utils/store';
import { getCaptionStyles } from 'src/utils/media-kit-utils';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import InstagramOAuthWarning from 'src/components/instagram-oauth-warning';
import ChartContainer from 'src/components/media-kit/ChartContainer';
import EngagementRateChart from 'src/components/media-kit/EngagementRateChart';
import MonthlyInteractionsChart from 'src/components/media-kit/MonthlyInteractionsChart';
import PlatformConnectionPrompt from 'src/components/media-kit/PlatformConnectionPrompt';

// Utility function to format numbers
export const formatNumber = (num) => {
  if (!num && num !== 0) return '0';

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

const TopContentGrid = ({ topContents, mobileCarousel }) => {
  const { isMobile, theme } = useMediaKitResponsive();

  const topThreeContents = (topContents || [])
    .sort((a, b) => a?.like_count > b?.like_count)
    .slice(0, 3);

  // Carousel layout for mobile
  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          width: '100%',
          gap: 3, // Increased gap between cards in mobile carousel
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
              boxShadow: 'none', // Remove visible box shadow
              bgcolor: 'transparent', // Make background transparent
              display: 'flex',
              flexDirection: 'column',
              mx: 0,
              height: 'auto', // Allow card to expand based on content
              minHeight: 520, // Minimum height to accommodate image + caption
            }}
            onClick={() => {
              const a = document.createElement('a');
              a.href = content?.permalink;
              a.target = '_blank';
              a.click();
            }}
          >
            <Box
              component="div"
              sx={{
                position: 'relative',
                height: 420, // Larger image height, smaller caption space
                width: '100%',
                overflow: 'hidden',
                flexShrink: 0, // Prevent image from shrinking
              }}
            >
              <CardMedia
                component="div"
                className="image"
                alt={`Top content ${index + 1}`}
                sx={{
                  height: '100%',
                  width: '100%',
                  transition: 'all .3s ease',
                  objectFit: 'cover',
                  background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45%, rgba(0, 0, 0, 0.70) 80%), url(${content?.media_type === 'VIDEO' ? content?.thumbnail_url : content?.media_url}) center/cover no-repeat`,
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
                    <Typography variant="subtitle2">
                      {formatNumber(content?.comments_count)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1, // Take remaining space in the card
                display: 'flex',
                flexDirection: 'column',
                pt: 1.5,
                px: 0.5, // Reduced left/right padding to move caption more to the left
                pb: 0.5, // Reduced bottom padding to bring bottom line closer
                minHeight: 0, // Allow content to shrink if needed
                maxHeight: 120, // Limit caption area height
                border: 'none', // Remove any borders
                boxShadow: 'none', // Remove any shadows
                bgcolor: 'transparent', // Make background transparent
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.8rem',
                  color: 'text.primary',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  flex: 1, // Take available space
                  display: 'flex',
                  alignItems: 'flex-start',
                  ...(content.caption?.length > 120
                    ? {
                        // For longer captions, allow more space
                        maxHeight: 'none', // Remove height restriction
                      }
                    : getCaptionStyles(content.caption?.length || 0, true)),
                }}
              >
                {content.caption}
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
        overflow: 'auto',
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
      {topThreeContents.map((content, index) => (
        <Box
          key={index}
          component={m.div}
          variants={{
            hidden: { opacity: 0, y: 50 },
            show: { opacity: 1, y: 0 },
          }}
          onClick={() => {
            const a = document.createElement('a');
            a.href = content?.permalink;
            a.target = '_blank';
            a.click();
          }}
          sx={{
            width: { xs: '100%', sm: '30%', md: 350 },
            minWidth: { xs: '280px', sm: '250px', md: '320px' },
            maxWidth: { xs: '100%', sm: '350px' },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            overflow: 'hidden',
            boxShadow: 'none', // Remove visible box shadow
            bgcolor: 'transparent', // Make background transparent
            height: 'auto', // Allow card to expand
            minHeight: { xs: 580, sm: 600, md: 650 }, // Reduced minimum height for desktop
          }}
        >
          <Box
            component="div"
            sx={{
              position: 'relative',
              height: { xs: 420, sm: 500, md: 580 }, // Larger heights for more prominent media content
              width: '100%',
              overflow: 'hidden',
              cursor: 'pointer',
              flexShrink: 0, // Prevent image from shrinking
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
                background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45%, rgba(0, 0, 0, 0.70) 80%), url(${content?.media_type === 'VIDEO' ? content?.thumbnail_url : content?.media_url}) lightgray 50% / cover no-repeat`,
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
                  <Typography variant="subtitle2">
                    {formatNumber(content?.comments_count)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 0, // Don't take remaining space, only what's needed
              display: 'flex',
              flexDirection: 'column',
              pt: 1,
              px: 0.5, // Reduced left/right padding to move caption more to the left
              pb: 0.5, // Reduced bottom padding to bring bottom line closer
              minHeight: 'auto', // Let content determine height
              maxHeight: 60, // Much shorter caption area for desktop - more rectangular
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
                lineHeight: 1.4,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                flex: 1, // Take available space
                ...getCaptionStyles(content?.caption?.length || 0, isMobile),
              }}
            >
              {content?.caption}
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
      image_url: PropTypes.string.isRequired,
    })
  ).isRequired,
  mobileCarousel: PropTypes.bool,
};

const MediaKitSocialContent = ({ instagram, forceDesktop = false }) => {
  const { user } = useAuthContext();
  const instagramData = useSocialMediaData((state) => state.instagram);
  const { isMobile, isTablet, theme } = useMediaKitResponsive(forceDesktop);

  // State for Instagram OAuth warning modal
  const [showOAuthWarning, setShowOAuthWarning] = useState(false);

  // IMPORTANT: Always use store data for consistency across all screen sizes
  // This ensures analytics data is available for both mobile and desktop views
  const dataSource = instagramData || instagram || {};

  // Get the real data from store (prioritize store data over props)
  const realTopContent = dataSource?.medias?.sortedVideos;

  // Check if we have real content
  const isConnected = !!user?.creator?.isFacebookConnected;

  // Use real content only
  const contentToShow = realTopContent;

  // Show connect Instagram prompt if not connected
  if (!isConnected) {
    return (
      <>
        <PlatformConnectionPrompt
          platform="Instagram"
          onConnect={() => setShowOAuthWarning(true)}
        />
        {/* Instagram OAuth Warning Modal */}
        {showOAuthWarning && (
          <InstagramOAuthWarning
            redirectUrl="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=945958120199185&redirect_uri=https://app.cultcreativeasia.com/api/social/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights"
            onCancel={() => setShowOAuthWarning(false)}
            autoRedirect={false}
            redirectDelay={3}
          />
        )}
      </>
    );
  }

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
            id="instagram-mobile-connected"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              width: '100%',
              gap: 2, // Increased gap between cards in mobile carousel
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

      {/* Analytics Boxes */}
      {isMobile ? (
        // Mobile/Tablet Carousel Layout
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            px: 0,
            overflow: 'hidden',
            mt: 0.5, // Gap between content and charts
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              width: '100%',
              gap: isTablet ? 3 : 2, // Larger gap for tablet
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
            {/* Engagement Rate Chart */}
            <ChartContainer title="Engagement Rate">
              <EngagementRateChart dataSource={dataSource} platform="instagram" />
            </ChartContainer>

            {/* Monthly Interactions Chart */}
            <ChartContainer title="Monthly Interactions">
              <MonthlyInteractionsChart dataSource={dataSource} />
            </ChartContainer>
          </Box>
        </Box>
      ) : (
        // Desktop Layout
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            width: '100%',
            gap: 4,
            mt: 4,
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          }}
        >
          {/* Engagement Rate Chart */}
          <ChartContainer title="Engagement Rate">
            <EngagementRateChart dataSource={dataSource} platform="instagram" />
          </ChartContainer>

          {/* Monthly Interactions Chart */}
          <ChartContainer title="Monthly Interactions">
            <MonthlyInteractionsChart dataSource={dataSource} />
          </ChartContainer>
        </Box>
      )}
    </Box>
  );
};

export default MediaKitSocialContent;

MediaKitSocialContent.propTypes = {
  instagram: PropTypes.object,
  forceDesktop: PropTypes.bool,
};
