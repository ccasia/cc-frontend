import PropTypes from 'prop-types';
import { useRef, useEffect } from 'react';

import { Box, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

export default function VideoPreviewTile({
  url,
  playing = false,
  onToggle,
  collapsedWidth = 72,
  expandedWidth = 220,
}) {
  const videoRef = useRef(null);
  const width = playing ? expandedWidth : collapsedWidth;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [playing]);

  if (!url) {
    return (
      <Box
        sx={{
          width: collapsedWidth,
          aspectRatio: '9 / 16',
          borderRadius: 1.5,
          bgcolor: 'background.neutral',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          No video
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        aspectRatio: '9 / 16',
        borderRadius: 1.5,
        overflow: 'hidden',
        cursor: 'pointer',
        bgcolor: 'common.black',
        transition: (theme) =>
          theme.transitions.create('width', {
            duration: theme.transitions.duration.shorter,
          }),
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        src={url}
        controls={playing}
        preload="metadata"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: playing ? 'auto' : 'none',
        }}
      />

      {/* Collapse affordance while playing — click the corner to shrink. */}
      {playing && (
        <Box
          onClick={() => onToggle?.()}
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <Iconify icon="mdi:close" width={16} color="common.white" />
        </Box>
      )}

      {!playing && (
        <Box
          onClick={() => onToggle?.()}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.25)',
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="mdi:play" width={18} color="common.white" />
          </Box>
        </Box>
      )}
    </Box>
  );
}

VideoPreviewTile.propTypes = {
  url: PropTypes.string,
  playing: PropTypes.bool,
  onToggle: PropTypes.func,
  collapsedWidth: PropTypes.number,
  expandedWidth: PropTypes.number,
};
