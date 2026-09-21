/**
 * Design tokens for the Add Non-Platform Creators modal.
 *
 * Taken from the Figma handoff for "No-Platform Creators/default". The numbers
 * here are the ones in that spec, not the ones in the older loading-animation
 * prototype, so the modal and the shared field styles cannot drift apart.
 */

export const CC = {
  blue500: '#1340FF',
  /** Spinner track and shimmer highlight. */
  blue100: 'rgba(19, 64, 255, 0.1)',
  /** Brand/Base/CC Onyx. Titles and body copy. */
  onyx: '#231F20',
  /** Brand/Dark Grey/50. Field labels. */
  grey50: '#636366',
  /** Brand/Dark Grey/25. Hint copy. */
  grey25: '#8E8E93',
  /** Brand/Light Grey/300. Placeholder text. */
  placeholder: '#B0B0B0',
  light25: '#F5F5F5',
  /** Brand/Dynamic Grey/100. Every field border and rule in this modal. */
  light100: '#EBEBEB',
  /** Brand/Light Grey/50. The minus and plus button border. */
  light200: '#E8E8E8',
  border: '#EBEBEB',
  /** Brand/Base/CC Grey. The dialog paper. */
  paper: '#F4F4F4',
  fg: '#000000',
};

/**
 * Field size.
 *
 * The handoff specifies a 44px input with a 8px radius and 10px/12px padding.
 * An earlier build used 48px, copied from the manual modal; the spec wins.
 */
export const FIELD_HEIGHT = 44;
export const FIELD_RADIUS = 8;

/** The gap between a label and its input, and between stacked field rows. */
export const LABEL_GAP = 4;
export const ROW_GAP = 20;

export const SHIMMER_DURATION_MS = 1200;
export const SPINNER_DURATION_MS = 700;
export const FLASH_DURATION_MS = 600;

/** Body/S/Medium, Brand/Dark Grey/50. Every field label in this modal. */
export const labelSx = {
  fontFamily: 'Inter Display, sans-serif',
  fontSize: '12px !important',
  fontWeight: 500,
  lineHeight: '16px',
  color: CC.grey50,
};

/** Matches `'& .MuiOutlinedInput-root'` on every field in the modal. */
export const fieldSx = {
  minHeight: `${FIELD_HEIGHT}px`,
  height: `${FIELD_HEIGHT}px`,
  borderRadius: `${FIELD_RADIUS}px`,
  border: `1px solid ${CC.border}`,
  px: '12px',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
};

/** The white input shell, applied through the `sx` of a MUI TextField. */
export const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FFFFFF',
    height: `${FIELD_HEIGHT}px`,
    borderRadius: `${FIELD_RADIUS}px`,
    fontSize: '14px',
    lineHeight: '18px',
    '& fieldset': { borderColor: CC.light100 },
    '&:hover fieldset': { borderColor: CC.light100 },
  },
  '& .MuiOutlinedInput-input': {
    padding: '10px 12px',
    '&::placeholder': { color: CC.placeholder, opacity: 1 },
  },
};
