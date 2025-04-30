import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';
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
} from '@mui/material';

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

const typeAnimation = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

const TopContentGrid = ({ topContents }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const topThreeContents = topContents?.slice(0, 3);

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
      {topThreeContents.map((content, index) => (
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
          <Box height={600} overflow="hidden">
            <iframe
              src={content?.embed_link}
              title="tiktok"
              style={{ height: '100%', width: '100%' }}
            />
          </Box>
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

TopContentGrid.propTypes = {
  topContents: PropTypes.arrayOf(
    PropTypes.shape({
      image_url: PropTypes.string.isRequired,
    })
  ).isRequired,
};

const MediaKitSocialContent = ({ tiktok }) => {
  // const theme = useTheme();
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

  if (!user?.creator?.isTiktokConnected)
    return (
      <Label
        color="info"
        sx={{
          height: 250,
          textAlign: 'center',
          borderStyle: 'dashed',
          borderColor: (theme) => theme.palette.divider,
          borderWidth: 1.5,
          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.16),
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
      {tiktokData?.videos?.data?.videos.length ? (
        <TopContentGrid topContents={tiktokData?.videos?.data?.videos} />
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
};
