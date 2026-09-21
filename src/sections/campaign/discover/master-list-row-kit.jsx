import PropTypes from 'prop-types';

import { Box, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

/**
 * Shared design tokens for the tall creator master-list row.
 *
 * Two tables use this look: the admin Pitch tab
 * (`discover/client/v3-pitches/v3-pitch-row.jsx`) and the client Creator Master
 * List (`discover/admin/creator-master-list-row.jsx`). They show different
 * fields, so only the tokens and the small presentational pieces live here —
 * each row keeps its own cells, status logic and actions.
 *
 * Every size lives in this file. The block heights below are derived from
 * LABEL_HEIGHT and CHIP_ROW_HEIGHT, so changing a size cannot break the field
 * alignment.
 */

export const LABEL_SIZE = 10;
export const LABEL_HEIGHT = 13;
export const VALUE_SIZE = 13;
export const VALUE_HEIGHT = 17;
export const SMALL_SIZE = 11;
export const SMALL_HEIGHT = 15;
export const NAME_SIZE = 16;
export const NAME_HEIGHT = 21;

// Handles and products under the creator name. They sit one step above the
// shared SMALL_* tokens, so the identity block stays readable while the chips
// and metrics beside it stay dense.
export const HANDLE_SIZE = 12;
export const HANDLE_LINE = 16;

// Avatar, icon and spinner sizes. They live here for the same reason the text
// sizes do: one place to tune how dense the row is.
export const AVATAR_SIZE = 34;
export const ICON_SIZE = 13; // Handle and product icons beside the creator name.
export const PLATFORM_ICON_SIZE = 14; // Instagram / TikTok icon beside a metric.
export const CONTROL_ICON_SIZE = 14; // Chevron, checkmark, comments badge.
export const SPINNER_SIZE = 10;

export const LABEL_SX = {
  fontSize: LABEL_SIZE,
  fontWeight: 600,
  lineHeight: `${LABEL_HEIGHT}px`,
  color: '#636366',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
};

const VALUE_BASE = { fontSize: VALUE_SIZE, lineHeight: `${VALUE_HEIGHT}px` };
export const VALUE_SX = { ...VALUE_BASE, fontWeight: 600, color: '#231F20' };
export const VALUE_PLAIN_SX = { ...VALUE_BASE, fontWeight: 400, color: '#231F20' };
export const VALUE_MUTED_SX = { ...VALUE_BASE, fontWeight: 400, color: '#8E8E93' };

export const NAME_SX = {
  fontSize: NAME_SIZE,
  fontWeight: 400,
  lineHeight: `${NAME_HEIGHT}px`,
  color: '#231F20',
};
export const NAME_LINK_SX = {
  ...NAME_SX,
  display: 'block',
  '&:hover': { color: '#1340FF' },
};

export const HANDLE_SX = {
  fontSize: HANDLE_SIZE,
  lineHeight: `${HANDLE_LINE}px`,
  color: '#636366',
};
export const PRODUCT_SX = {
  fontSize: HANDLE_SIZE,
  fontWeight: 500,
  lineHeight: `${HANDLE_LINE}px`,
  color: '#1340FF',
};

// The row number in the leading column. Quiet on purpose: it is a position
// marker, not a value the reader is meant to land on.
export const INDEX_SX = {
  fontSize: SMALL_SIZE,
  fontWeight: 500,
  lineHeight: `${SMALL_HEIGHT}px`,
  color: '#8E8E93',
};

export const CELL_SX = {
  py: 1.5,
  px: { xs: 1, sm: 2 },
  borderBottom: '1px solid #EBEBEB',
  // Every cell is centred, so a cell with fewer fields sits in the middle of
  // the row rather than riding the top.
  verticalAlign: 'middle',
};

const PLATFORM_ICONS = {
  instagram: { icon: 'ri:instagram-line', color: '#C13584' },
  tiktok: { icon: 'ic:baseline-tiktok', color: '#000000' },
};

export const getPlatformIcon = (platform) =>
  platform === 'tiktok' ? PLATFORM_ICONS.tiktok : PLATFORM_ICONS.instagram;

// "5.40" reads as false precision next to the handoff's "5.4".
export const formatEngagementRate = (rate) =>
  rate == null || rate === '' ? null : `${Number(Number(rate).toFixed(2))}%`;

export const FieldLabel = ({ children }) => <Typography sx={LABEL_SX}>{children}</Typography>;

FieldLabel.propTypes = { children: PropTypes.node };

// The chip's inset bottom bar paints over the last 3px of the chip, so equal
// padding leaves the label riding low inside the white area above it. The extra
// 2px underneath pushes the label back to the optical centre. (Half the 3px bar
// is 1.5px; uppercase text already sits ~0.7px high in its line box, so 2px is
// the whole correction.)
export const CHIP_PAD_TOP = 5;
export const CHIP_PAD_BOTTOM = 7;
// Chip text, plus its vertical padding and its 1px top and bottom borders.
export const CHIP_ROW_HEIGHT = SMALL_HEIGHT + CHIP_PAD_TOP + CHIP_PAD_BOTTOM + 2;

// One labelled field: a label row, a 2px gap, then the value.
//
// Only the FIRST field in each cell reserves chip height, because that is the
// row a status chip lands on. The second field sizes to its text. Every cell
// therefore ends up the same height, which is what lines the fields up — and
// a cell holding just one field (Outreach) is shorter, so `verticalAlign:
// middle` centres it the way the design does.
export const FieldBlock = ({ label, minHeight, children }) => (
  <Stack spacing={0.25} sx={{ alignItems: 'flex-start', width: '100%' }}>
    {label ? <FieldLabel>{label}</FieldLabel> : <Box sx={{ height: LABEL_HEIGHT, flexShrink: 0 }} />}
    <Box sx={{ display: 'flex', alignItems: 'flex-start', minHeight }}>{children}</Box>
  </Stack>
);

FieldBlock.propTypes = {
  label: PropTypes.string,
  minHeight: PropTypes.number,
  children: PropTypes.node,
};

export const EmptyValue = () => <Typography sx={VALUE_PLAIN_SX}>—</Typography>;

export const PlatformIcon = ({ platform, size = PLATFORM_ICON_SIZE }) => {
  const { icon, color } = getPlatformIcon(platform);
  return <Iconify icon={icon} width={size} sx={{ color, flexShrink: 0 }} />;
};

PlatformIcon.propTypes = { platform: PropTypes.string, size: PropTypes.number };

// Chip shared by Outreach Status and Creator Status.
export const chipSx = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  px: 1,
  pt: `${CHIP_PAD_TOP}px`,
  pb: `${CHIP_PAD_BOTTOM}px`,
  borderRadius: '6px',
  bgcolor: '#FFFFFF',
  fontSize: SMALL_SIZE,
  fontWeight: 600,
  lineHeight: `${SMALL_HEIGHT}px`,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  color,
  border: `1px solid ${color}`,
  boxShadow: `inset 0px -3px 0px ${color}`,
});

