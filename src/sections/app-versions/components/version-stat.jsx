import PropTypes from 'prop-types';

import { Box, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { COLORS } from '../utils';

// One cell of the version strip: icon and label, the version, then a short caption
export default function VersionStat({ icon, color, label, value, caption, sx }) {
  return (
    <Box sx={{ px: 2.5, py: 2, minWidth: 0, ...sx }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}
      >
        <Iconify icon={icon} width={16} sx={{ flexShrink: 0, color }} />
        {label}
      </Stack>
      <Typography
        sx={{
          mt: 1.25,
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontSize: 28,
          lineHeight: 1,
          color: COLORS.text,
        }}
      >
        {value}
      </Typography>
      <Box sx={{ mt: 0.75, fontSize: 12, color: 'text.secondary' }}>{caption}</Box>
    </Box>
  );
}

VersionStat.propTypes = {
  icon: PropTypes.string.isRequired,
  color: PropTypes.string,
  label: PropTypes.node.isRequired,
  value: PropTypes.node,
  caption: PropTypes.node,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
};
