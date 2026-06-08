import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

// Selectable card grid for the Objectives section — large pill cards with a
// title + subtitle and a circle checkmark in the corner.
export default function OptionCardGrid({ options, selected = [], onToggle, disabled }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <Box
            key={opt.value}
            onClick={disabled ? undefined : () => onToggle(opt.value)}
            sx={{
              p: 2,
              borderRadius: 1,
              border: '1px solid',
              borderColor: isSelected ? '#1340FF' : '#E5E7EB',
              bgcolor: isSelected ? '#1340FF' : '#FFFFFF',
              color: isSelected ? '#FFFFFF' : '#0F172A',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'background-color 120ms ease',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: '2px solid',
                  borderColor: isSelected ? '#FFFFFF' : '#E5E7EB',
                  bgcolor: isSelected ? '#FFFFFF' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isSelected && <Iconify icon="eva:checkmark-fill" sx={{ color: '#1340FF', width: 16 }} />}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{opt.title}</Typography>
                <Typography sx={{ fontSize: 13, color: isSelected ? 'rgba(255,255,255,0.85)' : '#6B7280' }}>
                  {opt.subtitle}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}

OptionCardGrid.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
  })),
  selected: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func,
  disabled: PropTypes.bool,
};
