import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';

// The click that navigates marks the direction, so only that navigation animates;
// a refresh, a direct link or the browser Back button shows the page as-is.
// `source` lets a part animate only for some entries, e.g. a header that stays put
// between two pages but is new when coming from a list.
let pending = null;

export function markPageEnter(direction, source) {
  pending = { direction, source, at: Date.now() };
}

// Long enough for a lazy route chunk to load, short enough that a stale mark never fires.
const MARK_TTL_MS = 3000;

const enter = (x) => keyframes`
  from { opacity: 0; transform: translateX(${x}px); }
  to { opacity: 1; transform: none; }
`;

// Pages move 12px. Tabs are switched far more often, so they move less and finish sooner.
const SIZES = {
  page: { forward: enter(12), back: enter(-12), duration: 240, fade: 200 },
  small: { forward: enter(8), back: enter(-8), duration: 200, fade: 150 },
};

const fade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

export default function PageEnter({ source, size = 'page', children, sx }) {
  const [direction] = useState(() => {
    if (!pending || Date.now() - pending.at >= MARK_TTL_MS) return null;
    if (source && pending.source !== source) return null;
    return pending.direction;
  });

  useEffect(() => {
    pending = null;
  }, []);

  const motion = SIZES[size];

  return (
    <Box
      sx={{
        ...(direction && {
          animation: `${motion[direction]} ${motion.duration}ms ${EASE_OUT} both`,
          '@media (prefers-reduced-motion: reduce)': {
            animation: `${fade} ${motion.fade}ms ease-out both`,
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

PageEnter.propTypes = {
  source: PropTypes.string,
  size: PropTypes.oneOf(['page', 'small']),
  children: PropTypes.node,
  sx: PropTypes.object,
};
