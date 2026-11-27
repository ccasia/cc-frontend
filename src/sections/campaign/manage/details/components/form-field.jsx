import PropTypes from 'prop-types';

import { Box, Stack, FormLabel, Typography } from '@mui/material';

const greySx = { color: '#8E8E93', fontWeight: 400 };

// The label, hint and field layout of the create-campaign steps, for the edit tabs
export default function FormField({
  label,
  hint,
  aside,
  asideInline = false,
  prefix,
  action,
  required = false,
  sx,
  children,
}) {
  return (
    <Stack spacing={0.75} sx={sx}>
      <Stack spacing={0.25}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <FormLabel
              required={required}
              sx={{
                fontWeight: 700,
                fontSize: '0.875rem',
                color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                '& .MuiFormLabel-asterisk': { color: '#FF3500' },
              }}
            >
              {prefix && (
                <Box component="span" sx={greySx}>
                  {prefix}
                  {' – '}
                </Box>
              )}
              {label}
              {aside && asideInline && (
                <Box component="span" sx={greySx}>
                  {' – '}
                  {aside}
                </Box>
              )}
            </FormLabel>
            {action}
          </Stack>
          {aside && !asideInline && (
            <Typography
              variant="caption"
              color="#8E8E93"
              sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
            >
              {aside}
            </Typography>
          )}
        </Stack>
        {hint && (
          <Typography variant="caption" color="#8E8E93">
            {hint}
          </Typography>
        )}
      </Stack>
      {children}
    </Stack>
  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.node,
  aside: PropTypes.node,
  asideInline: PropTypes.bool,
  prefix: PropTypes.string,
  action: PropTypes.node,
  required: PropTypes.bool,
  sx: PropTypes.object,
  children: PropTypes.node.isRequired,
};
