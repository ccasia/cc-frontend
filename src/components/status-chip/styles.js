// Bordered status chip with a 3px bottom lip, used for agreement, creator and outreach statuses.
// From sm up it's CHIP_HEIGHT tall on one line; when allowed to wrap, two lines are about 46px.

// Horizontal padding in theme spacing units.
export const CHIP_PX = { xs: 0.6, sm: 1 };

const CHIP_PY = 6;
const CHIP_LINE_HEIGHT = 15; // 12px text at lineHeight 1.25

// Height of a one-line chip from sm up: text, vertical padding, 1px top and 3px bottom borders.
export const CHIP_HEIGHT = CHIP_LINE_HEIGHT + CHIP_PY * 2 + 1 + 3;

export const statusChipSx = (color) => ({
  textTransform: 'uppercase',
  fontWeight: 700,
  display: 'inline-block',
  px: CHIP_PX,
  py: { xs: 0.2, sm: `${CHIP_PY}px` },
  lineHeight: 1.25,
  fontSize: { xs: '0.6rem', sm: '0.75rem' },
  border: '1px solid',
  borderBottom: '3px solid',
  borderRadius: 0.8,
  bgcolor: 'white',
  textAlign: 'center',
  color,
  borderColor: color,
});

// "No status set" placeholder: dashed and without the lip, padded to the same height.
// borderBottom and borderColor are overridden by name: spreading the chip keeps its key order, so
// overriding only `border` would still let the chip's later 3px borderBottom win.
export const EMPTY_CHIP_SX = {
  ...statusChipSx('#8E8E93'),
  border: '1px dashed',
  borderBottom: '1px dashed',
  borderColor: '#D0D0D0',
  py: { xs: '2.6px', sm: `${CHIP_PY + 1}px` },
};
