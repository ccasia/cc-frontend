// ----------------------------------------------------------------------
// Shared design tokens for the reimbursement UI (admin review modal, summary ticket, creator
// receipt section, regenerate-invoice dialog). Follows the Send Agreement modal's language:
// grey paper, Instrument Serif titles, Inter Tight body text and 3D "lipped" buttons.
// Change a value here and every reimbursement screen follows.

export const COLORS = {
  // Brand / actions
  brand: '#1340FF',
  brandDark: '#0D2BA8', // button lip + hover
  brandTint: '#F0F3FF', // hover / selected wash

  // Status
  success: '#1ABF66',
  pending: '#FFC702',
  danger: '#FF3500',
  dangerDark: '#B32500', // danger button lip + hover
  dangerText: '#B42318', // rejection reason text

  // Text
  ink: '#221f20',
  label: '#3d3952',
  textSecondary: '#636366',
  textMuted: '#8E8E93',

  // Lines & surfaces
  white: '#FFFFFF',
  paper: 'rgba(244, 244, 244, 1)', // dialog background
  stage: '#E9E9EB', // receipt preview background
  surfaceSubtle: '#F2F2F4', // thumbnail placeholder
  surfaceHover: '#F5F5F5',
  border: '#E7E7E7',
  borderStrong: '#D6D6D9', // dashed empty states
  divider: '#DCDCDC', // dashed receipt-row separators
  idle: '#C7C7CC',
  disabled: '#B0B0B1',
  disabledDark: '#9E9E9F',

  // Notes & warnings (yellow callouts)
  noteBg: '#FFF8E0',
  noteBorder: '#FFE38A',
  noteIcon: '#B58A00',
  noteText: '#6B5200',
};

export const FONTS = {
  body: 'Inter Tight, sans-serif',
  serif: 'Instrument Serif',
};

// ---------------------------------------------------------------- buttons

const LIPPED_BUTTON_SX = {
  borderRadius: 1.15,
  height: 44,
  minWidth: 100,
  px: 2.5,
  fontWeight: 600,
  fontSize: '0.95rem',
  textTransform: 'none',
};

const DISABLED_SX = {
  '&.Mui-disabled': {
    bgcolor: COLORS.disabled,
    border: `1.5px solid ${COLORS.disabled}`,
    borderBottom: `3px solid ${COLORS.disabledDark}`,
    color: COLORS.white,
  },
};

export const PRIMARY_BUTTON_SX = {
  ...LIPPED_BUTTON_SX,
  bgcolor: COLORS.brand,
  color: COLORS.white,
  border: `1.5px solid ${COLORS.brand}`,
  borderBottom: `3px solid ${COLORS.brandDark}`,
  '&:hover': { bgcolor: COLORS.brandDark, color: COLORS.white },
  ...DISABLED_SX,
};

export const SECONDARY_BUTTON_SX = {
  ...LIPPED_BUTTON_SX,
  bgcolor: COLORS.white,
  color: COLORS.ink,
  border: `1.5px solid ${COLORS.border}`,
  borderBottom: `3px solid ${COLORS.border}`,
  '&:hover': { bgcolor: COLORS.surfaceHover },
};

export const DANGER_BUTTON_SX = {
  ...LIPPED_BUTTON_SX,
  bgcolor: COLORS.danger,
  color: COLORS.white,
  border: `1.5px solid ${COLORS.danger}`,
  borderBottom: `3px solid ${COLORS.dangerDark}`,
  '&:hover': { bgcolor: COLORS.dangerDark, color: COLORS.white },
  ...DISABLED_SX,
};

// ---------------------------------------------------------------- dialogs & fields

export const DIALOG_PAPER_SX = { bgcolor: COLORS.paper };

// Spread onto the dialog title <Typography>
export const DIALOG_TITLE_PROPS = {
  fontFamily: FONTS.serif,
  fontSize: '30px',
  fontWeight: 500,
  letterSpacing: -0.5,
};

// White text field on the grey dialog paper
export const WHITE_INPUT_SX = {
  '& .MuiOutlinedInput-root': { borderRadius: 1, bgcolor: COLORS.white },
};
