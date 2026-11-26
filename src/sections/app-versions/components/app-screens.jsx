import PropTypes from 'prop-types';

import { Box, Stack, Typography } from '@mui/material';

// Small copies of cult-app's update screens (force-update-screen.tsx, soft-update-dialog.tsx)
const APP = {
  onyx: '#231F20',
  surface: '#2A2726',
  blue: '#1340FF',
  blueLip: '#0A238C',
  grey: '#3A3736',
  greyLip: '#2A2726',
  textSecondary: '#9A9AA1',
};

const serif = (theme) => theme.typography.fontSecondaryFamily;

function AppButton({ children, primary = false }) {
  return (
    <Box
      sx={{
        py: 0.85,
        borderRadius: 1.25,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
        color: 'common.white',
        bgcolor: primary ? APP.blue : APP.grey,
        boxShadow: `0 2px 0 0 ${primary ? APP.blueLip : APP.greyLip}`,
      }}
    >
      {children}
    </Box>
  );
}

AppButton.propTypes = { children: PropTypes.node, primary: PropTypes.bool };

function Puck({ emoji, size }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        mx: 'auto',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        bgcolor: APP.blue,
        fontSize: size * 0.45,
      }}
    >
      {emoji}
    </Box>
  );
}

Puck.propTypes = { emoji: PropTypes.string, size: PropTypes.number };

export function ForceScreen({ title, body }) {
  return (
    <Stack
      spacing={1.75}
      justifyContent="center"
      sx={{ height: 1, px: 2.25, bgcolor: APP.onyx, textAlign: 'center' }}
    >
      <Puck emoji="🚀" size={56} />
      <Typography sx={{ fontFamily: serif, fontSize: 26, lineHeight: 1.1, color: 'common.white' }}>
        {title}
      </Typography>
      <Typography
        sx={{ fontSize: 12.5, lineHeight: 1.45, color: APP.textSecondary, wordBreak: 'break-word' }}
      >
        {body}
      </Typography>
      <Box sx={{ pt: 0.5 }}>
        <AppButton primary>Update now</AppButton>
      </Box>
    </Stack>
  );
}

ForceScreen.propTypes = { title: PropTypes.string, body: PropTypes.string };

export function SoftDialog({ title, body }) {
  return (
    <Stack justifyContent="center" sx={{ height: 1, px: 1.5, bgcolor: '#141213' }}>
      <Stack
        spacing={1.5}
        sx={{ p: 2, borderRadius: 2, bgcolor: APP.surface, textAlign: 'center' }}
      >
        <Puck emoji="✨" size={44} />
        <Typography
          sx={{ fontFamily: serif, fontSize: 22, lineHeight: 1.1, color: 'common.white' }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: 12.5,
            lineHeight: 1.45,
            color: APP.textSecondary,
            wordBreak: 'break-word',
          }}
        >
          {body}
        </Typography>
        <Stack spacing={0.75}>
          <AppButton primary>Update</AppButton>
          <AppButton>Later</AppButton>
        </Stack>
      </Stack>
    </Stack>
  );
}

SoftDialog.propTypes = { title: PropTypes.string, body: PropTypes.string };
