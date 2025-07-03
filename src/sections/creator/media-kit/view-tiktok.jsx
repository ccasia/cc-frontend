import React, { useMemo } from 'react';
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
import { LineChart } from '@mui/x-charts/LineChart';

import { useResponsive } from 'src/hooks/use-responsive';
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
  const smDown = useResponsive('down', 'sm');
  const mdDown = useResponsive('down', 'md');
  const lgUp = useResponsive('up', 'lg');
  
  // Use carousel for mobile and tablet, desktop layout only for large screens
  const isMobile = forceDesktop ? false : !lgUp;
  const isTablet = !smDown && mdDown; // iPad size

  const tiktokData = useSocialMediaData((state) => state.tiktok);

  // Get the real data from store
  const realTopContent = tiktokData?.creator?.tiktokUser?.sortedVideos;
  // Check if we have real content
  const hasContent = Array.isArray(realTopContent) && realTopContent.length > 0;
  const isConnected = !!user?.creator?.isTiktokConnected;

  // Use real content only
  const contentToShow = realTopContent;

  const connectTiktok = async () => {
    try {
      const { data: url } = await axiosInstance.get('/api/social/oauth/tiktok');
      enqueueSnackbar('Redirecting...');
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  };

  // Show connect TikTok prompt if not connected (bypassed for demo)
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
                        // Calculate engagement rates based on mock data
                        const videos = tiktok?.creator?.tiktokUser?.sortedVideos || [];
                        if (videos.length >= 3) {
                          return videos.slice(0, 3).map(video => {
                            const engagement = (video.like + video.comment);
                            const followers = tiktok?.creator?.tiktokUser?.follower_count || 89500;
                            return parseFloat(((engagement / followers) * 100).toFixed(1));
                          });
                        }
                        return [7.1, 5.5, 8.2]; // fallback
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
                    data: ['Jan', 'Feb', 'Mar'],
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
                    // Calculate engagement rates based on mock data
                    const videos = tiktok?.creator?.tiktokUser?.sortedVideos || [];
                    let engagementRates;
                    if (videos.length >= 3) {
                      engagementRates = videos.slice(0, 3).map(video => {
                        const engagement = (video.like + video.comment);
                        const followers = tiktok?.creator?.tiktokUser?.follower_count || 89500;
                        return parseFloat(((engagement / followers) * 100).toFixed(1));
                      });
                    } else {
                      engagementRates = [7.1, 5.5, 8.2]; // fallback
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
                   
                   // Calculate monthly interactions based on mock data
                   const videos = tiktok?.creator?.tiktokUser?.sortedVideos || [];
                   let interactionsData;
                   
                   if (videos.length >= 3) {
                     interactionsData = videos.slice(0, 3).map((video, index) => {
                       // Use actual engagement (likes + comments) as interactions
                       const interactions = video.like + video.comment;
                       return {
                         month: dynamicMonths[index],
                         value: interactions
                       };
                     });
                   } else {
                     interactionsData = [
                       { month: dynamicMonths[0], value: 6345 },
                       { month: dynamicMonths[1], value: 4889 },
                       { month: dynamicMonths[2], value: 7298 }
                     ];
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
                       // Calculate engagement rates based on mock data
                       const videos = tiktok?.creator?.tiktokUser?.sortedVideos || [];
                       if (videos.length >= 3) {
                         return videos.slice(0, 3).map(video => {
                           const engagement = (video.like + video.comment);
                           const followers = tiktok?.creator?.tiktokUser?.follower_count || 89500;
                           return parseFloat(((engagement / followers) * 100).toFixed(1));
                         });
                       }
                       return [3.1, 5.2, 4.8]; // fallback
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
                   data: ['Jan', 'Feb', 'Mar'],
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
                   // Calculate engagement rates based on mock data
                   const videos = tiktok?.creator?.tiktokUser?.sortedVideos || [];
                   let engagementRates;
                   if (videos.length >= 3) {
                     engagementRates = videos.slice(0, 3).map(video => {
                       const engagement = (video.like + video.comment);
                       const followers = tiktok?.creator?.tiktokUser?.follower_count || 89500;
                       return parseFloat(((engagement / followers) * 100).toFixed(1));
                     });
                   } else {
                     engagementRates = [3.1, 5.2, 4.8]; // fallback
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
                 
                 // Calculate monthly interactions based on mock data
                 const videos = tiktok?.creator?.tiktokUser?.sortedVideos || [];
                 let interactionsData;
                 
                 if (videos.length >= 3) {
                   interactionsData = videos.slice(0, 3).map((video, index) => {
                     // Use actual engagement (likes + comments) as interactions
                     const interactions = video.like + video.comment;
                     return {
                       month: dynamicMonths[index],
                       value: interactions
                     };
                   });
                 } else {
                   interactionsData = [
                     { month: dynamicMonths[0], value: 2840 },
                     { month: dynamicMonths[1], value: 1950 },
                     { month: dynamicMonths[2], value: 5120 }
                   ];
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
  tiktok: PropTypes.object,
  forceDesktop: PropTypes.bool,
};