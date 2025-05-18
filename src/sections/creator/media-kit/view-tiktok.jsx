import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';
import { enqueueSnackbar } from 'notistack';

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

import axiosInstance from 'src/utils/axios';
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

const TopContentGrid = ({ topContents }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const isMedium = useMediaQuery(theme.breakpoints.down('md'));

  const topThreeContents = topContents.slice(0, 3);

  // Dummy data for when no real data is available
  const dummyContents = [
    {
      like: 15896,
      comment: 342,
      cover_image_url: 'https://images.unsplash.com/photo-1595623238469-fc58b3839cf6?q=80&w=1000',
      video_description: '✨ Creating some amazing TikTok content today! Check out this new dance trend. #TikTokDance #Trending #FYP',
      embed_link: 'https://www.tiktok.com/embed/7258519720680394006',
    },
    {
      like: 12453,
      comment: 256,
      cover_image_url: 'https://images.unsplash.com/photo-1595623238469-fc58b3839cf6?q=80&w=1000',
      video_description: '🎬 Behind the scenes of my latest TikTok challenge! So much fun making this. Drop a comment if you want to see more! #BTS #TikTokChallenge',
      embed_link: 'https://www.tiktok.com/embed/7276481943133737243',
    },
    {
      like: 9872,
      comment: 189,
      cover_image_url: 'https://images.unsplash.com/photo-1595623238469-fc58b3839cf6?q=80&w=1000',
      video_description: '🌟 Trying out the viral recipe everyone is talking about! Super easy to make and tastes amazing! #FoodTok #Viral #Recipe',
      embed_link: 'https://www.tiktok.com/embed/7288858839104369966',
    }
  ];

  // Use either real data or dummy data
  const displayContents = topContents?.length > 0 ? topThreeContents : dummyContents;

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
      {displayContents.map((content, index) => (
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
              height: { xs: 400, sm: 450, md: 550 },
              width: '100%',
              overflow: 'hidden',
              borderRadius: 1,
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
                borderRadius: '4px',
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
                borderRadius: '0 0 4px 4px',
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
            {`${content?.video_description?.slice(0, 80)}...`}
          </Typography>
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

const MediaKitSocialContent = ({ tiktok }) => {
  const theme = useTheme();
  const { user } = useAuthContext();

  const tiktokData = useSocialMediaData((state) => state.tiktok);

  const connectTiktok = async () => {
    try {
      const { data: url } = await axiosInstance.get('/api/social/oauth/tiktok');
      enqueueSnackbar('Redirecting...');
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  };

  // Comment out this condition to always show dummy data
  if (!user?.creator?.isTiktokConnected)
    return (
      <Box
        component={m.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        sx={{
          height: 280,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 1,
          borderRadius: 1.5,
          bgcolor: alpha(theme.palette.background.neutral, 0.6),
          border: `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={2.5} alignItems="center" sx={{ maxWidth: 280, textAlign: 'center' }}>
          <Box sx={{ 
            width: 56, 
            height: 56, 
            borderRadius: 1.5,
            bgcolor: '#FFFFFF',
            boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Iconify icon="logos:tiktok-icon" width={24} />
          </Box>
          
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Connect your TikTok to showcase your top content and analytics.
          </Typography>

          <Button
            variant="outlined"
            size="medium"
            color="primary"
            sx={{ 
              borderRadius: 1,
              px: 2.5,
              borderColor: '#000000',
              color: '#000000',
              '&:hover': {
                borderColor: '#000000',
                bgcolor: alpha('#000000', 0.08),
              }
            }}
            startIcon={<Iconify icon="mingcute:link-line" width={18} color="#000000"/>}
            onClick={connectTiktok}
          >
            Connect TikTok
          </Button>
        </Stack>
      </Box>
    );

  return (
    <Box>
      {/* {tiktokData?.videos?.data?.videos.length ? (
        <TopContentGrid topContents={tiktokData?.videos?.data?.videos} />
      ) : (
        <Typography variant="subtitle1" color="text.secondary" textAlign="center">
          No top content data available
        </Typography>
      )} */}
      {/* Pass videos array if it exists, otherwise empty array to use dummy data */}
      <TopContentGrid topContents={tiktokData?.videos?.data?.videos || []} />
    </Box>
  );
};

export default MediaKitSocialContent;

MediaKitSocialContent.propTypes = {
  tiktok: PropTypes.object,
};
