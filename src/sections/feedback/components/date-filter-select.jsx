import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isSameMonth,
  isSameYear,
} from 'date-fns';

import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import FormHelperText from '@mui/material/FormHelperText';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const PRESETS = [
  { value: 'all', label: 'All time', icon: 'mdi:infinity' },
  { value: 'week', label: 'This week', icon: 'mdi:calendar-week' },
  { value: 'month', label: 'This month', icon: 'mdi:calendar-month' },
  { value: 'year', label: 'This year', icon: 'mdi:calendar' },
  { value: 'custom', label: 'Custom range', icon: 'mdi:calendar-range' },
];

/**
 * Format a date range as a short label using date-fns `format` directly.
 * Avoids the project's `fDate` helper which has a TikTok-timestamp branch
 * that corrupts native Date objects (multiplies ms by 1000).
 */
function formatRangeLabel(start, end) {
  if (!start || !end) return 'Custom range';

  const s = new Date(start);
  const e = new Date(end);
  const now = new Date();
  const thisYear = isSameYear(s, now) && isSameYear(e, now);

  const yearFmt = thisYear ? '' : ' yyyy';

  if (isSameMonth(s, e)) {
    return `${format(s, 'dd')} - ${format(e, `dd MMM${yearFmt}`)}`;
  }
  return `${format(s, `dd MMM${yearFmt}`)} - ${format(e, `dd MMM${yearFmt}`)}`;
}

// ----------------------------------------------------------------------

export default function DateFilterSelect({ value, startDate, endDate, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);

  // Custom range dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStart, setDialogStart] = useState(null);
  const [dialogEnd, setDialogEnd] = useState(null);

  const dialogError =
    dialogStart && dialogEnd ? new Date(dialogStart).getTime() > new Date(dialogEnd).getTime() : false;

  const isFiltered = value !== 'all';

  const handleOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handlePreset = useCallback(
    (preset) => {
      handleClose();

      if (preset === 'custom') {
        setDialogStart(startDate || null);
        setDialogEnd(endDate || null);
        setDialogOpen(true);
        return;
      }

      const now = new Date();
      let newStart = null;
      let newEnd = null;

      if (preset === 'week') {
        newStart = startOfWeek(now, { weekStartsOn: 1 });
        newEnd = endOfWeek(now, { weekStartsOn: 1 });
      } else if (preset === 'month') {
        newStart = startOfMonth(now);
        newEnd = endOfMonth(now);
      } else if (preset === 'year') {
        newStart = startOfYear(now);
        newEnd = endOfYear(now);
      }

      onChange({ preset, startDate: newStart, endDate: newEnd });
    },
    [handleClose, startDate, endDate, onChange]
  );

  const handleClear = useCallback(() => {
    onChange({ preset: 'all', startDate: null, endDate: null });
  }, [onChange]);

  const handleCustomCancel = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleCustomApply = useCallback(() => {
    setDialogOpen(false);
    onChange({
      preset: 'custom',
      startDate: dialogStart ? new Date(dialogStart) : null,
      endDate: dialogEnd ? new Date(dialogEnd) : null,
    });
  }, [dialogStart, dialogEnd, onChange]);

  const getButtonLabel = () => {
    if (value === 'custom' && startDate && endDate) {
      return formatRangeLabel(startDate, endDate);
    }
    const preset = PRESETS.find((p) => p.value === value);
    return preset?.label || 'All time';
  };

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
        <Button
          size="small"
          color="inherit"
          onClick={handleOpen}
          endIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={16} />}
          sx={{
            bgcolor: 'white',
            borderRadius: 1.5,
            px: 1.5,
            py: 0.75,
            fontWeight: 600,
            fontSize: 13,
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: 'white' },
          }}
        >
          {getButtonLabel()}
        </Button>

        {isFiltered && (
          <IconButton size="small" onClick={handleClear} sx={{ width: 28, height: 28 }}>
            <Iconify icon="eva:close-circle-fill" width={18} sx={{ color: 'text.disabled' }} />
          </IconButton>
        )}
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        {PRESETS.map((preset) => (
          <MenuItem
            key={preset.value}
            selected={value === preset.value}
            onClick={() => handlePreset(preset.value)}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Iconify icon={preset.icon} width={18} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
              {preset.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={dialogOpen}
        onClose={handleCustomCancel}
        PaperProps={{
          sx: {
            bgcolor: '#F4F4F4',
            borderRadius: 2,
            py: 3,
            px: 3,
          },
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Instrument Serif',
            fontSize: 30,
            fontWeight: 400,
            lineHeight: 1.2,
            mb: 3,
          }}
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
            End date must be later than start date
          </FormHelperText>
        )}

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCustomCancel}
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button
            disabled={dialogError || !dialogStart || !dialogEnd}
            variant="contained"
            onClick={handleCustomApply}
            sx={{
              bgcolor: '#1340FF',
              borderRadius: 1,
              '&:hover': { bgcolor: '#0F30CC' },
            }}
          >
            Apply
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}

DateFilterSelect.propTypes = {
  value: PropTypes.oneOf(['all', 'week', 'month', 'year', 'custom']),
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
};
