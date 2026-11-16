import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Skeleton } from '@mui/material';

import CtaButton from 'src/components/cta-button';

import { COLORS, MIN_CARD_WIDTH } from '../utils/constants';

// Bones darker than the default, so they show on the grey card.
const Bone = ({ sx, ...other }) => (
  <Skeleton sx={{ bgcolor: 'rgba(145, 158, 171, 0.2)', flexShrink: 0, ...sx }} {...other} />
);

Bone.propTypes = { sx: PropTypes.object };

// A text bar that keeps its line's real height.
const Line = ({ width, height, barHeight = 12 }) => (
  <Box sx={{ height, display: 'flex', alignItems: 'center' }}>
    <Bone width={width} height={barHeight} sx={{ borderRadius: 0.5 }} />
  </Box>
);

Line.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.number,
  barHeight: PropTypes.number,
};

const Item = ({ selected }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{
      height: 60,
      px: 1.5,
      borderRadius: 1,
      ...(selected && { bgcolor: 'common.white', border: `1px solid ${COLORS.border}` }),
    }}
  >
    <Stack>
      <Line width={56} height={20} />
      <Line width={112} height={16} barHeight={10} />
    </Stack>
    <Bone width={64} height={24} sx={{ borderRadius: '100px' }} />
  </Stack>
);

Item.propTypes = { selected: PropTypes.bool };

const CreatorSubmissionCardSkeleton = () => (
  <Stack
    spacing={2}
    sx={{
      px: 2.5,
      py: 2,
      borderRadius: 1.5,
      bgcolor: COLORS.surface,
      border: 1,
      borderColor: 'divider',
      containerType: 'inline-size',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Bone variant="circular" width={40} height={40} />
      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" columnGap={2}>
          <Line width={104} height={20} barHeight={14} />
          <Line width={88} height={20} />
        </Stack>
        <Stack direction="row" justifyContent="space-between" columnGap={2}>
          <Line width={80} height={16} barHeight={10} />
          <Bone width={20} height={4} sx={{ borderRadius: 1, mt: 0.5 }} />
        </Stack>
      </Stack>
    </Stack>

    <Stack
      direction="row"
      alignItems="flex-start"
      gap={2}
      sx={{
        minHeight: 240,
        [`@container (max-width: ${MIN_CARD_WIDTH - 1}px)`]: { flexDirection: 'column' },
      }}
    >
      <Bone width={135} height={240} sx={{ borderRadius: 1 }} />
      <Stack sx={{ flexGrow: 1, minWidth: 0, alignSelf: 'stretch' }}>
        <Item selected />
        <Item />
      </Stack>
    </Stack>

    <Stack sx={{ height: 64 }}>
      <Line width="100%" height={20} />
      <Line width="60%" height={20} />
    </Stack>

    <CtaButton variant="dark" tabIndex={-1} aria-hidden fullWidth sx={{ pointerEvents: 'none' }}>
      View submission
    </CtaButton>
  </Stack>
);

export default CreatorSubmissionCardSkeleton;
