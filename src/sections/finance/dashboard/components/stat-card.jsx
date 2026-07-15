import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { CARD_BORDER } from '../utils';

// ----------------------------------------------------------------------

export default function StatCard({ icon, iconColor, iconBg, label, value, subtitle, extra, onClick }) {
  const handleKeyDown = (event) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    onClick();
  };

  return (
    <Card
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        p: 2.5,
        height: '100%',
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 2,
        bgcolor: 'common.white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        ...(onClick && {
          cursor: 'pointer',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          '&:focus-visible': {
            outline: '2px solid #4F46E5',
            outlineOffset: 2,
          },
          '&:hover': {
            borderColor: '#D9DFE3',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          },
        }),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.25,
            bgcolor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={19} />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: '#637381',
            fontWeight: 600,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.75rem', md: '2rem' },
          lineHeight: 1.15,
          color: 'text.primary',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>

      {extra && <Box sx={{ mt: 1.25 }}>{extra}</Box>}

      {subtitle && (
        <Typography variant="body2" sx={{ color: '#637381', mt: extra ? 0.75 : 1 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
}

StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string,
  iconBg: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
  subtitle: PropTypes.string,
  extra: PropTypes.node,
  onClick: PropTypes.func,
};
