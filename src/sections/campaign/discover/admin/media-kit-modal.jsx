import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Stack, Dialog } from '@mui/material';

import Iconify from 'src/components/iconify';

import MediaKit from 'src/sections/creator/media-kit-general/mediakit-view';

const MediaKitModal = ({ open, handleClose, creatorId }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggle = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" fullScreen={isFullScreen}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        p={2}
        sx={{
          position: 'absolute',
          right: 10,
          top: 10,
        }}
      >
        <Box
          component="div"
          onClick={toggle}
          sx={{
            zIndex: 1111,
            cursor: 'pointer',
            '&:hover': {
              color: (theme) => theme.palette.grey[600],
            },
          }}
        >
          {isFullScreen ? (
            <Iconify icon="akar-icons:reduce" />
          ) : (
            <Iconify icon="akar-icons:enlarge" />
          )}
        </Box>
        <Box
          component="div"
          onClick={handleClose}
          sx={{
            zIndex: 1111,
            cursor: 'pointer',
            '&:hover': {
              color: (theme) => theme.palette.grey[600],
            },
          }}
        >
          <Iconify icon="ion:close" />
        </Box>
      </Stack>
      <MediaKit id={creatorId} noBigScreen setIsFullScreen />
    </Dialog>
  );
};

export default MediaKitModal;

MediaKitModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  creatorId: PropTypes.string,
};
