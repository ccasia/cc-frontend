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

  const displayContent = (topContents || [])
    .sort((a, b) => a?.like_count > b?.like_count)
    .slice(0, 3);

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
        {displayContent.map((content, index) => (
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
                height: 420,
                width: '100%',
                overflow: 'hidden',
                flexShrink: 0,
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
                  ...(content.caption?.length > 120
                    ? {
                        maxHeight: 'none',
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

  const [showOAuthWarning, setShowOAuthWarning] = useState(false);

  const dataSource = instagramData || instagram || {};

  const realTopContent = dataSource?.medias?.sortedVideos;

  const isConnected = !!user?.creator?.isFacebookConnected;

  const contentToShow = realTopContent;

  if (!isConnected) {
    return (
      <>
        <PlatformConnectionPrompt
          platform="Instagram"
          onConnect={() => setShowOAuthWarning(true)}
        />
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
              gap: 2,
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
              <EngagementRateChart dataSource={dataSource} platform="instagram" />
            </ChartContainer>

            <ChartContainer title="Monthly Interactions">
              <MonthlyInteractionsChart dataSource={dataSource} />
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
            <EngagementRateChart dataSource={dataSource} platform="instagram" />
          </ChartContainer>

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
