import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
// import { keyframes } from '@emotion/react';

import { LineChart } from '@mui/x-charts/LineChart';
import {
  Box,
  Stack,
  alpha,
  Button,
  useTheme,
  CardMedia,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { useSocialMediaData } from 'src/utils/store';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

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

// const typeAnimation = keyframes`
//   from { width: 0; }
//   to { width: 100%; }
// `;

const TopContentGrid = ({ topContents, mobileCarousel }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const isMedium = useMediaQuery(theme.breakpoints.down('md'));

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
                    : {
                        // For shorter captions, use line clamp
                        display: '-webkit-box',
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }),
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
              borderRadius: 3,
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
                ...(() => {
                  const length = content?.caption?.length || 0;
                  const isLongCaption = length > 120;

                  if (isLongCaption) {
                    // For longer captions, limit lines for desktop
                    return {
                      display: '-webkit-box',
                      WebkitLineClamp: isMobile ? 4 : 2, // Even fewer lines for desktop
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    };
                  }
                  // For shorter captions, use line clamp
                  return {
                    display: '-webkit-box',
                    WebkitLineClamp: isMobile ? 3 : 2, // Fewer lines for desktop
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  };
                })(),
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
  const theme = useTheme();
  const smDown = useResponsive('down', 'sm');
  const mdDown = useResponsive('down', 'md');
  const lgUp = useResponsive('up', 'lg');

  // Use carousel for mobile and tablet, desktop layout only for large screens
  const isMobile = forceDesktop ? false : !lgUp;
  const isTablet = !smDown && mdDown; // iPad size

  // IMPORTANT: Always use store data for consistency across all screen sizes
  // This ensures analytics data is available for both mobile and desktop views
  const dataSource = instagramData || instagram || {};

  // Get the real data from store (prioritize store data over props)
  const realTopContent = dataSource?.medias?.sortedVideos;

  // Check if we have real content
  const hasContent = Array.isArray(realTopContent) && realTopContent.length > 0;
  const isConnected = !!user?.creator?.isFacebookConnected;

  // Use real content only
  const contentToShow = realTopContent;

  // Show connect Instagram prompt if not connected
  if (!isConnected) {
    // Show connect Instagram prompt
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
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              boxShadow: '0px 0px 15px 0px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="skill-icons:instagram" width={42} sx={{ color: '#E1306C' }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Connect Instagram
          </Typography>

          <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Connect your Instagram to showcase your top content and analytics.
          </Typography>

          <Button
            variant="contained"
            size="large"
            sx={{
              borderRadius: 1.5,
              px: 3,
              py: 1.5,
              mt: 2,
              backgroundColor: '#E1306C',
              color: '#FFFFFF',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(225, 48, 108, 0.3)',
              '&:hover': {
                backgroundColor: '#C13584',
                boxShadow: '0 6px 15px rgba(225, 48, 108, 0.4)',
              },
            }}
            startIcon={<Iconify icon="mingcute:link-line" width={22} />}
            LinkComponent="a"
            href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=945958120199185&redirect_uri=https://app.cultcreativeasia.com/api/social/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights"
            target="_blank"
          >
            Connect Instagram
          </Button>
        </Stack>
      </Box>
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
            {contentToShow.length > 0 && (
              <TopContentGrid topContents={contentToShow} mobileCarousel />
            )}
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
            {/* Engagement Rate Box */}
            <Box
              sx={{
                backgroundColor: '#E7E7E7',
                borderRadius: 2,
                p: isTablet ? 3 : 2, // Larger padding for tablet
                minWidth: isTablet ? '350px' : '240px', // Larger for tablet
                maxWidth: isTablet ? '350px' : '240px', // Larger for tablet
                height: isTablet ? '300px' : '240px', // Larger for tablet
                position: 'relative',
                flex: '0 0 auto',
                scrollSnapAlign: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'black',
                  fontWeight: 600,
                  fontSize: isTablet ? '16px' : '14px', // Larger text for tablet
                  position: 'absolute',
                  top: isTablet ? 16 : 12,
                  left: isTablet ? 20 : 16,
                  zIndex: 2,
                }}
              >
                Engagement Rate
              </Typography>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: isTablet ? 20 : 16,
                  left: isTablet ? 20 : 16,
                  right: isTablet ? 20 : 16,
                  top: isTablet ? 50 : 40,
                }}
              >
                <LineChart
                  series={[
                    {
                      curve: 'linear',
                      data: (() => {
                        // Use real analytics data if available
                        const engagementRates = dataSource?.analytics?.engagementRates || [];
                        const months = dataSource?.analytics?.months || ['Jan', 'Feb', 'Mar'];

                        // Calculate from recent posts if no analytics data
                        if (engagementRates.length === 0) {
                          const posts = dataSource?.medias?.sortedVideos || [];
                          if (posts.length >= 3) {
                            const calculatedRates = posts.slice(0, 3).map((post) => {
                              const engagement =
                                (post.like_count || 0) +
                                (post.comments_count || 0) +
                                (post.share_count || 0) +
                                (post.saved || 0);
                              const followers = dataSource?.overview?.followers_count || 1;
                              return parseFloat(((engagement / followers) * 100).toFixed(1));
                            });
                            return calculatedRates; // Already in correct order
                          }
                          return [0, 0, 0]; // Return zeros if no data available
                        }

                        return engagementRates; // Already in ascending order from backend
                      })(),
                      color: '#1340FF',
                      valueFormatter: (value) => `${value.toFixed(2)}%`, // Show precise numbers with 2 decimal places
                    },
                  ]}
                  width={isTablet ? 310 : 208} // Larger for tablet
                  height={isTablet ? 200 : 160} // Larger for tablet
                  margin={{
                    left: 25,
                    right: 15,
                    top: 15,
                    bottom: isTablet ? 35 : 25, // More bottom margin for tablet
                  }}
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: (() => {
                        // Use real months if available
                        const analyticsMonths = dataSource?.analytics?.months || [];
                        const months =
                          analyticsMonths.length > 0 ? analyticsMonths : ['Jan', 'Feb', 'Mar'];
                        return months; // Already in ascending order from backend
                      })(),
                      hideTooltip: true,
                      tickLabelStyle: {
                        fontSize: isTablet ? 12 : 10,
                        fill: 'black',
                        fontStyle: 'italic',
                      },
                      axisLine: false,
                      tickLine: false,
                    },
                  ]}
                  yAxis={[
                    {
                      min: 0,
                      max: 3,
                      tickNumber: 4,
                      hideTooltip: true,
                      tickLabelStyle: {
                        fontSize: isTablet ? 13 : 11,
                        fill: '#333',
                        fontWeight: 500,
                      },
                      axisLine: false,
                      tickLine: false,
                    },
                  ]}
                  grid={{ horizontal: true, vertical: false }}
                  slotProps={{
                    legend: { hidden: true },
                    tooltip: {
                      trigger: 'item', // Enable tooltip on hover
                      formatter: (params) => `${params.value.toFixed(2)}%`, // Show precise numbers without rounding
                    },
                    axisHighlight: { x: 'none', y: 'none' },
                    mark: {
                      style: {
                        fill: '#1340FF',
                        stroke: '#1340FF',
                        strokeWidth: 2,
                        r: isTablet ? 6 : 5, // Slightly larger dots for better touch interaction
                        cursor: 'pointer',
                      },
                    },
                  }}
                  sx={{
                    '& .MuiChartsAxis-line': {
                      display: 'none',
                    },
                    '& .MuiChartsAxis-tick': {
                      display: 'none',
                    },
                    '& .MuiChartsGrid-line': {
                      stroke: 'black',
                      strokeWidth: 1,
                    },
                    '& .MuiChartsGrid-root .MuiChartsGrid-line': {
                      strokeDasharray: 'none',
                    },
                    '& .MuiChartsGrid-root .MuiChartsGrid-line:not(:first-child)': {
                      display: 'none',
                    },
                    '& .MuiLineElement-root': {
                      strokeWidth: 1,
                    },
                    '& .MuiMarkElement-root': {
                      fill: '#1340FF !important',
                      stroke: '#1340FF !important',
                      strokeWidth: '2px !important',
                      r: `${isTablet ? 6 : 5}px !important`,
                      cursor: 'pointer !important',
                      transition: 'all 0.2s ease-in-out !important',
                    },
                    '& .MuiMarkElement-root:hover, & .MuiMarkElement-root:active': {
                      fill: '#0F2FE6 !important',
                      stroke: '#0F2FE6 !important',
                      strokeWidth: '3px !important',
                      r: `${isTablet ? 8 : 7}px !important`,
                      transform: 'scale(1.1) !important',
                    },
                    '& .MuiChartsAxisHighlight-root': {
                      display: 'none !important',
                    },
                  }}
                />
                {/* Data labels positioned directly above dots */}
                {/* 
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {(() => {
                    // Use real analytics data if available
                    const engagementRates = dataSource?.analytics?.engagementRates || [];
                    
                    // Calculate from recent posts if no analytics data
                    if (engagementRates.length === 0) {
                      const posts = dataSource?.medias?.sortedVideos || [];
                      if (posts.length >= 3) {
                        return posts.slice(0, 3).map(post => {
                          const engagement = (post.like_count || 0) + 
                                            (post.comments_count || 0) + 
                                            (post.share_count || 0) + 
                                            (post.saved || 0);
                          const followers = dataSource?.overview?.followers_count || 1;
                          return parseFloat(((engagement / followers) * 100).toFixed(1));
                        });
                      }
                      return [0, 0, 0]; // Return zeros if no data available
                    }
                    
                    return engagementRates.map((rate, index) => {
                      // Calculate X position more precisely to match chart dots
                      const chartWidth = isTablet ? 310 : 208;
                      const leftMargin = 25;
                      const rightMargin = 15;
                      const availableWidth = chartWidth - leftMargin - rightMargin;
                      const dotXPosition = leftMargin + (index / (engagementRates.length - 1)) * availableWidth;
                      const xPositionPercent = (dotXPosition / chartWidth) * 100;
                      
                      // Calculate Y position based on the rate value and chart dimensions
                      const minRate = Math.min(...engagementRates);
                      const maxRate = Math.max(...engagementRates);
                      const yAxisMax = 5; // This matches the yAxis max value
                      const yAxisMin = 0;
                      
                      // Calculate the percentage position within the chart area
                      const normalizedRate = (rate - yAxisMin) / (yAxisMax - yAxisMin);
                      const chartHeight = isTablet ? 200 : 160; // Chart height
                      const topMargin = 15; // Chart top margin
                      const bottomMargin = isTablet ? 35 : 25; // Chart bottom margin
                      const availableHeight = chartHeight - topMargin - bottomMargin;
                      
                      // Calculate Y position more precisely to match the actual dot position
                      const dotYPosition = topMargin + (availableHeight * (1 - normalizedRate));
                      const numberYPosition = dotYPosition - 20; // Position 20px above the dot
                      
                      return (
                        <Typography
                          key={index}
                          sx={{
                            position: 'absolute',
                            left: `${xPositionPercent}%`,
                            top: `${numberYPosition}px`, // Dynamic positioning based on data value
                            transform: 'translateX(-50%)',
                            color: 'black', // Changed back to black
                            fontSize: isTablet ? 12 : 10,
                            fontWeight: 500, // Less bold
                            fontFamily: 'Aileron, sans-serif',
                            textAlign: 'center',
                            pointerEvents: 'none'
                          }}
                        >
                          {rate.toFixed(2)}%
                        </Typography>
                      );
                    });
                  })()}
                 </Box>
                 */}
              </Box>
            </Box>

            {/* Monthly Interactions Box */}
            <Box
              sx={{
                backgroundColor: '#E7E7E7',
                borderRadius: 2,
                p: isTablet ? 3 : 2, // Larger padding for tablet
                minWidth: isTablet ? '350px' : '240px', // Larger for tablet
                maxWidth: isTablet ? '350px' : '240px', // Larger for tablet
                height: isTablet ? '300px' : '240px', // Larger for tablet
                position: 'relative',
                flex: '0 0 auto',
                scrollSnapAlign: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'black',
                  fontWeight: 600,
                  fontSize: isTablet ? '16px' : '14px', // Larger text for tablet
                  position: 'absolute',
                  top: isTablet ? 16 : 12,
                  left: isTablet ? 20 : 16,
                }}
              >
                Monthly Interactions
              </Typography>

              {/* Vertical Bar Chart */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: isTablet ? 20 : 16,
                  left: isTablet ? 20 : 12,
                  right: isTablet ? 20 : 12,
                  height: isTablet ? 200 : 160, // Increased height back for mobile
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'center', // Center the bars with smaller gaps
                  gap: isTablet ? 1.5 : 1, // Smaller gap between bars
                }}
              >
                {(() => {
                  // Use real analytics data if available
                  let interactionsData;
                  if (dataSource?.analytics?.monthlyInteractions?.length > 0) {
                    interactionsData = dataSource.analytics.monthlyInteractions; // Already in ascending order from backend
                  } else {
                    // Calculate from recent posts if no analytics data
                    const posts = dataSource?.medias?.sortedVideos || [];
                    if (posts.length >= 3) {
                      const months = dataSource?.analytics?.months || ['Jan', 'Feb', 'Mar'];
                      const calculatedData = posts.slice(0, 3).map((post, index) => {
                        const interactions =
                          (post.like_count || 0) +
                          (post.comments_count || 0) +
                          (post.share_count || 0) +
                          (post.saved || 0);
                        return {
                          month: months[index],
                          interactions,
                        };
                      });
                      interactionsData = calculatedData; // Already in correct order
                    } else {
                      // Return zeros if no data available
                      const months = dataSource?.analytics?.months || ['Jan', 'Feb', 'Mar'];
                      const zeroData = months.map((month) => ({
                        month,
                        interactions: 0,
                      }));
                      interactionsData = zeroData; // Already in correct order
                    }
                  }

                  // Calculate max value for scaling
                  const maxValue = Math.max(...interactionsData.map((data) => data.interactions));
                  const maxBarHeight = isTablet ? 120 : 140; // Increased mobile height from 120 to 140

                  return interactionsData.map((data, index) => {
                    // Calculate bar height for this data point
                    const barHeight =
                      maxValue > 0 ? (data.interactions / maxValue) * maxBarHeight : 0;

                    return (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: maxBarHeight + 40, // Total container height
                          justifyContent: 'flex-end',
                          position: 'relative',
                          mx: isTablet ? 1 : 0.5, // Add horizontal margin for spacing between bars
                        }}
                      >
                        {/* Value display - positioned on top of individual bar */}
                        <Typography
                          sx={{
                            color: 'black',
                            fontSize: isTablet ? 12 : 10, // Reduced font size for mobile
                            fontWeight: 500, // Less bold
                            fontFamily: 'Aileron, sans-serif',
                            textAlign: 'center',
                            mb: 0.5,
                            position: 'absolute',
                            bottom: barHeight + 30, // Reduced from 35 to bring numbers lower
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {data.interactions}
                        </Typography>

                        {/* Bar */}
                        <Box
                          sx={{
                            width: isTablet ? 40 : 36, // Much thicker mobile bars
                            height: `${barHeight}px`,
                            background: 'linear-gradient(180deg, #1340FF 0%, #0A2FE8 100%)',
                            borderRadius: isTablet ? '20px' : '18px', // Much more curved
                            mb: 1,
                            boxShadow: '0 2px 8px rgba(19, 64, 255, 0.3)',
                            transition: 'all 0.3s ease',
                          }}
                        />

                        {/* Month label */}
                        <Typography
                          sx={{
                            color: 'black',
                            fontSize: isTablet ? 12 : 10,
                            fontStyle: 'italic',
                            fontFamily: 'Aileron, sans-serif',
                            textAlign: 'center',
                            mt: 0.5,
                          }}
                        >
                          {data.month}
                        </Typography>
                      </Box>
                    );
                  });
                })()}
              </Box>
            </Box>
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
          {/* Engagement Rate Box */}
          <Box
            sx={{
              backgroundColor: '#E7E7E7',
              borderRadius: 3,
              p: 3,
              flex: 1,
              width: 'auto',
              minWidth: '400px',
              minHeight: '311px',
              height: '311px',
              position: 'relative',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: 'black',
                fontWeight: 600,
                fontSize: '18px',
                position: 'absolute',
                top: 24,
                left: 28,
                zIndex: 2,
              }}
            >
              Engagement Rate
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                bottom: 24,
                left: 28,
                right: 28,
                top: 60,
              }}
            >
              <LineChart
                series={[
                  {
                    curve: 'linear',
                    data: (() => {
                      // Use real analytics data if available
                      const engagementRates = dataSource?.analytics?.engagementRates || []; // Remove rounding here

                      // Calculate from recent posts if no analytics data
                      if (engagementRates.length === 0) {
                        const posts = dataSource?.medias?.sortedVideos || [];
                        if (posts.length >= 3) {
                          const calculatedRates = posts.slice(0, 3).map((post) => {
                            const engagement =
                              (post.like_count || 0) +
                              (post.comments_count || 0) +
                              (post.share_count || 0) +
                              (post.saved || 0);
                            const followers = dataSource?.overview?.followers_count || 1;
                            return parseFloat(((engagement / followers) * 100).toFixed(2)); // Use 2 decimal places for calculated values
                          });
                          return calculatedRates; // Already in correct order
                        }
                        return [0, 0, 0]; // Return zeros if no data available
                      }

                      return engagementRates; // Already in ascending order from backend
                    })(),
                    color: '#1340FF',
                    valueFormatter: (value) => `${value.toFixed(2)}%`, // Show precise numbers with 2 decimal places
                  },
                ]}
                width={450}
                height={227}
                margin={{ left: 30, right: 15, top: 30, bottom: 60 }}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: (() => {
                      // Use real months if available
                      const analyticsMonths = dataSource?.analytics?.months || [];
                      const months =
                        analyticsMonths.length > 0 ? analyticsMonths : ['Jan', 'Feb', 'Mar'];
                      return months; // Already in ascending order from backend
                    })(),
                    hideTooltip: true,
                    tickLabelStyle: { fontSize: 12, fill: 'black', fontStyle: 'italic' },
                    axisLine: false,
                    tickLine: false,
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 3,
                    tickNumber: 4,
                    hideTooltip: true,
                    tickLabelStyle: { fontSize: 13, fill: '#333', fontWeight: 500 }, // Made darker and bolder
                    axisLine: false,
                    tickLine: false,
                  },
                ]}
                grid={{ horizontal: true, vertical: false }}
                slotProps={{
                  legend: { hidden: true },
                  tooltip: {
                    trigger: 'item', // Enable tooltip on hover
                    formatter: (params) => `${params.value.toFixed(2)}%`, // Show precise numbers without rounding
                  },
                  axisHighlight: { x: 'none', y: 'none' },
                  mark: {
                    style: {
                      fill: '#1340FF',
                      stroke: '#1340FF',
                      strokeWidth: 2,
                      r: 5,
                    },
                  },
                }}
                sx={{
                  '& .MuiChartsAxis-line': {
                    display: 'none',
                  },
                  '& .MuiChartsAxis-tick': {
                    display: 'none',
                  },
                  '& .MuiChartsGrid-line': {
                    stroke: 'black',
                    strokeWidth: 1,
                  },
                  '& .MuiChartsGrid-root .MuiChartsGrid-line': {
                    strokeDasharray: 'none',
                  },
                  '& .MuiChartsGrid-root .MuiChartsGrid-line:not(:first-child)': {
                    display: 'none',
                  },
                  '& .MuiLineElement-root': {
                    strokeWidth: 1,
                  },
                  '& .MuiMarkElement-root': {
                    fill: '#1340FF !important',
                    stroke: '#1340FF !important',
                    strokeWidth: '2px !important',
                    r: '5px !important',
                  },
                  '& .MuiMarkElement-root:hover': {
                    fill: '#1340FF !important',
                    stroke: '#1340FF !important',
                    strokeWidth: '2px !important',
                    r: '5px !important',
                  },
                  '& .MuiChartsAxisHighlight-root': {
                    display: 'none !important',
                  },
                }}
              />
              {/* Data labels positioned directly above dots */}
              {/*
               <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                 {(() => {
                   // Use real analytics data if available
                   const engagementRates = dataSource?.analytics?.engagementRates?.map(rate => parseFloat(rate.toFixed(2))) || [];
                   
                   // Calculate from recent posts if no analytics data
                   if (engagementRates.length === 0) {
                     const posts = dataSource?.medias?.sortedVideos || [];
                     if (posts.length >= 3) {
                       return posts.slice(0, 3).map((post, index) => {
                         const engagement = (post.like_count || 0) + 
                                           (post.comments_count || 0) + 
                                           (post.share_count || 0) + 
                                           (post.saved || 0);
                         const followers = dataSource?.overview?.followers_count || 1;
                         const rate = parseFloat(((engagement / followers) * 100).toFixed(2));
                         
                         // Chart plotting area calculations
                         const plotAreaLeft = 30;
                         const plotAreaTop = 15;
                         const chartWidth = 350;
                         const chartHeight = 200;
                         const plotAreaWidth = chartWidth - 30 - 15;
                         const plotAreaHeight = chartHeight - 15 - 35;
                         
                         const bandWidth = plotAreaWidth / 3;
                         const xPosition = plotAreaLeft + (bandWidth * 0.5) + (index * bandWidth);
                         const dataPointY = plotAreaTop + (plotAreaHeight - ((rate / 15) * plotAreaHeight));
                         const labelY = dataPointY - 18;
                         
                         return (
                           <Typography
                             key={index}
                             sx={{
                               position: 'absolute',
                               top: labelY, 
                               left: xPosition, 
                               fontSize: 14,
                               color: '#000', 
                               fontWeight: 400,
                               fontFamily: 'Aileron, sans-serif',
                               transform: 'translateX(-50%)',
                               textAlign: 'center',
                               lineHeight: 1,
                               userSelect: 'none',
                               whiteSpace: 'nowrap',
                               textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                               minWidth: '24px',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center'
                             }}
                           >
                             {rate.toFixed(2)}%
                           </Typography>
                         );
                       });
                     }
                     return []; // Return empty array if no data available
                   }
                   
                   return engagementRates.map((rate, index) => {
                     // Chart plotting area calculations - more precise to match actual dots
                     const plotAreaLeft = 30;
                     const plotAreaTop = 15;
                     const chartWidth = 350;
                     const chartHeight = 200;
                     const plotAreaWidth = chartWidth - 30 - 15;
                     const plotAreaHeight = chartHeight - 15 - 35;
                     
                     // Calculate exact dot position
                     const bandWidth = plotAreaWidth / 3;
                     const xPosition = plotAreaLeft + (bandWidth * 0.5) + (index * bandWidth);
                     
                     // More precise Y calculation to match the actual line chart dot
                     const yAxisRange = 3; // 0 to 3%
                     const normalizedValue = rate / yAxisRange;
                     const dataPointY = plotAreaTop + plotAreaHeight - (normalizedValue * plotAreaHeight);
                     const labelY = dataPointY - 25; // Position 25px above the dot
                     
                     return (
                       <Typography
                         key={index}
                         sx={{
                           position: 'absolute',
                           top: labelY, 
                           left: xPosition, 
                           fontSize: 12,
                           color: 'black', // Changed back to black
                           fontWeight: 500, // Less bold
                           fontFamily: 'Aileron, sans-serif',
                           transform: 'translateX(-50%)',
                           textAlign: 'center',
                           lineHeight: 1,
                           userSelect: 'none',
                           whiteSpace: 'nowrap',
                           minWidth: '24px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center'
                         }}
                       >
                         {rate.toFixed(2)}%
                       </Typography>
                     );
                   });
                 })()}
               </Box>
               */}
            </Box>
          </Box>

          {/* Monthly Interactions Box */}
          <Box
            sx={{
              backgroundColor: '#E7E7E7',
              borderRadius: 3,
              p: 3,
              flex: 1,
              width: 'auto',
              minWidth: '400px',
              minHeight: '311px',
              height: '311px',
              position: 'relative',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: 'black',
                fontWeight: 600,
                fontSize: '18px',
                position: 'absolute',
                top: 24,
                left: 28,
              }}
            >
              Monthly Interactions
            </Typography>

            {/* Vertical Bar Chart */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 30,
                left: 28,
                right: 28,
                height: 220,
                display: 'flex',
                alignItems: 'end',
                justifyContent: 'space-between',
                gap: 2, // Reduced gap for desktop
              }}
            >
              {(() => {
                // Use real analytics data if available
                const monthlyInteractions = dataSource?.analytics?.monthlyInteractions || [];
                let interactionsData;

                if (monthlyInteractions.length > 0) {
                  interactionsData = monthlyInteractions.map((data) => ({
                    month: data.month,
                    value: data.interactions || 0,
                  })); // Already in ascending order from backend
                } else {
                  // Calculate from recent posts if no analytics data
                  const posts = dataSource?.medias?.sortedVideos || [];
                  if (posts.length >= 3) {
                    const months = dataSource?.analytics?.months || ['Jan', 'Feb', 'Mar'];
                    const calculatedData = posts.slice(0, 3).map((post, index) => {
                      const interactions =
                        (post.like_count || 0) +
                        (post.comments_count || 0) +
                        (post.share_count || 0) +
                        (post.saved || 0);
                      return {
                        month: months[index],
                        value: interactions,
                      };
                    });
                    interactionsData = calculatedData; // Already in correct order
                  } else {
                    // Return zeros if no data available
                    const months = dataSource?.analytics?.months || ['Jan', 'Feb', 'Mar'];
                    const zeroData = months.map((month) => ({
                      month,
                      value: 0,
                    }));
                    interactionsData = zeroData; // Already in correct order
                  }
                }

                // Calculate max value for scaling
                const maxValue = Math.max(...interactionsData.map((data) => data.value));
                const maxBarHeight = 160; // Reduced height to stay below title

                return interactionsData.map((data, index) => {
                  // Calculate bar height for this data point
                  const barHeight = maxValue > 0 ? (data.value / maxValue) * maxBarHeight : 0;

                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: maxBarHeight + 50, // Total container height
                        justifyContent: 'flex-end',
                        position: 'relative',
                        flex: 1,
                      }}
                    >
                      {/* Value label - positioned on top of individual bar */}
                      <Typography
                        sx={{
                          color: 'black',
                          fontSize: 14,
                          fontWeight: 500, // Less bold
                          fontFamily: 'Aileron, sans-serif',
                          textAlign: 'center',
                          mb: 0.5,
                          position: 'absolute',
                          bottom: barHeight + 40, // Increased from 25 to make numbers higher
                          left: '50%',
                          transform: 'translateX(-50%)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {data.value}
                      </Typography>

                      {/* Bar */}
                      <Box
                        sx={{
                          width: 60, // Much thicker bars
                          height: `${barHeight}px`,
                          background: 'linear-gradient(180deg, #1340FF 0%, #0A2FE8 100%)',
                          borderRadius: '30px', // Much more curved
                          mb: 2,
                          boxShadow: '0 4px 12px rgba(19, 64, 255, 0.3)',
                          transition: 'all 0.3s ease',
                        }}
                      />

                      {/* Month label */}
                      <Typography
                        sx={{
                          color: 'black',
                          fontSize: 12,
                          fontStyle: 'italic',
                          fontFamily: 'Aileron, sans-serif',
                          textAlign: 'center',
                          mt: 0.5,
                        }}
                      >
                        {data.month}
                      </Typography>
                    </Box>
                  );
                });
              })()}
            </Box>
          </Box>
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
