import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import Iconify from 'src/components/iconify';

import { CC } from './creator-field-tokens';
import { embedFromPostUrl } from './post-thumb-url';

const TILE_W = 40;
const TILE_H = 54;
const FRAME_W = 326;

/**
 * A 9:16 preview of the post, loaded from the public embed for that link.
 * The iframe is clipped and scaled. Clicks pass through to the row link.
 */

export default function PostThumb({ postUrl }) {
  const embed = embedFromPostUrl(postUrl);
  const scale = TILE_W / FRAME_W;

  return (
    <Box
      aria-hidden
      sx={{
        width: TILE_W,
        height: TILE_H,
        flexShrink: 0,
        borderRadius: '6px',
        overflow: 'hidden',
        bgcolor: CC.light25,
        border: `1px solid ${CC.light100}`,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Iconify icon="solar:play-bold" width={12} sx={{ color: CC.grey50 }} />
      </Box>
      {embed && (
        <Box
          component="iframe"
          src={embed}
          title=""
          loading="lazy"
          tabIndex={-1}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            border: 0,
            pointerEvents: 'none',
            width: FRAME_W,
            height: TILE_H / scale,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      )}
    </Box>
  );
}

PostThumb.propTypes = {
  postUrl: PropTypes.string,
};
