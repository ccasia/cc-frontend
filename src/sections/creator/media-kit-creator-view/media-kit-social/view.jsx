import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack } from '@mui/material';

import MediaKitAnalytics from './media-kit-analytic/view';
import MediaKitSocialContent from './media-kit-social-content/view';

const MediaKitSocial = ({ currentTab }) => (
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
        <MediaKitSocialContent />
        <MediaKitAnalytics />
      </Stack>
    )}
    {currentTab === 'tiktok' }
    {currentTab === 'partnership'}
  </Box>
);

export default MediaKitSocial;

MediaKitSocial.propTypes = {
  currentTab: PropTypes.string.isRequired,
};
