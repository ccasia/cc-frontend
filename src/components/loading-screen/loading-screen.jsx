import PropTypes from 'prop-types';
import { useRef, useLayoutEffect } from 'react';

import Box from '@mui/material/Box';
import { keyframes } from '@mui/system';

const SIZE = 36;
const STROKE = 3.2;

const appear = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const dash = keyframes`
  0% { stroke-dasharray: 1 200; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90 200; stroke-dashoffset: -30; }
  100% { stroke-dasharray: 90 200; stroke-dashoffset: -124; }
`;

export default function LoadingScreen({ instant = false, sx, ...other }) {
  const ringRef = useRef(null);

  // Lock the loop to the page clock so every ring, including the HTML boot ring, spins in phase.
  useLayoutEffect(() => {
    ringRef.current
      ?.getAnimations?.({ subtree: true })
      .filter((animation) => animation.effect?.getTiming().iterations === Infinity)
      .forEach((animation) => {
        animation.startTime = 0;
      });
  }, []);

  return (
    <Box
      sx={{
        px: 5,
        width: 1,
        flexGrow: 1,
        minHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      <Box
        ref={ringRef}
        role="progressbar"
        aria-label="Loading"
        sx={{
          width: SIZE,
          height: SIZE,
          color: 'text.primary',
          ...(!instant && {
            animation: `${appear} 300ms cubic-bezier(0.23, 1, 0.32, 1) 150ms both`,
            '@media (prefers-reduced-motion: reduce)': {
              animation: `${appear} 300ms ease 150ms both`,
              transform: 'none',
            },
          }),
        }}
      >
        <Box
          component="svg"
          viewBox="22 22 44 44"
          sx={{
            display: 'block',
            width: 1,
            height: 1,
            animation: `${spin} 0.8s linear infinite`,
          }}
        >
          <circle
            cx="44"
            cy="44"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            opacity={0.12}
          />
          <Box
            component="circle"
            cx="44"
            cy="44"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            sx={{
              strokeDasharray: '80 200',
              animation: `${dash} 1.4s cubic-bezier(0.77, 0, 0.175, 1) infinite`,
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

LoadingScreen.propTypes = {
  instant: PropTypes.bool,
  sx: PropTypes.object,
};
