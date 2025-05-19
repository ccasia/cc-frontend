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

const TopContentGrid = ({ topContents }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const isMedium = useMediaQuery(theme.breakpoints.down('md'));

  const topThreeContents = topContents.sort((a, b) => a?.like_count > b?.like_count).slice(0, 3);

  // Dummy data for testing
  const dummyContents = [
    {
      comments_count: 342,
      like_count: 15896,
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000',
      permalink: 'https://www.instagram.com/p/sample1',
      id: '18056628766068743',
      caption:
        '✨ Living my best life! Weekend vibes with amazing friends at the coolest spots in town. Swipe to see more adventures! 🌟 #WeekendVibes #LifestyleBlogger #Adventure',
    },
    {
      comments_count: 256,
      like_count: 12453,
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000',
      permalink: 'https://www.instagram.com/p/sample2',
      id: '18056628766068744',
      caption:
        "🌿 Self-care Sunday essentials! Sharing my morning routine and favorite wellness tips. What's your go-to morning ritual? 🧘‍♀️ #WellnessJourney #SelfCareSunday #HealthyLifestyle",
    },
    {
      comments_count: 189,
      like_count: 9872,
      media_type: 'VIDEO',
      media_url: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=1000',
      permalink: 'https://www.instagram.com/p/sample3',
      id: '18056628766068745',
      caption:
        '🎥 Behind the scenes of my latest project! So excited to share this with you all. Drop a ❤️ if you want more content like this! #CreatorLife #BTS #NewProject',
    },
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
      {displayContents.map((content, index) => (
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

  // Comment this out if you want to use dummy data
  if (!user?.creator?.isFacebookConnected)
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
          bgcolor: (theme) => alpha(theme.palette.background.neutral, 0.6),
          border: (theme) => `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={2.5} alignItems="center" sx={{ maxWidth: 280, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 1.5,
              bgcolor: '#FFFFFF',
              boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="skill-icons:instagram" width={28} sx={{ color: '#E1306C' }} />
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Connect your Instagram to showcase your top content and analytics.
          </Typography>

          <Button
            variant="outlined"
            size="medium"
            color="primary"
            sx={{
              borderRadius: 1,
              px: 2.5,
              borderColor: '#E1306C',
              color: '#E1306C',
              '&:hover': {
                borderColor: '#E1306C',
                bgcolor: (theme) => alpha('#E1306C', 0.08),
              },
            }}
            startIcon={<Iconify icon="mingcute:link-line" width={20} color="#E1306C" />}
            LinkComponent="a"
            href="https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=945958120199185&redirect_uri=https://app.cultcreativeasia.com/api/social/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights"
            target="_blank"
          >
            Connect Instagram
          </Button>
        </Stack>
      </Box>
    );

  return (
    <Box>
      {/* {instagramData?.instagramUser?.instagramVideo?.length ? (
        <TopContentGrid topContents={instagramData?.instagramUser?.instagramVideo} />
      ) : (
        <Typography variant="subtitle1" color="text.secondary" textAlign="center">
          No top content data available
        </Typography>
      )} */}
      {/* Pass empty array to use dummy data or instagram data */}
      <TopContentGrid topContents={instagramData?.medias?.sortedVideos || []} />
    </Box>
  );
};

export default MediaKitSocialContent;

MediaKitSocialContent.propTypes = {
  instagram: PropTypes.object,
};
