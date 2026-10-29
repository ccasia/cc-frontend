import PropTypes from 'prop-types';

import { Box, Stack, Typography } from '@mui/material';

import { COLORS } from '../utils';

export default function Section({ title, titleAdornment, description, action, children }) {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>
              {title}
            </Typography>
            {titleAdornment}
          </Stack>
          {description && (
            <Box sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>{description}</Box>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  titleAdornment: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node,
};
