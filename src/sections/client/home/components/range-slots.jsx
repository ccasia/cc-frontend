import { format } from 'date-fns';
import PropTypes from 'prop-types';

import { Box, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

import { ACTION_BLUE } from '../utils';

// Start → End fields above the calendar. The ring marks the date the next click sets.
export default function RangeSlots({ from, to, previewEnd }) {
  let active = null;
  if (!from) active = 'start';
  else if (!to) active = 'end';

  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 2, pt: 2 }}>
      <Slot label="Start" date={from} active={active === 'start'} />
      <Iconify icon="eva:arrow-forward-fill" width={14} sx={{ flex: 'none', color: 'grey.400' }} />
      <Slot label="End" date={to ?? previewEnd} preview={!to} active={active === 'end'} />
    </Stack>
  );
}

RangeSlots.propTypes = {
  from: PropTypes.instanceOf(Date),
  to: PropTypes.instanceOf(Date),
  previewEnd: PropTypes.instanceOf(Date),
};

function Slot({ label, date, active, preview = false }) {
  let valueColor = 'text.disabled';
  if (date) valueColor = preview ? 'text.secondary' : 'text.primary';

  return (
    <Box
      sx={(theme) => ({
        flex: 1,
        minWidth: 0,
        px: 1.25,
        py: 0.75,
        borderRadius: 1,
        bgcolor: active ? 'background.paper' : alpha(theme.palette.grey[500], 0.08),
        boxShadow: `inset 0 0 0 1.5px ${active ? ACTION_BLUE : 'transparent'}`,
        transition: 'box-shadow 160ms ease, background-color 160ms ease',
      })}
    >
      <Box
        sx={{
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.3,
          color: active ? ACTION_BLUE : 'text.secondary',
          transition: 'color 160ms ease',
        }}
      >
        {label}
      </Box>
      <Box
        sx={{
          fontSize: 13,
          fontWeight: date ? 600 : 400,
          lineHeight: 1.35,
          color: valueColor,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {date ? format(date, 'd MMM yyyy') : 'Pick a date'}
      </Box>
    </Box>
  );
}

Slot.propTypes = {
  label: PropTypes.string.isRequired,
  date: PropTypes.instanceOf(Date),
  active: PropTypes.bool,
  preview: PropTypes.bool,
};
