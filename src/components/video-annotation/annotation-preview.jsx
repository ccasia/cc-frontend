import PropTypes from 'prop-types';

import { Box, Stack, Tooltip, Typography } from '@mui/material';

import AnnotationCanvas from './annotation-canvas';

const PREVIEW_HEIGHT = 200;
const PREVIEW_MAX_WIDTH = 300;
// Until the stored shape is known, assume a vertical (9:16) video
const FALLBACK_ASPECT = 9 / 16;

// The drawn frame with its drawing on top. The frame is a paused <video> seeked by a media
// fragment (#t=), so nothing reads its pixels and the bucket needs no CORS setup.
function AnnotationPreview({ annotation, videoUrl }) {
  const aspect = annotation.canvas?.aspect || FALLBACK_ASPECT;
  const width = Math.min(PREVIEW_MAX_WIDTH, Math.round(PREVIEW_HEIGHT * aspect));
  const height = Math.round(width / aspect);
  const seconds = (annotation.frameTimeMs / 1000).toFixed(3);

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: '#000',
      }}
    >
      {videoUrl && (
        <Box
          component="video"
          src={`${videoUrl}#t=${seconds}`}
          muted
          playsInline
          preload="auto"
          sx={{
            position: 'absolute',
            inset: 0,
            width: 1,
            height: 1,
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      )}
      <AnnotationCanvas shapes={annotation.shapes || []} aspect={aspect} />
    </Box>
  );
}

AnnotationPreview.propTypes = {
  annotation: PropTypes.object.isRequired,
  videoUrl: PropTypes.string,
};

/**
 * Hovering a drawn comment's timestamp previews the drawing on its frame. Renders the
 * child as-is when there's no drawing. The preview mounts only while open, so the video
 * only loads on hover.
 */
export default function AnnotationPreviewTooltip({ annotation, videoUrl, children }) {
  if (!annotation) return children;

  return (
    <Tooltip
      placement="top"
      enterDelay={200}
      enterNextDelay={200}
      disableInteractive
      componentsProps={{
        tooltip: { sx: { p: 0.75, maxWidth: 'none', bgcolor: '#111113', borderRadius: 1.25 } },
      }}
      title={
        <Stack gap={0.75}>
          <AnnotationPreview annotation={annotation} videoUrl={videoUrl} />
          <Typography sx={{ fontSize: 11.5, color: '#A0A0A8', textAlign: 'center' }}>
            Click to show it on the video
          </Typography>
        </Stack>
      }
    >
      {children}
    </Tooltip>
  );
}

AnnotationPreviewTooltip.propTypes = {
  annotation: PropTypes.object,
  videoUrl: PropTypes.string,
  children: PropTypes.element.isRequired,
};
