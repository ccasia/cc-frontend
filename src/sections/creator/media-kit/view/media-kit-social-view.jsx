import React from 'react';
import PropTypes from 'prop-types';

import { Box, CircularProgress } from '@mui/material';

import MediaKitSocialContentTiktok from '../view-tiktok';
import MediaKitPartnership from '../medit-kit-partnerships';
import MediaKitSocialContentInstagram from '../view-instagram';

const MediaKitSocial = ({ currentTab, data, isLoading }) => {
  if (isLoading) {
    return (
      <Box textAlign="center">
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        [`& .Mui-selected`]: {
          bgcolor: (theme) => theme.palette.background.paper,
          borderRadius: 1.5,
        },
      }}
    >
      {currentTab === 'instagram' && <MediaKitSocialContentInstagram instagram={data?.instagram} />}
      {currentTab === 'tiktok' && <MediaKitSocialContentTiktok tiktok={data?.tiktok} />}
      {currentTab === 'partnerships' && <MediaKitPartnership />}
    </Box>
  );
};

export default MediaKitSocial;

MediaKitSocial.propTypes = {
  currentTab: PropTypes.string.isRequired,
  data: PropTypes.object,
  isLoading: PropTypes.bool,
};
