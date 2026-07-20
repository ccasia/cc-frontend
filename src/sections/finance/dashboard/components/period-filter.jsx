import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import {
  format,
  endOfDay,
  endOfWeek,
  endOfYear,
  endOfMonth,
  isValid,
  isSameYear,
  startOfDay,
  isSameMonth,
  startOfWeek,
  startOfYear,
  startOfMonth,
} from 'date-fns';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

export function getPresetRange(preset) {
  const now = new Date();

  if (preset === 'today') {
    return { startDate: startOfDay(now), endDate: endOfDay(now) };
  }
  if (preset === 'week') {
    return {
      startDate: startOfWeek(now, { weekStartsOn: 1 }),
      endDate: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }
  if (preset === 'year') {
    return { startDate: startOfYear(now), endDate: endOfYear(now) };
  }
  return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
}

function formatRangeLabel(start, end) {
  if (!start || !end) return 'Custom';

  const s = new Date(start);
  const e = new Date(end);
  const now = new Date();
  const yearFmt = isSameYear(s, now) && isSameYear(e, now) ? '' : ' yyyy';

  if (isSameMonth(s, e)) {
    return `${format(s, 'dd')} - ${format(e, `dd MMM${yearFmt}`)}`;
  }
  return `${format(s, `dd MMM${yearFmt}`)} - ${format(e, `dd MMM${yearFmt}`)}`;
}

export function getPeriodLabel(preset, startDate, endDate) {
  const labels = {
    today: 'today',
    week: 'this week',
    month: 'this month',
    year: 'this year',
  };

  return labels[preset] || `from ${formatRangeLabel(startDate, endDate)}`;
}

// ----------------------------------------------------------------------

export default function PeriodFilter({ value, startDate, endDate, onChange }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStart, setDialogStart] = useState(null);
  const [dialogEnd, setDialogEnd] = useState(null);

  const hasValidStart = Boolean(dialogStart && isValid(dialogStart));
  const hasValidEnd = Boolean(dialogEnd && isValid(dialogEnd));
  const hasValidRange = hasValidStart && hasValidEnd;
  const dialogError = hasValidRange && dialogStart.getTime() > dialogEnd.getTime();
  const applyDisabled = !hasValidRange || dialogError;

  const handlePreset = useCallback(
    (preset) => {
      onChange({ preset, ...getPresetRange(preset) });
    },
    [onChange]
  );

  const handleCustomOpen = useCallback(() => {
    setDialogStart(startDate || null);
    setDialogEnd(endDate || null);
    setDialogOpen(true);
  }, [startDate, endDate]);

  const handleCustomApply = useCallback(() => {
    if (applyDisabled) return;

    setDialogOpen(false);
    onChange({
      preset: 'custom',
      startDate: startOfDay(dialogStart),
      endDate: endOfDay(dialogEnd),
    });
  }, [applyDisabled, dialogStart, dialogEnd, onChange]);

  const pillSx = (active) => ({
    px: 2,
    py: 0.9,
    borderRadius: 1.5,
    fontSize: 13.5,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    border: '1px solid',
    ...(active
      ? {
          bgcolor: '#1A1A1A',
          borderColor: '#1A1A1A',
          color: 'common.white',
          '&:hover': { bgcolor: '#000' },
        }
      : {
          bgcolor: 'common.white',
          borderColor: '#E8ECEE',
          color: 'text.primary',
          '&:hover': { bgcolor: '#F7F8FA', borderColor: '#D9DFE3' },
        }),
  });

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            disableElevation
            onClick={() => handlePreset(preset.value)}
            sx={pillSx(value === preset.value)}
          >
            {preset.label}
          </Button>
        ))}

        <Button
          disableElevation
          onClick={handleCustomOpen}
          endIcon={<Iconify icon="eva:chevron-down-fill" width={18} />}
          sx={pillSx(value === 'custom')}
        >
          {value === 'custom' ? formatRangeLabel(startDate, endDate) : 'Custom'}
        </Button>
      </Stack>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: '#F4F4F4', borderRadius: 2, py: 3, px: 3 } }}
      >
        <Typography
          sx={{ fontFamily: 'Instrument Serif', fontSize: 30, fontWeight: 400, lineHeight: 1.2, mb: 3 }}
        >
          Select date range
        </Typography>

        <Stack spacing={2}>
          <DatePicker
            label="Start date"
            value={dialogStart}
            onChange={(val) => setDialogStart(val)}
            slotProps={{ textField: { fullWidth: true, sx: { bgcolor: 'white', borderRadius: 1 } } }}
          />
          <DatePicker
            label="End date"
            value={dialogEnd}
            onChange={(val) => setDialogEnd(val)}
            slotProps={{ textField: { fullWidth: true, sx: { bgcolor: 'white', borderRadius: 1 } } }}
          />
        </Stack>

        {dialogError && (
          <FormHelperText error sx={{ mt: 1 }}>
            End date must be on or after start date
          </FormHelperText>
        )}

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDialogOpen(false)} sx={{ borderRadius: 1 }}>
            Cancel
          </Button>
          <Button
            disabled={applyDisabled}
            variant="contained"
            onClick={handleCustomApply}
            sx={{ bgcolor: '#1A1A1A', borderRadius: 1, '&:hover': { bgcolor: '#000' } }}
          >
            Apply
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}

PeriodFilter.propTypes = {
  value: PropTypes.oneOf(['today', 'week', 'month', 'year', 'custom']),
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
};
