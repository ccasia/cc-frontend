import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import { Box, Stack, Button, useTheme, CardMedia, Typography, useMediaQuery } from '@mui/material';

import { useMediaKitResponsive } from 'src/hooks/use-media-kit-responsive';

import axiosInstance from 'src/utils/axios';
import { useSocialMediaData } from 'src/utils/store';
import { formatNumber } from 'src/utils/media-kit-utils';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import ChartContainer from 'src/components/media-kit/ChartContainer';
import EngagementRateChart from 'src/components/media-kit/EngagementRateChart';
import MonthlyInteractionsChart from 'src/components/media-kit/MonthlyInteractionsChart';
import PlatformConnectionPrompt from 'src/components/media-kit/PlatformConnectionPrompt';

const TopContentGrid = ({ topContents, tiktokUsername }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const topFiveContents = topContents?.slice(0, 5);

  const getTikTokVideoUrl = (content) => {
    if (content?.embed_html) {
      try {
        const citeMatch = content.embed_html.match(/cite="([^"]*)/);
        if (citeMatch && citeMatch[1]) {
          const cleanUrl = citeMatch[1].split('?')[0];
          console.log('Extracted TikTok URL from embed_html:', cleanUrl);
          return cleanUrl;
        }
      } catch (error) {
        console.warn('Error extracting URL from embed_html:', error);
      }
    }

    if (tiktokUsername && content?.id) {
      const fallbackUrl = `https://www.tiktok.com/@${tiktokUsername}/video/${content.id}`;
      console.log('Using fallback TikTok URL construction:', fallbackUrl);
      return fallbackUrl;
    }

    console.warn('Unable to construct TikTok URL - missing data');
    return null;
  };

  const displayContent = topFiveContents;

  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          width: '100%',
          gap: 3,
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
        {displayContent.length > 0 &&
          displayContent.map((content, index) => (
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
                component="div"
                sx={{
                  position: 'relative',
                  height: 420,
                  width: '100%',
                  overflow: 'hidden',
                  flexShrink: 0,
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
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  pt: 1.5,
                  px: 0.5,
                  pb: 0.5,
                  minHeight: 0,
                  maxHeight: 120,
                  border: 'none',
                  boxShadow: 'none',
                  bgcolor: 'transparent',
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
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    ...((content.video_description?.length || 0) > 120
                      ? {
                          maxHeight: 'none',
                        }
                      : {
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
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
      {displayContent.length > 0 &&
        displayContent.map((content, index) => (
          <Box
            key={index}
            component={m.div}
            variants={{
              hidden: { opacity: 0, y: 50 },
              show: { opacity: 1, y: 0 },
            }}
            onClick={() => {
              const videoUrl = getTikTokVideoUrl(content);
              console.log('Generated TikTok URL:', videoUrl);
              if (videoUrl) {
                window.open(videoUrl, '_blank');
              }
            }}
            sx={{
              width: { xs: '100%', sm: '30%', md: 350 },
              minWidth: { xs: '280px', sm: '250px', md: '320px' },
              maxWidth: { xs: '100%', sm: '350px' },
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              overflow: 'hidden',
              boxShadow: 'none',
              bgcolor: 'transparent',
              height: 'auto',
              minHeight: { xs: 580, sm: 600, md: 650 },
            }}
          >
            <Box
              component="div"
              sx={{
                position: 'relative',
                height: { xs: 420, sm: 500, md: 580 },
                width: '100%',
                overflow: 'hidden',
                cursor: 'pointer',
                flexShrink: 0,
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
                flex: 0,
                display: 'flex',
                flexDirection: 'column',
                pt: 1,
                px: 0.5,
                pb: 0.5,
                minHeight: 'auto',
                maxHeight: 60,
                border: 'none',
                boxShadow: 'none',
                bgcolor: 'transparent',
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
                  flex: 1,
                  ...(() => {
                    const length = content?.video_description?.length || 0;
                    const isLongCaption = length > 120;

                    if (isLongCaption) {
                      return {
                        display: '-webkit-box',
                        WebkitLineClamp: isMobile ? 4 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      };
                    }
                    return {
                      display: '-webkit-box',
                      WebkitLineClamp: isMobile ? 3 : 2,
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
      id: PropTypes.string.isRequired,
      cover_image_url: PropTypes.string,
      title: PropTypes.string,
      video_description: PropTypes.string,
    })
  ).isRequired,
  tiktokUsername: PropTypes.string,
};

const TikTokVideoCard = ({ content, index }) => {
  const [embedFailed, setEmbedFailed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleEmbedError = () => {
    console.log('Embed failed for video:', content?.id);
    setEmbedFailed(true);
  };

  if (embedFailed || !content?.embed_link) {
    // Fallback to cover image display
    return (
      <Box
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
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              mb: 1,
            }}
          >
            {content?.title || content?.video_description || 'TikTok Video'}
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
    );
  }

  return (
    <Box height={600} borderRadius={2} overflow="hidden">
      <iframe
        src={content?.embed_link}
        title="tiktok"
        style={{ height: '100%', width: '100%' }}
        onError={handleEmbedError}
        onLoad={(e) => {
          // Additional check for TikTok embed errors
          const iframe = e.target;
          setTimeout(() => {
            try {
              // If iframe has no content or shows TikTok error, fallback
              if (!iframe.contentDocument) {
                handleEmbedError();
              }
            } catch (error) {
              // Cross-origin restrictions - expected
            }
          }, 2000);
        }}
      />
    </Box>
  );
};

TikTokVideoCard.propTypes = {
  content: PropTypes.shape({
    id: PropTypes.string,
    embed_link: PropTypes.string,
    cover_image_url: PropTypes.string,
    title: PropTypes.string,
    video_description: PropTypes.string,
    like_count: PropTypes.number,
    comment_count: PropTypes.number,
  }),
  index: PropTypes.number.isRequired,
};

const MediaKitSocialContent = ({ tiktok, forceDesktop = false }) => {
  const { user } = useAuthContext();
  const { isMobile, isTablet, theme } = useMediaKitResponsive(forceDesktop);

  const tiktokData = useSocialMediaData((state) => state.tiktok);

  const dataSource = tiktokData;
  const realTopContent = dataSource?.medias?.sortedVideos;
  const tiktokUsername = dataSource?.tiktokUser?.display_name;

  console.log('TikTok View Component Debug:', {
    hasTiktokData: !!tiktokData,
    hasMedias: !!dataSource?.medias,
    sortedVideosLength: realTopContent?.length,
    isArray: Array.isArray(realTopContent),
    userConnected: !!user?.creator?.isTiktokConnected,
    tiktokUsername,
    firstVideo: realTopContent?.[0]
      ? {
          id: realTopContent[0].id,
          title: realTopContent[0].title,
          like: realTopContent[0].like,
          comment: realTopContent[0].comment,
        }
      : null,
  });

  const hasContent = Array.isArray(realTopContent) && realTopContent.length > 0;

  const isConnected = !!user?.creator?.isTiktokConnected;

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

  if (!isConnected) {
    return <PlatformConnectionPrompt platform="TikTok" onConnect={connectTiktok} />;
  }

  return (
    <Box width={1}>
      {hasContent ? (
        <TopContentGrid topContents={contentToShow} tiktokUsername={tiktokUsername} />
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            {isConnected
              ? 'No videos found in your TikTok account. This could be due to:\n• Account has no public videos\n• TikTok API permissions need refresh\n• Account is private'
              : 'Connect your TikTok account to see your top content'}
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

      {isMobile ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            px: 0,
            overflow: 'hidden',
            mt: 0.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              width: '100%',
              gap: isTablet ? 3 : 2,
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
            <ChartContainer title="Engagement Rate">
              <EngagementRateChart
                data={dataSource}
                platform="tiktok"
                isMobile={isMobile}
                isTablet={isTablet}
              />
            </ChartContainer>

            <ChartContainer title="Monthly Interactions">
              <MonthlyInteractionsChart data={dataSource} />
            </ChartContainer>
          </Box>
        </Box>
      ) : (
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
          <ChartContainer title="Engagement Rate">
            <EngagementRateChart
              data={dataSource}
              platform="tiktok"
              isMobile={false}
              isTablet={false}
            />
          </ChartContainer>

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
