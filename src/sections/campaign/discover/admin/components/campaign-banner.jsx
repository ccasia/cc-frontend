import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

const loadedSrcs = new Set();
const pendingSrcs = new Set();

export function preloadCampaignImages(srcs) {
  srcs.forEach((src) => {
    if (!src || loadedSrcs.has(src) || pendingSrcs.has(src)) return;
    pendingSrcs.add(src);
    const img = new window.Image();
    img.decoding = 'async';
    img.src = src;
    img
      .decode()
      .then(() => loadedSrcs.add(src))
      .catch(() => {})
      .finally(() => pendingSrcs.delete(src));
  });
}

function Banner({ src, alt }) {
  const imgRef = useRef(null);
  const [wasCached] = useState(() => loadedSrcs.has(src));
  const [loaded, setLoaded] = useState(wasCached);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img?.complete) return;
    if (img.naturalWidth > 0) loadedSrcs.add(src);
    else setFailed(true);
    setLoaded(true);
  }, [src]);

  return (
    <>
      {!loaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ position: 'absolute', inset: 0, width: 1, height: 1 }}
        />
      )}
      {failed ? (
        <Box sx={{ width: 1, height: 1, bgcolor: 'grey.200' }} />
      ) : (
        <Box
          component="img"
          ref={imgRef}
          src={src}
          alt={alt}
          decoding="async"
          onLoad={() => {
            loadedSrcs.add(src);
            setLoaded(true);
          }}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          sx={{
            display: 'block',
            width: 1,
            height: 1,
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: loaded ? 1 : 0,
            transition: wasCached ? 'none' : 'opacity 250ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      )}
    </>
  );
}

Banner.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
};

export default function CampaignBanner({ src, alt }) {
  return <Banner key={src} src={src} alt={alt} />;
}

CampaignBanner.propTypes = Banner.propTypes;
