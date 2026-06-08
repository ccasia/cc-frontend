import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

// Three visual variants:
//   default — pill with a circle on the left and the label, free-wrap.
//   pill    — short fully-rounded button, used by Gender / Age Range.
//   grid    — same chip style as default but laid out in an equal-width grid
//             (4 columns ≥ sm, 2 columns < sm). Used by Success Metrics so the
//             options align in a neat matrix instead of free-wrapping.
export default function ChipMultiSelect({
  options,
  value = [],
  onToggle,
  disabled,
  pill = false,
  grid = false,
  columns = 4,
  sx,
}) {
  if (grid) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${columns}, 1fr)` },
          gap: 1,
          ...sx,
        }}
      >
        {options.map((opt) => {
          const selected = value.includes(opt);
          return (
            <Box
              key={opt}
              onClick={disabled ? undefined : () => onToggle(opt)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 1.5, py: 1.5, borderRadius: 1.5,
                border: '1px solid',
                borderColor: selected ? '#1340FF' : '#E5E7EB',
                bgcolor: selected ? '#1340FF' : '#FFFFFF',
                color: selected ? '#FFFFFF' : '#0F172A',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'background-color 120ms ease',
              }}
            >
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid',
                borderColor: selected ? '#FFFFFF' : '#E5E7EB',
                bgcolor: selected ? '#FFFFFF' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {selected && <Iconify icon="eva:checkmark-fill" sx={{ color: '#1340FF', width: 14 }} />}
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{opt}</Typography>
            </Box>
          );
        })}
      </Box>
    );
  }
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={sx}>
      {options.map((opt) => {
        const selected = value.includes(opt);
        if (pill) {
          return (
            <Box
              key={opt}
              onClick={disabled ? undefined : () => onToggle(opt)}
              sx={{
                px: 2.5, py: 1, borderRadius: 999,
                border: '1px solid',
                borderColor: selected ? '#1340FF' : '#E5E7EB',
                bgcolor: selected ? '#1340FF' : '#FFFFFF',
                color: selected ? '#FFFFFF' : '#0F172A',
                cursor: disabled ? 'default' : 'pointer',
                fontWeight: 600, fontSize: 14,
                transition: 'background-color 120ms ease',
              }}
            >
              {opt}
            </Box>
          );
        }
        return (
          <Box
            key={opt}
            onClick={disabled ? undefined : () => onToggle(opt)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1.5, py: 1, borderRadius: 1,
              border: '1px solid',
              borderColor: selected ? '#1340FF' : '#E5E7EB',
              bgcolor: selected ? '#1340FF' : '#FFFFFF',
              color: selected ? '#FFFFFF' : '#0F172A',
              cursor: disabled ? 'default' : 'pointer',
              minWidth: 140,
              transition: 'background-color 120ms ease',
            }}
          >
            <Box sx={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid',
              borderColor: selected ? '#FFFFFF' : '#E5E7EB',
              bgcolor: selected ? '#FFFFFF' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {selected && <Iconify icon="eva:checkmark-fill" sx={{ color: '#1340FF', width: 14 }} />}
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{opt}</Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

ChipMultiSelect.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func,
  disabled: PropTypes.bool,
  pill: PropTypes.bool,
  grid: PropTypes.bool,
  columns: PropTypes.number,
  sx: PropTypes.object,
};
