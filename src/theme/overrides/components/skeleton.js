import { alpha, keyframes } from '@mui/material/styles';

// ----------------------------------------------------------------------

// Same sweep as the HTML boot frame in index.html, so the hand-off has no visible jump.
const shimmer = keyframes`
  0% { transform: translateX(100%); }
  60%, 100% { transform: translateX(-100%); }
`;

// Reduced motion keeps a sign of loading, without movement.
const pulse = keyframes`
  from { opacity: 1; }
  to { opacity: 0.6; }
`;

export function skeleton(theme) {
  const highlight =
    theme.palette.mode === 'light'
      ? 'rgba(255, 255, 255, 0.6)'
      : alpha(theme.palette.grey[500], 0.12);

  return {
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.background.neutral,
        },
        rounded: {
          borderRadius: theme.shape.borderRadius * 2,
        },
        wave: {
          '&::after': {
            transform: 'translateX(100%)',
            background: `linear-gradient(90deg, transparent, ${highlight}, transparent)`,
            animation: `${shimmer} 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite`,
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: `${pulse} 2s ease-in-out infinite alternate`,
            '&::after': { display: 'none' },
          },
        },
      },
    },
  };
}
