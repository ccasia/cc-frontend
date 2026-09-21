// The raised "action button" shape used across the campaign dialogs: a flat fill
// with an inset bottom edge that deepens on hover and sinks on press.
//
// Shared so the create-campaign and drafts dialogs cannot drift apart.

const BASE = {
  boxSizing: 'border-box',
  height: 44,
  padding: '10px 16px 13px',
  gap: '6px',
  borderRadius: '8px',
  fontFamily: 'InterDisplay',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '20px',
  textTransform: 'none',
  transition:
    'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out, border-color 140ms ease-out, box-shadow 140ms ease-out',
};

/** Dark primary. */
export const PRIMARY_ACTION_SX = {
  ...BASE,
  bgcolor: '#3A3A3C',
  color: '#FFFFFF',
  boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
  '&:hover': { bgcolor: '#2C2C2E', boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)' },
  '&:active': {
    bgcolor: '#231F20',
    boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.45)',
    transform: 'translateY(2px)',
  },
  '&.Mui-disabled': {
    bgcolor: '#3A3A3C',
    color: 'rgba(255, 255, 255, 0.6)',
    boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
  },
};

/** White secondary. */
export const SECONDARY_ACTION_SX = {
  ...BASE,
  bgcolor: '#FFFFFF',
  color: '#231F20',
  border: '1px solid #E8E8E8',
  boxShadow: 'inset 0px -3px 0px #E7E7E7',
  '&:hover': {
    bgcolor: '#F8F8F8',
    border: '1px solid #D6D6D6',
    boxShadow: 'inset 0px -3px 0px #DEDEDE',
  },
  '&:active': {
    bgcolor: '#F0F0F0',
    border: '1px solid #D6D6D6',
    boxShadow: 'inset 0px -1px 0px #DEDEDE',
    transform: 'translateY(2px)',
  },
  '&.Mui-disabled': {
    bgcolor: '#FFFFFF',
    color: '#8E8E93',
    border: '1px solid #E8E8E8',
    boxShadow: 'inset 0px -3px 0px #E7E7E7',
  },
};

/** Destructive. */
export const DANGER_ACTION_SX = {
  ...BASE,
  bgcolor: '#D4321C',
  color: '#FFFFFF',
  boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
  '&:hover': { bgcolor: '#BC2C19', boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)' },
  '&:active': {
    bgcolor: '#A82616',
    boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.45)',
    transform: 'translateY(2px)',
  },
  '&.Mui-disabled': {
    bgcolor: '#D4321C',
    color: 'rgba(255, 255, 255, 0.6)',
    boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
  },
};

/** Plain text action, e.g. "Discard this Campaign". */
export const TEXT_ACTION_SX = {
  fontFamily: 'InterDisplay',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: '18px',
  textTransform: 'none',
  color: '#636366',
  '&:hover': { bgcolor: 'transparent', color: '#231F20' },
};

/** Shared shell for the campaign dialogs: 400px, grey, 24px padding. */
export const DIALOG_PAPER_SX = {
  width: 400,
  maxWidth: '100%',
  m: 2,
  p: 3,
  bgcolor: '#F4F4F4',
  borderRadius: '12px',
  boxShadow: '0px 24px 48px rgba(35, 31, 32, 0.16)',
};
