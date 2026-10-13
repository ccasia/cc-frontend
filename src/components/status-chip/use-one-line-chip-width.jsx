import { useRef, useState, useLayoutEffect } from 'react';

import { Box } from '@mui/material';

import { statusChipSx } from './styles';

// ----------------------------------------------------------------------

/**
 * Sizes a status column to its widest label on one line. Returns [width, sizer]: render the
 * sizer anywhere (it's hidden); it holds one-line copies of the labels and measures them.
 *
 * Give the column's header that width (content-box, so cell padding is added on top). A set width
 * lets the column fit its chips exactly instead of taking a share of the spare space, and the
 * table still shrinks it (wrapping `wrap` chips) once the other columns are at their minimum.
 */
export default function useOneLineChipWidth(labels) {
  const sizerRef = useRef(null);
  const [width, setWidth] = useState(null);
  const labelsKey = labels.join('|');

  useLayoutEffect(() => {
    const chips = Array.from(sizerRef.current?.children || []);
    if (chips.length === 0) {
      setWidth(null);
      return undefined;
    }

    const measure = () => setWidth(Math.ceil(Math.max(...chips.map((chip) => chip.offsetWidth))));

    measure();
    // Picks up the font size step at the sm breakpoint and web fonts finishing loading.
    const observer = new ResizeObserver(measure);
    chips.forEach((chip) => observer.observe(chip));
    return () => observer.disconnect();
  }, [labelsKey]);

  const sizer = (
    <Box
      ref={sizerRef}
      aria-hidden
      sx={{
        position: 'absolute',
        height: 0,
        overflow: 'hidden',
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {labels.map((label) => (
        <Box
          key={label}
          sx={{
            ...statusChipSx('transparent'),
            display: 'block',
            width: 'max-content',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Box>
      ))}
    </Box>
  );

  return [width, sizer];
}
