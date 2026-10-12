import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import { Box, Stack, Typography, ButtonBase } from '@mui/material';

import Iconify from 'src/components/iconify';

import { COLORS, EASE_OUT, HOVER_MEDIA, EASE_OUT_CSS } from '../constants';

const fillSx = { width: 1, height: 1, borderRadius: 1, objectFit: 'cover' };

const mediaSx = { ...fillSx, display: 'block' };

const PlayBadge = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 40,
      height: 40,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      bgcolor: 'rgba(0, 0, 0, 0.48)',
      pointerEvents: 'none',
    }}
  >
    <Iconify icon="solar:play-bold" width={18} sx={{ color: 'common.white', ml: 0.25 }} />
  </Stack>
);

const StateTile = ({ icon, title, subtitle }) => (
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
      <Iconify icon={icon} width={22} sx={{ color: COLORS.muted }} />
    </Stack>
    <Typography
      textAlign="center"
      sx={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}
    >
      {title}
    </Typography>
    <Typography
      textAlign="center"
      sx={{ fontSize: 12, lineHeight: '16px', color: COLORS.textSecondary }}
    >
      {subtitle}
    </Typography>
  </Stack>
);

const FirstFrame = ({ url }) => (
  // No thumbnail: show the first frame only, without a player
  <Box
    component="video"
    src={`${url}#t=0.1`}
    muted
    playsInline
    preload="metadata"
    tabIndex={-1}
    sx={{ ...mediaSx, pointerEvents: 'none' }}
  />
);

const MediaContent = ({ submission }) => {
  // Remounts per submission (keyed in MediaPreview), so a failed URL never carries over
  const [failedUrl, setFailedUrl] = useState(null);
  const video = submission?.video?.[0] ?? submission?.rawFootages?.[0];
  const photo = submission?.photos?.[0];

  // The creator uploaded, but the file is still being processed
  if (video && !video.url)
    return (
      <StateTile
        icon="solar:refresh-circle-linear"
        title="Processing upload"
        subtitle="It will show here once it's ready"
      />
    );

  if (video?.url) {
    const thumbnailUrl = video.thumbnailUrl !== failedUrl ? video.thumbnailUrl : null;
    return (
      <>
        {thumbnailUrl ? (
          <Box
            component="img"
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(thumbnailUrl)}
            sx={mediaSx}
          />
        ) : (
          <FirstFrame url={video.url} />
        )}
        <PlayBadge />
      </>
    );
  }

  if (photo?.url && photo.url === failedUrl)
    return (
      <StateTile
        icon="solar:gallery-linear"
        title="Preview unavailable"
        subtitle="Open the submission to try again"
      />
    );

  if (photo?.url)
    return (
      <Box
        component="img"
        src={photo.url}
        alt=""
        loading="lazy"
        onError={() => setFailedUrl(photo.url)}
        sx={mediaSx}
      />
    );

  return (
    <StateTile
      icon="solar:cloud-upload-linear"
      title="No upload yet"
      subtitle="Waiting for the creator to submit"
    />
  );
};

const MediaPreview = ({ submission, disabled, onClick }) => (
  <ButtonBase
    disabled={disabled}
    onClick={onClick}
    aria-label="View submission"
    sx={{
      position: 'relative',
      width: 135,
      height: 240,
      flexShrink: 0,
      borderRadius: 1,
      overflow: 'hidden',
      transition: `transform 160ms ${EASE_OUT_CSS}`,
      '&:active': { transform: 'scale(0.97)' },
      '& img, & video': { transition: 'opacity 150ms ease' },
      [HOVER_MEDIA]: { '&:hover img, &:hover video': { opacity: 0.88 } },
    }}
  >
    <AnimatePresence initial={false}>
      <m.div
        key={submission?.id}
        initial={{ opacity: 0, transform: 'scale(0.97)', filter: 'blur(2px)' }}
        animate={{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(2px)' }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <MediaContent submission={submission} />
      </m.div>
    </AnimatePresence>
  </ButtonBase>
);

export default MediaPreview;

StateTile.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
};

FirstFrame.propTypes = {
  url: PropTypes.string.isRequired,
};

MediaContent.propTypes = {
  submission: PropTypes.object,
};

MediaPreview.propTypes = {
  submission: PropTypes.object,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};
