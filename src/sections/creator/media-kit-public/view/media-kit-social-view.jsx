import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import MediaKitSocialContentTiktok from '../view-tiktok';
import MediaKitPartnership from '../medit-kit-partnerships';
import MediaKitSocialContentInstagram from '../view-instagram';

const MediaKitSocial = ({ currentTab, data, sx, className, forceDesktop = false }) => (
  <Box
    sx={{
      borderRadius: 2,
      [`& .Mui-selected`]: {
        bgcolor: (theme) => theme.palette.background.paper,
        borderRadius: 1.5,
      },
      mb: 8,
      pb: 4,
      ...sx,
    }}
    className={className}
  >
    {currentTab === 'instagram' && (
      <MediaKitSocialContentInstagram
        instagramVideos={data?.creator?.instagramUser?.instagramVideo}
        forceDesktop={forceDesktop}
      />
    )}
    {currentTab === 'tiktok' && (
      <MediaKitSocialContentTiktok 
      tiktokVideos={data?.creator?.tiktokUser?.tiktokVideo} 
      forceDesktop={forceDesktop} />
    )}
    {currentTab === 'partnerships' && <MediaKitPartnership />}
  </Box>
);

export default MediaKitSocial;

MediaKitSocial.propTypes = {
  currentTab: PropTypes.string.isRequired,
  data: PropTypes.object,
  sx: PropTypes.object,
  className: PropTypes.string,
  forceDesktop: PropTypes.bool,
};
