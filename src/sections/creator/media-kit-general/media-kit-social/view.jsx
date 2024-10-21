import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack } from '@mui/material';

import MediaKitAnalytics from './media-kit-analytic/view';
import MediaKitSocialContentTiktok from '../../media-kit-creator-view/media-kit-social/media-kit-social-content/view-tiktok-by-id';
import MediaKitSocialContentInstagram from '../../media-kit-creator-view/media-kit-social/media-kit-social-content/view-instagram-by-id';

const MediaKitSocial = ({ currentTab, user }) => (
  <Box
    sx={{
      border: (theme) => `dashed 1px ${theme.palette.divider}`,
      borderRadius: 2,
      my: 5,
      p: 2,
      [`& .Mui-selected`]: {
        bgcolor: (theme) => theme.palette.background.paper,
        borderRadius: 1.5,
      },
    }}
  >
    {/* <h1>dawdaw</h1> */}
    {currentTab === 'instagram' && (
      <Stack gap={4}>
        <MediaKitSocialContentInstagram user={user} />
        <MediaKitAnalytics />
      </Stack>
    )}
    {currentTab === 'tiktok' && (
      <Stack gap={4}>
        <MediaKitSocialContentTiktok user={user} />
        <MediaKitAnalytics />
      </Stack>
    )}
    {currentTab === 'partnership'}
  </Box>
);

export default MediaKitSocial;

MediaKitSocial.propTypes = {
  currentTab: PropTypes.string.isRequired,
  user: PropTypes.object,
};
