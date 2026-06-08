import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

// Shared base for every brief-flow modal. Renders a centered emoji circle, a
// serif title, grey body text, and a vertical stack of full-width action
// buttons. Each design (Brief sent!, Approve brief?, etc.) is a thin wrapper
// that feeds this component the right emoji / copy / actions.
//
// `actions` is an array of { label, onClick, variant }, rendered top-to-bottom.
//   variant 'dark'     → near-black pill (primary "Done" / "Copy Link" / "Go to Briefs")
//   variant 'blue'     → brand-blue pill (affirmative "Confirm" / "Approve")
//   variant 'outlined' → white outlined pill ("Cancel" / "Done")

const BTN_BASE = {
  width: '1',
  py: 1.25,
  borderRadius: 1.5,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: 15,
  boxShadow: 'none',
};

const VARIANT_SX = {
  dark: {
    ...BTN_BASE,
    color: '#FFFFFF',
    bgcolor: '#2B2B2B',
    boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.25) inset',
    '&:hover': { bgcolor: '#1A1A1A', boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.25) inset' },
    '&.Mui-disabled': { bgcolor: '#2B2B2B', color: '#FFFFFF', opacity: 0.5 },
  },
  blue: {
    ...BTN_BASE,
    color: '#FFFFFF',
    bgcolor: '#1340FF',
    boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.25) inset',
    '&:hover': { bgcolor: '#0F33CC', boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.25) inset' },
    '&.Mui-disabled': { bgcolor: '#1340FF', color: '#FFFFFF', opacity: 0.5 },
  },
  danger: {
    ...BTN_BASE,
    color: '#FFFFFF',
    bgcolor: '#DC2626',
    boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.25) inset',
    '&:hover': { bgcolor: '#B91C1C', boxShadow: '0px -3px 0px 0px rgba(0,0,0,0.25) inset' },
    '&.Mui-disabled': { bgcolor: '#DC2626', color: '#FFFFFF', opacity: 0.5 },
  },
  outlined: {
    ...BTN_BASE,
    color: '#0F172A',
    bgcolor: '#FFFFFF',
    border: '1px solid #E7E7E7',
    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
    '&:hover': { bgcolor: '#FFFFFF', border: '1px solid #E7E7E7', boxShadow: '0px -3px 0px 0px #E7E7E7 inset' },
    '&.Mui-disabled': { bgcolor: '#FFFFFF', color: '#0F172A', opacity: 0.5 },
  },
};

export default function BriefModal({ open, emoji, iconBg, title, body, actions, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2.5, bgcolor: '#F4F4F4' } }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: iconBg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
            fontSize: 34,
            lineHeight: 1,
          }}
        >
          <span role="img" aria-hidden>
            {emoji}
          </span>
        </Box>

        <Typography
          sx={{
            fontFamily: 'Instrument Serif, "Times New Roman", serif',
            fontWeight: 400,
            fontSize: 34,
            lineHeight: 1.1,
            color: '#0A0910',
            mb: 1,
          }}
        >
          {title}
        </Typography>

        <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: 1.5 }}>
          {body}
        </Typography>

        <Stack spacing={1.25}>
          {actions.map((action) => (
            <Button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              sx={VARIANT_SX[action.variant] || VARIANT_SX.dark}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

BriefModal.propTypes = {
  open: PropTypes.bool,
  emoji: PropTypes.string,
  iconBg: PropTypes.string,
  title: PropTypes.node,
  body: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(['dark', 'blue', 'danger', 'outlined']),
      disabled: PropTypes.bool,
    })
  ),
  onClose: PropTypes.func,
};
