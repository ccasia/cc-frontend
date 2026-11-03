import PropTypes from 'prop-types';

import { alpha } from '@mui/material/styles';
import { Box, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const buttonSx = {
  px: 1.5,
  py: 0.75,
  borderRadius: 1,
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'none',
  transition: 'transform 160ms ease-out, background-color 160ms ease, border-color 160ms ease',
  '&:active': { transform: 'scale(0.97)' },
};

export const primarySx = {
  ...buttonSx,
  bgcolor: 'text.primary',
  color: 'background.paper',
  '&:hover': { bgcolor: 'grey.800' },
};

export const secondarySx = {
  ...buttonSx,
  color: 'text.primary',
  borderColor: 'divider',
  '&:hover': { borderColor: 'text.primary', bgcolor: 'transparent' },
};

export default function EmptyState({ icon, tone, title, children, actions }) {
  return (
    <Stack
      alignItems="center"
      spacing={2}
      sx={{
        gridColumn: '1 / -1',
        py: 5,
        px: 3,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: '14px',
        textAlign: 'center',
        '@keyframes emptyIn': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'none' },
        },
        animation: `emptyIn 220ms ${EASE_OUT}`,
        '@media (prefers-reduced-motion: reduce)': {
          '@keyframes emptyFade': { from: { opacity: 0 }, to: { opacity: 1 } },
          animation: 'emptyFade 160ms ease',
        },
      }}
    >
      <Box
        sx={(theme) => ({
          display: 'grid',
          placeItems: 'center',
          width: 44,
          height: 44,
          borderRadius: '50%',
          color: tone ?? theme.palette.grey[600],
          bgcolor: alpha(tone ?? theme.palette.grey[500], tone ? 0.14 : 0.12),
        })}
      >
        <Iconify icon={icon} width={22} />
      </Box>

      <Stack spacing={0.5} alignItems="center">
        <Typography
          sx={{
            maxWidth: 440,
            fontSize: 15,
            fontWeight: 600,
            color: 'text.primary',
            overflowWrap: 'anywhere',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{ maxWidth: 440, fontSize: 13, color: 'text.secondary', textWrap: 'pretty' }}
        >
          {children}
        </Typography>
      </Stack>

      {actions && (
        <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.string.isRequired,
  tone: PropTypes.string,
  title: PropTypes.node.isRequired,
  children: PropTypes.node,
  actions: PropTypes.node,
};
