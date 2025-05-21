import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';

import {
  Box,
  Grid,
  Stack,
  alpha,
  Button,
  useTheme,
  CardMedia,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { useSocialMediaData } from 'src/utils/store';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
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

const typeAnimation = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

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
                height: 400,
                width: '100%',
                overflow: 'hidden',
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
                  background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45%, rgba(0, 0, 0, 0.70) 80%), url(${content.media_url}) center/cover no-repeat`,
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
              {`${content.caption.slice(0, 100)}...`}
            </Typography>
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
          }}
        >
          <Box
            component="div"
            sx={{
              position: 'relative',
              height: { xs: 400, sm: 450, md: 550 },
              width: '100%',
              overflow: 'hidden',
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
            {`${content?.caption?.slice(0, 80)}...`}
          </Typography>
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

const MediaKitSocialContent = ({ instagram }) => {
  const { user } = useAuthContext();
  const instagramData = useSocialMediaData((state) => state.instagram);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get the real data from store
  const realTopContent = instagramData?.medias?.sortedVideos;
  
  // Check if we have real content
  const hasContent = Array.isArray(realTopContent) && realTopContent.length > 0;
  const isConnected = !!user?.creator?.isFacebookConnected;

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
          bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.4),
          border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.8)}`,
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

  // Only show grid if connected and has content
  const contentToShow = hasContent ? realTopContent : [];

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
            {contentToShow.length > 0 && <TopContentGrid topContents={contentToShow} mobileCarousel />}
          </Box>
        </Box>
      ) : (
        contentToShow.length > 0 && <TopContentGrid topContents={contentToShow} />
      )}
    </Box>
  );
};

export default MediaKitSocialContent;

MediaKitSocialContent.propTypes = {
  instagram: PropTypes.object,
};
