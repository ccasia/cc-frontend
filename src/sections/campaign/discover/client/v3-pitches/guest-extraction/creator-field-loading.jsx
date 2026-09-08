import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import {
  CC,
  fieldSx,
  FIELD_HEIGHT,
  FIELD_RADIUS,
  SHIMMER_DURATION_MS,
  SPINNER_DURATION_MS,
} from './creator-field-tokens';

/**
 * The loading state for a metric field while a fetch runs.
 *
 * It replaces the input inside the same 52px slot, so the row never changes
 * height. With reduced motion it shows a static placeholder instead of the
 * shimmer and the spinner.
 */

const shimmer = keyframes`
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export default function CreatorFieldLoading({
  label = 'Fetching creator details',
  showSpinner = false,
  height,
}) {
  // Respect the viewer's motion setting. No shimmer, no spin.
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <Box
      data-testid="creator-field-loading"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      role="status"
      sx={{
        ...fieldSx,
        width: '100%',
        gap: '10px',
        // The field keeps its white shell while it loads. Only the bar moves.
        backgroundColor: '#FFFFFF',
        // The skeleton has to match the field it stands in for, and the two
        // modals size their fields differently. Absent keeps the token.
        ...(height ? { height, minHeight: height } : null),
      }}
    >
      <Box
        data-testid="creator-field-shimmer"
        sx={{
          flex: 1,
          height: '12px',
          borderRadius: '9999px',
          ...(reducedMotion
            ? // Static placeholder in the same brand blue.
              { backgroundColor: CC.blue100 }
            : {
                background: `linear-gradient(90deg, ${CC.light200} 0%, ${CC.blue100} 50%, ${CC.light200} 100%)`,
                backgroundSize: '600px 100%',
                animation: `${shimmer} ${SHIMMER_DURATION_MS}ms linear infinite`,
              }),
        }}
      />

      {showSpinner && (
        <Box
          data-testid="creator-field-spinner"
          sx={{
            width: '16px',
            height: '16px',
            flexShrink: 0,
            borderRadius: '50%',
            border: `2px solid ${CC.blue100}`,
            borderTopColor: CC.blue500,
            ...(reducedMotion
              ? {}
              : { animation: `${spin} ${SPINNER_DURATION_MS}ms linear infinite` }),
          }}
        />
      )}
    </Box>
  );
}

CreatorFieldLoading.propTypes = {
  /** What is loading, announced to a screen reader. */
  label: PropTypes.string,
  /** Show the spinner beside the bar. Every fetching field shows one. */
  showSpinner: PropTypes.bool,
  /** Match a field taller than the token, as the platform modal's 52px. */
  height: PropTypes.number,
};

export { FIELD_HEIGHT, FIELD_RADIUS };
