import PropTypes from 'prop-types';
import { useRef, useState, useLayoutEffect } from 'react';

import { Box } from '@mui/material';

import { statusChipSx, EMPTY_CHIP_SX } from './styles';

// ----------------------------------------------------------------------

/**
 * Status chip shared by the Agreements tab and the master lists.
 *
 * - `color` sets the text and border; `borderColor` overrides the border alone.
 * - `empty` renders the dashed "not set" placeholder instead.
 * - Content stays on one line, laid out in a row so icons can sit beside the label. Pass `wrap`
 *   to let a text-only label wrap inside a narrow column (see WrappingChip).
 */
export default function StatusChip({ color, borderColor, empty, wrap, children, sx, ...other }) {
  const baseSx = empty ? EMPTY_CHIP_SX : statusChipSx(color);

  if (wrap && !empty) {
    return (
      <WrappingChip color={color} borderColor={borderColor} sx={sx} {...other}>
        {children}
      </WrappingChip>
    );
  }

  return (
    <Box
      sx={{
        ...baseSx,
        ...(borderColor && { borderColor }),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        whiteSpace: 'nowrap',
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

StatusChip.propTypes = {
  color: PropTypes.string,
  borderColor: PropTypes.string,
  empty: PropTypes.bool,
  wrap: PropTypes.bool,
  children: PropTypes.node,
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

// A chip whose label wraps stretches to the whole cell width, leaving empty space beside its
// lines. Capping its width would also cap the column, so it could never widen and unwrap again.
// Instead the chip's own box keeps its natural size (column sizing is untouched), the visible
// frame is drawn behind the text at the longest line's width, and the chip is shifted left so the
// frame starts at the cell's left edge like the single-line chips.
function WrappingChip({ color, borderColor, children, sx, ...other }) {
  const textRef = useRef(null);
  // { frameWidth, shift } while wrapped, otherwise null (the frame just fills the chip).
  const [wrap, setWrap] = useState(null);

  useLayoutEffect(() => {
    const textEl = textRef.current;
    const chipEl = textEl?.parentElement;
    if (!textEl || !chipEl) return undefined;

    const measure = () => {
      // An inline span reports one rect per line it occupies.
      const lines = Array.from(textEl.getClientRects());
      if (lines.length < 2) {
        setWrap(null);
        return;
      }

      const style = window.getComputedStyle(chipEl);
      const longestLine = Math.ceil(Math.max(...lines.map((line) => line.width)));
      const frameWidth =
        longestLine +
        parseFloat(style.paddingLeft) +
        parseFloat(style.paddingRight) +
        parseFloat(style.borderLeftWidth) +
        parseFloat(style.borderRightWidth);

      setWrap({ frameWidth, shift: (chipEl.offsetWidth - frameWidth) / 2 });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(chipEl);
    return () => observer.disconnect();
  }, [children]);

  return (
    <Box
      sx={{
        ...statusChipSx(color),
        position: 'relative',
        isolation: 'isolate',
        // Keep the border widths for layout, but let the frame below do the drawing.
        borderColor: 'transparent',
        bgcolor: 'transparent',
        // A transform moves what's drawn without changing the layout the table sizes from.
        transform: wrap ? `translateX(-${wrap.shift}px)` : 'none',
        ...sx,
      }}
      {...other}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          zIndex: -1,
          top: -1,
          bottom: -3,
          left: '50%',
          transform: 'translateX(-50%)',
          width: wrap ? `${wrap.frameWidth}px` : 'calc(100% + 2px)',
          border: '1px solid',
          borderBottom: '3px solid',
          borderColor: borderColor || color,
          borderRadius: 0.8,
          bgcolor: 'white',
        }}
      />
      <span ref={textRef}>{children}</span>
    </Box>
  );
}

WrappingChip.propTypes = {
  color: PropTypes.string,
  borderColor: PropTypes.string,
  children: PropTypes.node,
  sx: PropTypes.object,
};
