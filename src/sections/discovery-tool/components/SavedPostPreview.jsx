import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import { Box } from '@mui/material';

import Iconify from 'src/components/iconify';

import { embedFromPostUrl } from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/post-thumb-url';

export default function SavedPostPreview({ thumbnailUrl, postUrl }) {
  const container = useRef(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const [size, setSize] = useState({ width: 142, height: 214 });
  const embed = embedFromPostUrl(postUrl);
  const imageAvailable = thumbnailUrl && failedUrl !== thumbnailUrl;
  const scale = size.width / 326;

  useEffect(() => {
    if (!container.current || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={container} sx={{ position: 'relative', width: 1, height: 1, overflow: 'hidden', bgcolor: '#EBEBEB' }}>
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Iconify icon="mdi:image-outline" width={24} color="#8E8E93" />
      </Box>
      {imageAvailable ? <Box component="img" src={thumbnailUrl} alt="Saved post thumbnail" loading="lazy"
        onError={() => setFailedUrl(thumbnailUrl)} sx={{ position: 'relative', width: 1, height: 1, objectFit: 'cover' }} />
        : embed && <Box component="iframe" src={embed} title="Saved post preview" loading="lazy" tabIndex={-1}
          sx={{ position: 'absolute', top: 0, left: 0, border: 0, width: 326, height: size.height / scale,
            transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }} />}
    </Box>
  );
}
SavedPostPreview.propTypes = { thumbnailUrl: PropTypes.string, postUrl: PropTypes.string };
