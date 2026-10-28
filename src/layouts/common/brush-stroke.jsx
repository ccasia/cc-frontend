import { useId } from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const draw = keyframes`
  from { stroke-dashoffset: 1.05; }
  to { stroke-dashoffset: 0; }
`;

const toPath = (points) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');

// Paints a filled brush SVG along its stroke: a thick guide line drawn from start
// to end masks the brush, so the texture appears in the order it was painted.
export default function BrushStroke({ brush, sx }) {
  const maskId = `brush-${useId().replace(/:/g, '')}`;
  const { src, width, height, guide, guideWidth } = brush;

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      sx={{ display: 'block', overflow: 'visible', pointerEvents: 'none', ...sx }}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
        <Box
          component="path"
          d={toPath(guide)}
          fill="none"
          stroke="#fff"
          strokeWidth={guideWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 2"
          sx={{
            animation: `${draw} 1200ms cubic-bezier(0.45, 0, 0.25, 1) 300ms both`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
      </mask>
      <image
        href={src}
        width={width}
        height={height}
        preserveAspectRatio="none"
        mask={`url(#${maskId})`}
      />
    </Box>
  );
}

BrushStroke.propTypes = {
  brush: PropTypes.shape({
    src: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    guide: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    guideWidth: PropTypes.number,
  }),
  sx: PropTypes.object,
};
