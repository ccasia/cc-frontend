import React, { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
// import { keyframes } from '@emotion/react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Grid,
  Stack,
  alpha,
  Button,
  useTheme,
  Typography,
  useMediaQuery,
  CardMedia,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';
import axiosInstance from 'src/utils/axios';
import { useSocialMediaData } from 'src/utils/store';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// Utility function to format numbers
const formatNumber = (num) => {
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

const TopContentGrid = ({ topContents }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const topFiveContents = topContents?.slice(0, 3);

  return (
    <Grid
      container
      spacing={isMobile ? 1 : 2}
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
      {topFiveContents.map((content, index) => (
        <Grid
          item
          xs={12}
          md={4}
          sm={6}
          key={index}
          component={m.div}
          variants={{
            hidden: { opacity: 0, y: 50 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <TikTokVideoCard content={content} index={index} />
          {/* <Box
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
                  animation: `${typeAnimation} 0.5s steps(40, end)`,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  mb: 1,
                }}
              >
                {`${content?.video_description?.slice(0, 50)}...`}
              </Typography>

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
          </Box> */}
        </Grid>
      ))}
    </Grid>
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

TopContentGrid.propTypes = {
  topContents: PropTypes.arrayOf(
    PropTypes.shape({
      image_url: PropTypes.string,
    })
  ).isRequired,
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

  const connectTiktok = async () => {
    try {
      const { data: url } = await axiosInstance.get('/api/social/oauth/tiktok');
      enqueueSnackbar('Redirecting...');
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  };

  if (!user?.creator?.isTiktokConnected)
    return (
      <Label
        color="info"
        sx={{
          height: 250,
          textAlign: 'center',
          borderStyle: 'dashed',
          borderColor: theme.palette.divider,
          borderWidth: 1.5,
          bgcolor: alpha(theme.palette.warning.main, 0.16),
          width: 1,
        }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="subtitle2">Your tiktok account is not connected.</Typography>
          <Button
            variant="outlined"
            size="medium"
            sx={{ borderRadius: 0.5 }}
            startIcon={<Iconify icon="logos:tiktok-icon" width={18} />}
            onClick={connectTiktok}
          >
            Connect TikTok
          </Button>
        </Stack>
      </Label>
    );

  return (
    <Box width={1}>
      {tiktokData?.medias?.sortedVideo?.length > 0 ? (
        <TopContentGrid topContents={tiktokData?.medias?.sortedVideo} />
      ) : (
        <Typography variant="subtitle1" color="text.secondary" textAlign="center">
          No top content data available
        </Typography>
      )}
    </Box>
  );
};

export default MediaKitSocialContent;

MediaKitSocialContent.propTypes = {
  tiktok: PropTypes.object,
  forceDesktop: PropTypes.bool,
};
