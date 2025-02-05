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

  const topFiveContents = topContents.sort((a, b) => a?.like_count > b?.like_count).slice(0, 5);

  // const topFiveContents = [
  //   {
  //     comments_count: 3,
  //     like_count: 296,
  //     media_type: 'CAROUSEL_ALBUM',
  //     media_url:
  //       'https://scontent-sin11-2.cdninstagram.com/v/t51.2885-15/56823609_640283589752143_7817209799144819910_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ccb=1-7&_nc_sid=18de74&_nc_ohc=TRZLf_DlxtkQ7kNvgHEP8nj&_nc_zt=23&_nc_ht=scontent-sin11-2.cdninstagram.com&edm=AEQ6tj4EAAAA&oh=00_AYD2QD6m6DWJ2Kd9TTepGnGeWWNwQPrSkCKjt4qZeOidLQ&oe=67A94A96',
  //     id: '18056628766068743',
  //     caption: 'Asd',
  //   },
  // ];

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
          sm={4}
          key={index}
          component={m.div}
          variants={{
            hidden: { opacity: 0, y: 50 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <Box
            component="div"
            onClick={() => {
              const a = document.createElement('a');
              a.href = content?.permalink;
              a.target = '__blank';
              document.removeChild(a);
            }}
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
                background: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 45%, rgba(0, 0, 0, 0.70) 80%), url(${content.media_url}) lightgray 50% / cover no-repeat`,
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
                {`${content?.caption?.slice(0, 50)}...`}
              </Typography>

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

const MediaKitSocialContent = ({ instagram }) => {
  const { user } = useAuthContext();

  const instagramData = useSocialMediaData((state) => state.instagram);

  if (!user?.creator?.isFacebookConnected)
    return (
      <Label
        color="info"
        sx={{
          height: 250,
          textAlign: 'center',
          borderRadius: 1,
          borderStyle: 'dashed',
          borderWidth: 1.5,
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.16),
          width: 1,
        }}
      >
        <Stack spacing={1} alignItems="center">
          <Typography variant="subtitle1">Your instagram account is not connected.</Typography>
          <Button variant="contained" size="small">
            Connect Instagram
          </Button>
        </Stack>
      </Label>
    );

  return (
    <Box>
      {instagramData?.contents?.length ? (
        <TopContentGrid topContents={instagramData?.contents} />
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
  instagram: PropTypes.object,
};
