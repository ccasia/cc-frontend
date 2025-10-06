import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
// import { keyframes } from '@emotion/react';
import { enqueueSnackbar } from 'notistack';

import { Box, Stack, Button, useTheme, Typography, useMediaQuery } from '@mui/material';

import { useMediaKitResponsive } from 'src/hooks/use-media-kit-responsive';

import axiosInstance from 'src/utils/axios';
import { useSocialMediaData } from 'src/utils/store';
import {
  formatNumber,
} from 'src/utils/media-kit-utils';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import ChartContainer from 'src/components/media-kit/ChartContainer';
import EngagementRateChart from 'src/components/media-kit/EngagementRateChart';
import MonthlyInteractionsChart from 'src/components/media-kit/MonthlyInteractionsChart';
import PlatformConnectionPrompt from 'src/components/media-kit/PlatformConnectionPrompt';


const TopContentGrid = ({ topContents }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const topFiveContents = topContents?.slice(0, 5);

  // Only use real data
  const displayContents = topFiveContents;

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
        {displayContents.length > 0 &&
          displayContents.map((content, index) => (
            <Box
              key={index}
              sx={{
                minWidth: 200,
                maxWidth: 240,
                flex: '0 0 auto',
                scrollSnapAlign: 'center',
                borderRadius: 0,
                overflow: 'hidden',
                boxShadow: 'none',
                bgcolor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                mx: 0,
                height: 'auto',
                minHeight: 520,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  height: 420,
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
                    ...((content.video_description?.length || 0) > 120
                      ? {
                          // Copy Instagram long caption handling
                          maxHeight: 'none', // Remove height restriction
                        }
                      : {
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

  // Desktop layout
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
      {displayContents.length > 0 &&
        displayContents.map((content, index) => (
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
                    <Typography variant="subtitle2">{formatNumber(content?.comment)}</Typography>
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
      image_url: PropTypes.string.isRequired,
    })
  ).isRequired,
};

const MediaKitSocialContent = ({ tiktok, forceDesktop = false }) => {
  const { user } = useAuthContext();
  const { isMobile, isTablet, theme } = useMediaKitResponsive(forceDesktop);

  const tiktokData = useSocialMediaData((state) => state.tiktok);

  // Get the real data from store - use tiktokData consistently
  const dataSource = tiktokData;
  const realTopContent = dataSource?.medias?.sortedVideos;

  // Debug logging for staging
  console.log('TikTok View Component Debug:', {
    hasTiktokData: !!tiktokData,
    hasMedias: !!dataSource?.medias,
    sortedVideosLength: realTopContent?.length,
    isArray: Array.isArray(realTopContent),
    userConnected: !!user?.creator?.isTiktokConnected,
    firstVideo: realTopContent?.[0] ? {
      id: realTopContent[0].id,
      title: realTopContent[0].title,
      like: realTopContent[0].like,
      comment: realTopContent[0].comment
    } : null
  });


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
    return (
      <PlatformConnectionPrompt
        platform="TikTok"
        onConnect={connectTiktok}
      />
    );
  }

  // Carousel for mobile, grid for desktop
  return (
    <Box width={1}>
      {hasContent ? (
        <TopContentGrid topContents={contentToShow} />
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            {isConnected 
              ? "No videos found in your TikTok account. This could be due to:\n• Account has no public videos\n• TikTok API permissions need refresh\n• Account is private" 
              : "Connect your TikTok account to see your top content"
            }
          </Typography>
          {!isConnected ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="logos:tiktok-icon" width={16} />}
              onClick={connectTiktok}
              sx={{ mt: 1 }}
            >
              Connect TikTok
            </Button>
          ) : (
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
                onClick={() => window.location.reload()}
              >
                Refresh Data
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="logos:tiktok-icon" width={16} />}
                onClick={connectTiktok}
              >
                Reconnect TikTok
              </Button>
            </Stack>
          )}
        </Box>
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
              <EngagementRateChart
                data={dataSource}
                platform="tiktok"
                isMobile={isMobile}
                isTablet={isTablet}
              />
            </ChartContainer>

            {/* Monthly Interactions Chart */}
            <ChartContainer title="Monthly Interactions">
              <MonthlyInteractionsChart data={dataSource} />
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
            <EngagementRateChart
              data={dataSource}
              platform="tiktok"
              isMobile={false}
              isTablet={false}
            />
          </ChartContainer>

          {/* Monthly Interactions Chart */}
          <ChartContainer title="Monthly Interactions">
            <MonthlyInteractionsChart data={dataSource} />
          </ChartContainer>
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
