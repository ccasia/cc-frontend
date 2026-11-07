import { menuPaperSx } from 'src/sections/campaign/create/components/chip-select';

// The ChipSelect menu look for a plain MUI Select. Its own keyframe replaces MUI's Grow.
export const selectMenuProps = {
  transitionDuration: 0,
  PaperProps: {
    sx: {
      ...menuPaperSx,
      '& .MuiMenu-list': { p: 0 },
      '& .MuiMenuItem-root': {
        minHeight: 36,
        px: 1,
        py: 0,
        fontSize: 14,
        borderRadius: 1,
        color: '#3A3A3C',
        '&:hover, &.Mui-focusVisible': { bgcolor: '#F5F5F5' },
        '&.Mui-selected': { bgcolor: '#F5F7FF', color: '#1340FF', fontWeight: 600 },
        '&.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': { bgcolor: '#EBEFFF' },
      },
      '& .MuiMenuItem-root + .MuiMenuItem-root': { mt: 0.5 },
    },
  },
};
