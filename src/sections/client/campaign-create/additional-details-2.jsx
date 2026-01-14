import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

// ----------------------------------------------------------------------

AdditionalDetails2.propTypes = {
  // Add any props as needed when fields are defined
};

export default function AdditionalDetails2() {
  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: 300,
        }}
      >
        <Typography variant="h6" color="text.secondary" mb={2}>
          Additional Details 2
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
          This section will contain more additional optional fields for your campaign.
          Fields will be added here soon.
        </Typography>
      </Box>
    </Box>
  );
}
