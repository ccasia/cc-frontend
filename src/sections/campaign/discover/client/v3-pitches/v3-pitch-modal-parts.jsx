import PropTypes from 'prop-types';

import { Box, Stack, Divider, Typography } from '@mui/material';

// Presentational pieces for the V3 pitch modal. They live here so the modal
// itself stops carrying six copies of the same stat tile.

export const ONYX = '#231F20';
export const MUTED = '#8E8E93';
export const LINE = '#EBEBEB';

export const LABEL_SX = { fontSize: 12, lineHeight: '16px', fontWeight: 600, color: MUTED };
export const TAG_SX = {
  fontSize: 12,
  lineHeight: '16px',
  fontWeight: 600,
  color: MUTED,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};
export const VALUE_SX = { fontSize: 16, lineHeight: '20px', fontWeight: 600, color: ONYX };
export const CAPTION_SX = { fontSize: 12, lineHeight: '16px', fontWeight: 500, color: MUTED };

// The repeated "raised card" edge: white, hairline border, 3px inset bottom.
export const RAISED = {
  bgcolor: '#FFFFFF',
  border: `1px solid ${LINE}`,
  boxShadow: 'inset 0px -3px 0px #E7E7E7',
  borderRadius: '6px',
};

// The same three assets the mobile pitch modal uses, so both modals match.
export const STAT_ICONS = {
  followers: '/assets/icons/overview/purpleGroup.svg',
  engagement: '/assets/icons/overview/greenChart.svg',
  likes: '/assets/icons/overview/bubbleHeart.svg',
};

export const VDivider = ({ height, compact }) => (
  <Divider
    orientation="vertical"
    flexItem
    sx={{ mx: compact ? '8px' : '16px', height, alignSelf: 'center', borderColor: LINE }}
  />
);

VDivider.propTypes = { height: PropTypes.number, compact: PropTypes.bool };

/** One Language or Interest chip. */
export const TagChip = ({ label }) => (
  <Box sx={{ ...RAISED, display: 'inline-flex', alignItems: 'center', p: '6px 6px 9px 8px' }}>
    <Typography sx={TAG_SX}>{label}</Typography>
  </Box>
);

TagChip.propTypes = { label: PropTypes.node };

/** A labelled, wrapping row of chips. */
export const FieldGroup = ({ label, children }) => (
  <Stack spacing={1} alignItems="flex-start">
    <Typography sx={LABEL_SX}>{label}</Typography>
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {children}
    </Stack>
  </Stack>
);

FieldGroup.propTypes = { label: PropTypes.string, children: PropTypes.node };

/** Followers / Engagement Rate / Average Likes. */
export const StatTile = ({ stat, value, caption, compact }) => (
  <Stack
    spacing={0.75}
    alignItems={compact ? 'flex-start' : 'flex-end'}
    sx={{ flex: 1, minWidth: compact ? 0 : 104 }}
  >
    <Box component="img" src={STAT_ICONS[stat]} alt="" sx={{ width: 20, height: 20 }} />
    <Stack spacing={0.25} alignItems="flex-start">
      <Typography sx={VALUE_SX}>{value}</Typography>
      <Typography sx={{ ...CAPTION_SX, whiteSpace: compact ? 'normal' : 'nowrap' }}>
        {caption}
      </Typography>
    </Stack>
  </Stack>
);

StatTile.propTypes = {
  stat: PropTypes.oneOf(['followers', 'engagement', 'likes']),
  value: PropTypes.node,
  caption: PropTypes.string,
  compact: PropTypes.bool,
};

/** Age / Pronouns / Tier. */
export const MetaItem = ({ label, value, compact }) => (
  <Stack spacing={0.5} alignItems="flex-start" sx={{ minWidth: 0, flex: compact ? 1 : undefined }}>
    <Typography sx={{ fontSize: 14, lineHeight: '18px', fontWeight: 600, color: MUTED }}>
      {label}
    </Typography>
    <Typography
      sx={{ fontSize: 14, lineHeight: '18px', fontWeight: 400, color: ONYX }}
      noWrap={!compact}
    >
      {value}
    </Typography>
  </Stack>
);

MetaItem.propTypes = { label: PropTypes.string, value: PropTypes.node, compact: PropTypes.bool };
