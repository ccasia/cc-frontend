import React from 'react';
import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import { Box, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { COLORS } from '../constants';

const fillSx = { width: 1, height: 1, borderRadius: 1, objectFit: 'cover' };

const MediaContent = ({ submission }) => {
  const video = submission?.video?.[0] ?? submission?.rawFootages?.[0];
  const photo = submission?.photos?.[0];

  if (video?.url)
    return <Box component="video" src={video.url} controls preload="metadata" sx={fillSx} />;
  if (photo?.url) return <Box component="img" src={photo.url} alt="" sx={fillSx} />;

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ ...fillSx, px: 1.5, bgcolor: 'common.white', border: `1px dashed ${COLORS.border}` }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: COLORS.surface }}
      >
        <Iconify icon="solar:cloud-upload-linear" width={22} sx={{ color: COLORS.muted }} />
      </Stack>
      <Typography
        textAlign="center"
        sx={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}
      >
        No upload yet
      </Typography>
      <Typography
        textAlign="center"
        sx={{ fontSize: 12, lineHeight: '16px', color: COLORS.textSecondary }}
      >
        Waiting for the creator to submit
      </Typography>
    </Stack>
  );
};

const MediaPreview = ({ submission }) => (
  <Box
    sx={{
      position: 'relative',
      width: 135,
      height: 240,
      flexShrink: 0,
      borderRadius: 1,
      overflow: 'hidden',
    }}
  >
    <AnimatePresence initial={false}>
      <m.div
        key={submission?.id}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <MediaContent submission={submission} />
      </m.div>
    </AnimatePresence>
  </Box>
);

export default MediaPreview;

MediaContent.propTypes = {
  submission: PropTypes.object,
};

MediaPreview.propTypes = {
  submission: PropTypes.object,
};
