import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

const FieldLabel = ({ children, hint }) => (
  <Typography
    component="label"
    sx={{
      fontFamily: '"Inter Tight", sans-serif',
      fontSize: '12.5px',
      fontWeight: 500,
      color: '#3d3952',
    }}
  >
    {children}{' '}
    {hint && (
      <Box component="span" sx={{ fontWeight: 400, color: '#8b8799' }}>
        — {hint}
      </Box>
    )}
  </Typography>
);

FieldLabel.propTypes = {
  children: PropTypes.node,
  hint: PropTypes.string,
};

export default FieldLabel;
