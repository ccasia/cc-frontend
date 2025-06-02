import React from 'react';
import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const StatusBanner = ({ status }) => {
  if (status === 'CHANGES_REQUIRED') {
    return (
      <Box
        sx={{
          mb: 3,
          p: 1.5,
          px: 3,
          bgcolor: 'warning.lighter',
          border: '1px solid',
          borderColor: 'warning.light',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 2px 8px rgba(255, 171, 0, 0.12)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            bgcolor: 'warning.main',
          },
        }}
      >
        <Box
          sx={{
            minWidth: 40,
            height: 40,
            borderRadius: 1.2,
            bgcolor: 'warning.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify
            icon="solar:danger-triangle-bold"
            width={24}
            sx={{
              color: 'warning.contrastText',
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'warning.darker',
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            Changes Required
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'warning.dark',
              opacity: 0.8,
            }}
          >
            Changes have been requested for this submission.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (status === 'APPROVED') {
    return (
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: 'success.lighter',
          border: '1px solid',
          borderColor: 'success.light',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Iconify icon="solar:check-circle-bold" color="success.main" />
        <Typography color="success.darker" sx={{ flex: 1 }}>
          This submission has been approved
        </Typography>
      </Box>
    );
  }
  
  if (status === 'PENDING_REVIEW') {
    return (
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: 'info.lighter',
          border: '1px solid',
          borderColor: 'info.light',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Iconify icon="material-symbols:hourglass-outline" color="info.main" />
        <Typography color="info.darker" sx={{ flex: 1 }}>
          This submission is pending reviews
        </Typography>
      </Box>
    );
  }

  return null;
};

StatusBanner.propTypes = {
  status: PropTypes.string,
};

export default StatusBanner; 