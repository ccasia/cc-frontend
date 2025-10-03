// Shared styles for V4 submission components

export const BUTTON_STYLES = {
  base: {
    borderRadius: 1,
    border: '1px solid #E7E7E7',
    backgroundColor: '#FFFFFF',
    boxShadow: 'inset 0px -2px 0px 0px #E7E7E7',
    fontSize: 12,
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: '#F5F5F5',
      boxShadow: 'inset 0px -2px 0px 0px #E7E7E7'
    },
  },
  success: {
    color: '#1ABF66',
  },
  warning: {
    color: '#D4321C',
  },
  secondary: {
    color: '#000',
  }
};

export const FEEDBACK_CHIP_STYLES = {
  border: '1px solid',
  pb: 1.8,
  pt: 1.6,
  borderColor: '#D4321C',
  borderRadius: 0.8,
  boxShadow: `0px -1.7px 0px 0px #D4321C inset`,
  bgcolor: '#fff',
  color: '#D4321C',
  fontWeight: 'bold',
  fontSize: 12,
  mr: 0.5,
};