// The "no status set" placeholder. No inset bar here, so the padding stays even
// and a minHeight matches the coloured chips down the column.
export const emptyChipSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  px: 1,
  py: 0.75,
  minHeight: CHIP_ROW_HEIGHT,
  boxSizing: 'border-box',
  fontSize: SMALL_SIZE,
  fontWeight: 600,
  lineHeight: `${SMALL_HEIGHT}px`,
  color: '#8E8E93',
  border: '1px dashed #D0D0D0',
  borderRadius: '6px',
  bgcolor: 'white',
  whiteSpace: 'nowrap',
};

// Shared shape for the row's action buttons: 8px radius with an inset bottom edge.
export const ACTION_BUTTON_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 80,
  height: 32,
  boxSizing: 'border-box',
  padding: '5px 12px 8px',
  borderRadius: '8px',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '17px',
  textTransform: 'none',
  whiteSpace: 'nowrap',
};

// "View" is the one action both master lists share.
export const VIEW_BUTTON_SX = {
  ...ACTION_BUTTON_SX,
  bgcolor: '#FFFFFF',
  border: '1px solid #E8E8E8',
  boxShadow: 'inset 0px -3px 0px #E7E7E7',
  color: '#1340FF',
  '&:hover': {
    bgcolor: 'rgba(19, 64, 255, 0.08)',
    border: '1px solid #1340FF',
    boxShadow: 'inset 0px -3px 0px #1340FF',
    color: '#1340FF',
  },
};
