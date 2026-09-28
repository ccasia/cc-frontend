import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

/**
 * One inline warning for the guest-extraction screens.
 *
 * Follows the section-message pattern from Atlassian and Primer: a triangle
 * icon, a short title, one size of body text, optional short reasons, and one
 * action with a verb that says what it does. The action sits under the text,
 * left-aligned, so a narrow container never squeezes the copy. The words carry
 * the meaning; the amber only supports them.
 */

const TOKENS = {
  bg: '#FFF8E6',
  border: '#FFE2A8',
  icon: '#FFAB00',
  title: '#231F20',
  body: '#5C4A1F',
  action: '#1340FF',
};

export default function WarningMessage({ title, description, reasons, action }) {
  return (
    <Stack
      role="status"
      direction="row"
      spacing={1}
      sx={{
        width: 1,
        px: 1.5,
        py: 1.25,
        borderRadius: '8px',
        bgcolor: TOKENS.bg,
        border: `1px solid ${TOKENS.border}`,
      }}
    >
      <Iconify
        icon="eva:alert-triangle-fill"
        width={16}
        sx={{ mt: '1px', flexShrink: 0, color: TOKENS.icon }}
      />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: '18px', color: TOKENS.title }}>
          {title}
        </Typography>

        {description && (
          <Typography sx={{ mt: 0.25, fontSize: 13, lineHeight: '18px', color: TOKENS.body }}>
            {description}
          </Typography>
        )}

        {reasons?.length > 0 && (
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2, color: TOKENS.body }}>
            {reasons.map((reason) => (
              <Typography
                key={reason}
                component="li"
                sx={{ fontSize: 13, lineHeight: '20px', '&::marker': { color: TOKENS.icon } }}
              >
                {reason}
              </Typography>
            ))}
          </Box>
        )}

        {action && (
          <ButtonBase
            onClick={action.onClick}
            sx={{
              mt: 1,
              gap: 0.5,
              px: 0.5,
              mx: -0.5,
              height: 24,
              borderRadius: '6px',
              fontSize: 13,
              fontWeight: 600,
              color: TOKENS.action,
              transition: 'background-color 120ms ease',
              '&:hover': { bgcolor: 'rgba(19, 64, 255, 0.08)' },
              '&.Mui-focusVisible': { outline: `2px solid ${TOKENS.action}`, outlineOffset: 1 },
            }}
          >
            {action.label}
            <Iconify icon="eva:arrow-forward-fill" width={14} />
          </ButtonBase>
        )}
      </Box>
    </Stack>
  );
}

WarningMessage.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  reasons: PropTypes.arrayOf(PropTypes.string),
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
};
