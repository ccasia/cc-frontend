import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
// import { keyframes } from '@emotion/react';

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
import { LineChart } from '@mui/x-charts/LineChart';

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

  const topThreeContents = topContents.sort((a, b) => a?.like_count > b?.like_count).slice(0, 3);

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
                    <Typography variant="subtitle2">{formatNumber(content?.comments_count)}</Typography>
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
                  ...(content.caption?.length > 120 ? {
                    // For longer captions, allow more space
                    maxHeight: 'none', // Remove height restriction
                  } : {
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

  // Get the real data from store
  const realTopContent = instagramData?.medias?.sortedVideos;
  
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
                      curve: "linear", 
                      data: (() => {
                        // Use real analytics data if available
                        const engagementRates = instagram?.analytics?.engagementRates || [];
                        
                        // Fallback calculation if no analytics data
                        if (engagementRates.length === 0) {
                          const posts = instagram?.medias?.sortedVideos || [];
                          if (posts.length >= 3) {
                            return posts.slice(0, 3).map(post => {
                              const engagement = (post.like_count + post.comments_count);
                              const followers = instagram?.overview?.followers_count || 1;
                              return parseFloat(((engagement / followers) * 100).toFixed(1));
                            });
                          }
                          return [2.3, 4.1, 3.8]; // fallback
                        }
                        
                        return engagementRates;
                      })(),
                      color: '#1340FF',
                      valueFormatter: (value) => `${value}%`
                    }
                  ]}
                  width={isTablet ? 310 : 208} // Larger for tablet
                  height={isTablet ? 200 : 160} // Larger for tablet
                  margin={{ 
                    left: 25, 
                    right: 15, 
                    top: 15, 
                    bottom: isTablet ? 35 : 25 // More bottom margin for tablet
                  }}
                  xAxis={[{ 
                    scaleType: 'band',
                    data: (() => {
                      // Use real months if available
                      const analyticsMonths = instagram?.analytics?.months || [];
                      return analyticsMonths.length > 0 ? analyticsMonths : ['Jan', 'Feb', 'Mar'];
                    })(),
                    hideTooltip: true,
                    tickLabelStyle: { 
                      fontSize: isTablet ? 12 : 10, 
                      fill: 'black', 
                      fontStyle: 'italic' 
                    },
                    axisLine: false,
                    tickLine: false
                  }]}
                  yAxis={[{ 
                    min: 0,
                    max: 15,
                    tickNumber: 4,
                    hideTooltip: true,
                    tickLabelStyle: { 
                      fontSize: isTablet ? 13 : 11, 
                      fill: '#333', 
                      fontWeight: 500 
                    },
                    axisLine: false,
                    tickLine: false
                  }]}
                  grid={{ horizontal: true, vertical: false }}
                  slotProps={{
                    legend: { hidden: true },
                    tooltip: { trigger: 'none' },
                    axisHighlight: { x: 'none', y: 'none' },
                    mark: {
                      style: {
                        fill: '#1340FF',
                        stroke: '#1340FF',
                        strokeWidth: 2,
                        r: isTablet ? 5 : 4 // Larger dots for tablet
                      }
                    }
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
                      strokeWidth: 1
                    },
                    '& .MuiChartsGrid-root .MuiChartsGrid-line': {
                      strokeDasharray: 'none',
                    },
                    '& .MuiChartsGrid-root .MuiChartsGrid-line:not(:first-child)': {
                      display: 'none',
                    },
                    '& .MuiLineElement-root': {
                      strokeWidth: 2,
                    },
                    '& .MuiMarkElement-root': {
                      fill: '#1340FF !important',
                      stroke: '#1340FF !important',
                      strokeWidth: '2px !important',
                      r: `${isTablet ? 5 : 4}px !important`
                    },
                    '& .MuiMarkElement-root:hover': {
                      fill: '#1340FF !important',
                      stroke: '#1340FF !important',
                      strokeWidth: '2px !important',
                      r: `${isTablet ? 5 : 4}px !important`
                    },
                    '& .MuiChartsAxisHighlight-root': {
                      display: 'none !important'
                    }
                  }}
                />
                {/* Data labels positioned directly above dots */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {(() => {
                    // Use real analytics data if available
                    const engagementRates = instagram?.analytics?.engagementRates || [];
                    
                    // Fallback calculation if no analytics data
                    if (engagementRates.length === 0) {
                      const posts = instagram?.medias?.sortedVideos || [];
                      if (posts.length >= 3) {
                        return posts.slice(0, 3).map(post => {
                          const engagement = (post.like_count + post.comments_count);
                          const followers = instagram?.overview?.followers_count || 1;
                          return parseFloat(((engagement / followers) * 100).toFixed(1));
                        });
                      }
                      return [2.3, 4.1, 3.8]; // fallback
                    }
                    
                    return engagementRates;
                  })().map((value, index) => {
                     // Chart plotting area calculations - responsive for mobile/tablet
                     const plotAreaLeft = 25;
                     const plotAreaTop = 15;
                     const chartWidth = isTablet ? 310 : 208;
                     const chartHeight = isTablet ? 200 : 160;
                     const plotAreaWidth = chartWidth - 25 - 15; // chart width minus left/right margins
                     const plotAreaHeight = chartHeight - 15 - (isTablet ? 35 : 25); // chart height minus top/bottom margins
                     
                     // Calculate exact x position for each data point (band scale centers)
                     const bandWidth = plotAreaWidth / 3; // 3 data points
                     const xPosition = plotAreaLeft + (bandWidth * 0.5) + (index * bandWidth);
                     
                     // Calculate exact y position based on data value (0-15 scale)
                     const dataPointY = plotAreaTop + (plotAreaHeight - ((value / 15) * plotAreaHeight));
                     const labelY = dataPointY - 18; // Consistent spacing
                     
                     return (
                       <Typography 
                         key={index}
                         sx={{ 
                           position: 'absolute', 
                           top: labelY, 
                           left: xPosition, 
                           fontSize: isTablet ? 14 : 12, // Larger text for tablet
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
                         {value}%
                       </Typography>
                     );
                   })}
                 </Box>
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
               <Box sx={{ 
                 position: 'absolute',
                 bottom: isTablet ? 20 : 16,
                 left: isTablet ? 20 : 12,
                 right: isTablet ? 20 : 12,
                 height: isTablet ? 200 : 160, // Increased height back for mobile
                 display: 'flex',
                 alignItems: 'end',
                 justifyContent: 'center', // Center the bars with smaller gaps
                 gap: isTablet ? 1.5 : 1, // Smaller gap between bars
               }}>
                 {(() => {
                   // Get the last 3 months dynamically
                   const getLastThreeMonths = () => {
                     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                     const currentDate = new Date();
                     const currentMonth = currentDate.getMonth(); // 0-11
                     
                     const lastThreeMonths = [];
                     for (let i = 2; i >= 0; i--) {
                       const monthIndex = (currentMonth - i + 12) % 12;
                       lastThreeMonths.push(months[monthIndex]);
                     }
                     return lastThreeMonths;
                   };
                   
                   const dynamicMonths = getLastThreeMonths();
                   
                   // Use real analytics data if available
                   const monthlyInteractions = instagram?.analytics?.monthlyInteractions || [];
                   let interactionsData;
                   
                   if (monthlyInteractions.length > 0) {
                     // Use real analytics data
                     interactionsData = monthlyInteractions.map((data) => ({
                       month: data.month,
                       value: data.interactions
                     }));
                   } else {
                     // Fallback calculation
                     const posts = instagram?.medias?.sortedVideos || [];
                     if (posts.length >= 3) {
                       interactionsData = posts.slice(0, 3).map((post, index) => {
                         const interactions = post.like_count + post.comments_count;
                         return {
                           month: dynamicMonths[index],
                           value: interactions
                         };
                       });
                     } else {
                       interactionsData = [
                         { month: dynamicMonths[0], value: 1220 },
                         { month: dynamicMonths[1], value: 664 },
                         { month: dynamicMonths[2], value: 4548 }
                       ];
                     }
                   }
                   
                   return interactionsData;
                 })().map((data, index, array) => {
                   // Calculate max value for scaling - highest value in the array
                   const maxValue = Math.max(...array.map(item => item.value));
                   const maxBarHeight = isTablet ? 140 : 110; // Increased mobile bar height while leaving space for numbers
                   const barHeight = (data.value / maxValue) * maxBarHeight;
                   
                   return (
                     <Box key={index} sx={{ 
                       display: 'flex', 
                       flexDirection: 'column', 
                       alignItems: 'center',
                       width: isTablet ? '60px' : '50px', // Fixed width instead of flex: 1
                       gap: 0.8,
                       height: '100%', // Use full height of container
                       justifyContent: 'flex-end' // Align content to bottom
                     }}>
                       {/* Value above bar */}
                       <Typography sx={{
                         fontSize: isTablet ? 13 : 10, // Keep mobile text size manageable
                         fontWeight: 400,
                         color: 'black',
                         fontFamily: 'Aileron, sans-serif',
                         textAlign: 'center',
                         lineHeight: 1,
                         mb: 0.5 // Small margin to separate from bar
                       }}>
                         {data.value.toLocaleString()}
                       </Typography>
                       
                       {/* Bar */}
                       <Box sx={{
                         width: isTablet ? '35px' : '28px', // Slimmer bars
                         height: `${barHeight}px`,
                         backgroundColor: '#1340FF',
                         borderRadius: isTablet ? '17.5px' : '14px', // Adjusted border radius for slimmer bars
                         transition: 'all 0.3s ease',
                         minHeight: '20px' // Ensure minimum visible height
                       }} />
                       
                       {/* Month label */}
                       <Typography sx={{
                         fontSize: isTablet ? 12 : 9, // Keep mobile text smaller
                         fontWeight: 400,
                         color: 'black',
                         fontStyle: 'italic',
                         fontFamily: 'Aileron, sans-serif',
                         textAlign: 'center',
                         mt: 0.5
                       }}>
                         {data.month}
                       </Typography>
                     </Box>
                   );
                 })}
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
                     curve: "linear", 
                     data: (() => {
                       // Use real analytics data if available
                       const engagementRates = instagram?.analytics?.engagementRates || [];
                       
                       // Fallback calculation if no analytics data
                       if (engagementRates.length === 0) {
                         const posts = instagram?.medias?.sortedVideos || [];
                         if (posts.length >= 3) {
                           return posts.slice(0, 3).map(post => {
                             const engagement = (post.like_count + post.comments_count);
                             const followers = instagram?.overview?.followers_count || 1;
                             return parseFloat(((engagement / followers) * 100).toFixed(1));
                           });
                         }
                         return [2.3, 4.1, 3.8]; // fallback
                       }
                       
                       return engagementRates;
                     })(),
                     color: '#1340FF',
                     valueFormatter: (value) => `${value}%`
                   }
                 ]}
                 width={450}
                 height={227}
                 margin={{ left: 30, right: 15, top: 30, bottom: 60 }}
                 xAxis={[{ 
                   scaleType: 'band',
                   data: (() => {
                     // Use real months if available
                     const analyticsMonths = instagram?.analytics?.months || [];
                     return analyticsMonths.length > 0 ? analyticsMonths : ['Jan', 'Feb', 'Mar'];
                   })(),
                   hideTooltip: true,
                   tickLabelStyle: { fontSize: 12, fill: 'black', fontStyle: 'italic' },
                   axisLine: false,
                   tickLine: false
                 }]}
                 yAxis={[{ 
                   min: 0,
                   max: 15,
                   tickNumber: 4,
                   hideTooltip: true,
                   tickLabelStyle: { fontSize: 13, fill: '#333', fontWeight: 500 }, // Made darker and bolder
                   axisLine: false,
                   tickLine: false
                 }]}
                 grid={{ horizontal: true, vertical: false }}
                 slotProps={{
                   legend: { hidden: true },
                   tooltip: { trigger: 'none' },
                   axisHighlight: { x: 'none', y: 'none' },
                   mark: {
                     style: {
                       fill: '#1340FF',
                       stroke: '#1340FF',
                       strokeWidth: 2,
                       r: 5
                     }
                   }
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
                     strokeWidth: 2,
                   },
                   '& .MuiMarkElement-root': {
                     fill: '#1340FF !important',
                     stroke: '#1340FF !important',
                     strokeWidth: '2px !important',
                     r: '5px !important'
                   },
                   '& .MuiMarkElement-root:hover': {
                     fill: '#1340FF !important',
                     stroke: '#1340FF !important',
                     strokeWidth: '2px !important',
                     r: '5px !important'
                   },
                   '& .MuiChartsAxisHighlight-root': {
                     display: 'none !important'
                   }
                 }}
               />
               {/* Data labels positioned directly above dots */}
               <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                 {(() => {
                   // Use real analytics data if available
                   const engagementRates = instagram?.analytics?.engagementRates || [];
                   
                   // Fallback calculation if no analytics data
                   if (engagementRates.length === 0) {
                     const posts = instagram?.medias?.sortedVideos || [];
                     if (posts.length >= 3) {
                       return posts.slice(0, 3).map(post => {
                         const engagement = (post.like_count + post.comments_count);
                         const followers = instagram?.overview?.followers_count || 1;
                         return parseFloat(((engagement / followers) * 100).toFixed(1));
                       });
                     }
                     return [2.3, 4.1, 3.8]; // fallback
                   }
                   
                   return engagementRates;
                 })().map((value, index) => {
                   // Chart plotting area calculations
                   const plotAreaLeft = 30;
                   const plotAreaTop = 30;
                   const plotAreaWidth = 405; // chart width minus left/right margins
                   const plotAreaHeight = 137; // chart height minus top/bottom margins
                   
                   // Calculate exact x position for each data point (band scale centers)
                   const bandWidth = plotAreaWidth / 3; // 3 data points
                   const xPosition = plotAreaLeft + (bandWidth * 0.5) + (index * bandWidth);
                   
                   // Calculate exact y position based on data value (0-15 scale)
                   const dataPointY = plotAreaTop + (plotAreaHeight - ((value / 15) * plotAreaHeight));
                   const labelY = dataPointY - 22; // Position label above the dot
                   
                   return (
                     <Typography 
                       key={index}
                       sx={{ 
                         position: 'absolute', 
                         top: labelY, 
                         left: xPosition, 
                         fontSize: 14, 
                         color: '#000', 
                         fontWeight: 500,
                         fontFamily: 'Aileron, sans-serif',
                         transform: 'translateX(-50%)',
                         textAlign: 'center',
                         lineHeight: 1,
                         userSelect: 'none',
                         // Add subtle styling to make it more visible
                         textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                       }}
                     >
                       {value}%
                     </Typography>
                   );
                 })}
               </Box>
             </Box>
           </Box>

           {/* Monthly Impressions Box */}
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
             <Box sx={{ 
               position: 'absolute',
               bottom: 30,
               left: 28,
               right: 28,
               height: 220,
               display: 'flex',
               alignItems: 'end',
               justifyContent: 'space-between',
               gap: 2 // Reduced gap for desktop
             }}>
               {(() => {
                 // Use real analytics data if available
                 const monthlyInteractions = instagram?.analytics?.monthlyInteractions || [];
                 let interactionsData;
                 
                 if (monthlyInteractions.length > 0) {
                   // Use real analytics data
                   interactionsData = monthlyInteractions.map((data) => ({
                     month: data.month,
                     value: data.interactions
                   }));
                 } else {
                   // Fallback calculation
                   const posts = instagram?.medias?.sortedVideos || [];
                   if (posts.length >= 3) {
                     interactionsData = posts.slice(0, 3).map((post, index) => {
                       const interactions = post.like_count + post.comments_count;
                       return {
                         month: ['Jan', 'Feb', 'Mar'][index],
                         value: interactions
                       };
                     });
                   } else {
                     interactionsData = [
                       { month: 'Jan', value: 1220 },
                       { month: 'Feb', value: 664 },
                       { month: 'Mar', value: 4548 }
                     ];
                   }
                 }
                 
                 return interactionsData;
               })().map((data, index, array) => {
                 // Calculate max value for scaling - highest value in the array
                 const maxValue = Math.max(...array.map(item => item.value));
                 const barHeight = (data.value / maxValue) * 160; // Scale to max 160px height
                 
                 return (
                   <Box key={index} sx={{ 
                     display: 'flex', 
                     flexDirection: 'column', 
                     alignItems: 'center',
                     flex: 1,
                     gap: 1
                   }}>
                     {/* Value above bar */}
                     <Typography sx={{
                       fontSize: 14,
                       fontWeight: 400,
                       color: 'black',
                       fontFamily: 'Aileron, sans-serif',
                       textAlign: 'center',
                       lineHeight: 1
                     }}>
                       {data.value.toLocaleString()}
                     </Typography>
                     
                     {/* Bar */}
                     <Box sx={{
                       width: '45px', // Slimmer bars for desktop
                       height: `${barHeight}px`,
                       backgroundColor: '#1340FF',
                       borderRadius: '22.5px', // Adjusted border radius for slimmer bars
                       transition: 'all 0.3s ease',
                       minHeight: '25px' // Ensure minimum visible height
                     }} />
                     
                     {/* Month label */}
                     <Typography sx={{
                       fontSize: 12,
                       fontWeight: 400,
                       color: 'black',
                       fontStyle: 'italic',
                       fontFamily: 'Aileron, sans-serif',
                       textAlign: 'center',
                       mt: 1
                     }}>
                       {data.month}
                     </Typography>
                   </Box>
                 );
               })}
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
