export const RELEASE_TYPES = ['NEW', 'IMPROVED', 'FIXED'];

export const RELEASE_TYPE_META = {
  NEW: { label: 'New', color: '#1ABF66' },
  IMPROVED: { label: 'Improved', color: '#0062CD' },
  FIXED: { label: 'Fixed', color: '#8E8E93' },
};

// Platform 3D "lip" buttons — inset bottom ledge, matching the campaign brief flow
// (sections/campaign/briefs/dialogs/brief-modal.jsx). Hover darkens; click presses
// the button down by the lip height and collapses the ledge.
const lipButton = ({ color, bgcolor, hoverBg, lipColor, border }) => ({
  px: 2.5,
  py: 1,
  borderRadius: 1.5,
  textTransform: 'none',
  fontWeight: 700,
  color,
  bgcolor,
  ...(border && { border }),
  boxShadow: `0px -3px 0px 0px ${lipColor} inset`,
  transition: 'transform 0.08s ease, box-shadow 0.08s ease, background-color 0.15s ease',
  '&:hover': {
    bgcolor: hoverBg,
    boxShadow: `0px -3px 0px 0px ${lipColor} inset`,
    ...(border && { border }),
  },
  '&:active': {
    transform: 'translateY(3px)',
    boxShadow: `0px 0px 0px 0px ${lipColor} inset`,
  },
  '&.Mui-disabled': { color, bgcolor, opacity: 0.5, ...(border && { border }) },
  // Keep LoadingButton's label hidden behind its spinner
  '&.MuiLoadingButton-loading': { color: 'transparent' },
});

export const LIP_BUTTON_SX = {
  dark: lipButton({
    color: '#FFFFFF',
    bgcolor: '#2B2B2B',
    hoverBg: '#1A1A1A',
    lipColor: 'rgba(0,0,0,0.25)',
  }),
  blue: lipButton({
    color: '#FFFFFF',
    bgcolor: '#1340FF',
    hoverBg: '#0F33CC',
    lipColor: 'rgba(0,0,0,0.25)',
  }),
  danger: lipButton({
    color: '#FFFFFF',
    bgcolor: '#DC2626',
    hoverBg: '#B91C1C',
    lipColor: 'rgba(0,0,0,0.25)',
  }),
  outlined: lipButton({
    color: '#0F172A',
    bgcolor: '#FFFFFF',
    hoverBg: '#F9FAFB',
    lipColor: '#E7E7E7',
    border: '1px solid #E7E7E7',
  }),
};

export const sortByType = (items = []) =>
  [...items].sort((a, b) => RELEASE_TYPES.indexOf(a.type) - RELEASE_TYPES.indexOf(b.type));
