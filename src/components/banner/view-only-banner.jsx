import PropTypes from 'prop-types';

import { Box, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ViewOnlyBanner({ message, sx }) {
  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Alert
        severity="info"
        icon={<Iconify icon="solar:eye-outline" width={20} />}
        sx={{
          py: 0,
          pl: 1.5,
          minHeight: 44,
          alignItems: 'center',
          backgroundColor: (theme) => alpha(theme.palette.info.main, 0.08),
          color: (theme) => theme.palette.info.darker,
          border: (theme) => `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
          borderRadius: 1.5,
          '& .MuiAlert-icon': {
            p: 0,
            mr: 1.5,
            color: 'info.main',
          },
          '& .MuiAlert-message': {
            p: 0,
            typography: 'body2',
            fontWeight: 500,
          },
        }}
      >
        {message ||
          'You are viewing this campaign in read-only mode.'}
      </Alert>
    </Box>
  );
}

ViewOnlyBanner.propTypes = {
  message: PropTypes.string,
  sx: PropTypes.object,
};
