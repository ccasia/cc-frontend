import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { keyframes } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const enter = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
`;

const fade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const keyButtonSx = {
  mt: 3,
  height: 40,
  px: 2,
  pt: 0,
  pb: '3px',
  gap: 0.75,
  bgcolor: '#FFFFFF',
  border: '1px solid #E8E8E8',
  borderRadius: '8px',
  boxShadow: 'inset 0px -3px 0px #E7E7E7',
  color: '#231F20',
  fontFamily: 'InterDisplay',
  fontWeight: 600,
  fontSize: 14,
  textTransform: 'none',
  transition:
    'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out, border-color 140ms ease-out, box-shadow 140ms ease-out',
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
};

export default function CampaignEmptyState({ emoji, title, description, actionLabel, onAction }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        px: 2,
        mt: { xs: 8, md: 12 },
        animation: `${enter} 280ms cubic-bezier(0.23, 1, 0.32, 1) both`,
        '@media (prefers-reduced-motion: reduce)': { animation: `${fade} 200ms ease-out both` },
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 72,
          height: 72,
          mb: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          lineHeight: 1,
          borderRadius: '50%',
          bgcolor: '#F5F5F5',
          border: '1px solid #EBEBEB',
        }}
      >
        {emoji}
      </Box>
      <Typography
        sx={{
          maxWidth: 480,
          fontFamily: 'Instrument Serif',
          fontSize: { xs: 28, md: 34 },
          lineHeight: 1.15,
          color: '#231F20',
          overflowWrap: 'anywhere',
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography sx={{ mt: 1, maxWidth: 360, fontSize: 14, lineHeight: '20px', color: '#636366' }}>
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button disableRipple onClick={onAction} sx={keyButtonSx}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

CampaignEmptyState.propTypes = {
  emoji: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};
