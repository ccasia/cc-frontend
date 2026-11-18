import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';

export default function ScopeSwitch({ value, options, onChange }) {
  return (
    <Stack direction="row" role="tablist" sx={{ p: 0.5, borderRadius: 1.25, bgcolor: '#F4F4F5' }}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <ButtonBase
            key={option.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            sx={{
              flex: 1,
              gap: 0.75,
              height: 32,
              borderRadius: 1,
              typography: 'body2',
              fontWeight: selected ? 600 : 500,
              color: selected ? 'text.primary' : 'text.secondary',
              bgcolor: selected ? 'background.paper' : 'transparent',
              boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'background-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
            }}
          >
            {option.label}
            {option.count != null && (
              <Box component="span" sx={{ color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                {option.count}
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

ScopeSwitch.propTypes = {
  value: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};
