import PropTypes from 'prop-types';

import { Box, Stack } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// Renders 5 stars for a numeric rating, showing a half star when the fractional
// part is in [.3, .8) (e.g. 4.5 -> 4 full + 1 half; 4.25 -> 4 full). A fraction
// of .8 or above rounds the fractional star up to a full star.
export default function StarRating({ value, activeColor, emptyColor, width, sx }) {
  const fraction = value - Math.floor(value);
  const fullStars = Math.floor(value);
  const hasHalf = fraction >= 0.3 && fraction < 0.8;
  const roundedUpFull = fraction >= 0.8 ? fullStars + 1 : fullStars;

  return (
    <Stack direction="row" spacing={0.25} sx={sx}>
      {[1, 2, 3, 4, 5].map((star) => {
        if (star <= roundedUpFull) {
          return (
            <Iconify
              key={star}
              icon="material-symbols:star-rounded"
              width={width}
              sx={{ color: activeColor }}
            />
          );
        }
        // Half star: a base star in emptyColor (right/white half) with a gold
        // star clipped to its left half laid on top — no gold outline bleeds to
        // the right side.
        if (hasHalf && star === fullStars + 1) {
          return (
            <Box key={star} sx={{ position: 'relative', width, height: width, flexShrink: 0 }}>
              <Iconify
                icon="material-symbols:star-rounded"
                width={width}
                sx={{ color: emptyColor, position: 'absolute', top: 0, left: 0 }}
              />
              <Iconify
                icon="material-symbols:star-rounded"
                width={width}
                sx={{
                  color: activeColor,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  clipPath: 'inset(0 50% 0 0)',
                }}
              />
            </Box>
          );
        }
        return (
          <Iconify
            key={star}
            icon="material-symbols:star-rounded"
            width={width}
            sx={{ color: emptyColor }}
          />
        );
      })}
    </Stack>
  );
}

StarRating.propTypes = {
  value: PropTypes.number.isRequired,
  activeColor: PropTypes.string.isRequired,
  emptyColor: PropTypes.string.isRequired,
  width: PropTypes.number,
  sx: PropTypes.object,
};

StarRating.defaultProps = {
  width: 20,
  sx: undefined,
};
