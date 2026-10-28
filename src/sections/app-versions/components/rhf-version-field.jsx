import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import { Stack, MenuList, MenuItem, TextField, Typography, InputAdornment } from '@mui/material';

import Iconify from 'src/components/iconify';
import CustomPopover from 'src/components/custom-popover';

import GhostButton from './ghost-button';
import { ICONS, COLORS, normalizeVersion, formatVersionInput } from '../utils';

// Version input: adds the dots while typing ("123" → "1.2.3"), completes the version on blur
// ("1.2" → "1.2.0"), and offers suggested values in a "Suggest" menu inside the field.
export default function RHFVersionField({ name, suggestions = [], ...other }) {
  const { control, setValue } = useFormContext();
  const manual = useRef(false);
  // Fast typing fires several change events before React re-renders, so field.value can be
  // stale; the last value we produced is tracked here synchronously instead
  const lastValue = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const closeMenu = () => setMenuAnchor(null);

  const applySuggestion = (value) => {
    closeMenu();
    manual.current = false;
    lastValue.current = value;
    setValue(name, value, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="1.2.3"
            autoComplete="off"
            inputProps={{ inputMode: 'decimal', spellCheck: false, 'aria-label': other.label }}
            onFocus={(event) => {
              manual.current = false;
              event.target.select();
            }}
            onChange={(event) => {
              const prev = lastValue.current ?? field.value ?? '';
              const { data, inputType } = event.nativeEvent ?? {};
              // Typed or pasted dots (e.g. pasting "1.10" over a selection) keep the user's dots
              const userDot =
                (data ?? '').includes('.') ||
                (inputType === 'insertFromPaste' && event.target.value.includes('.'));
              const next = formatVersionInput(prev, event.target.value, manual.current || userDot);
              manual.current = next.manual;
              lastValue.current = next.value;
              field.onChange(next.value);
            }}
            onBlur={() => {
              const current = lastValue.current ?? field.value ?? '';
              const normalized = normalizeVersion(current);
              lastValue.current = null;
              if (normalized !== current) field.onChange(normalized);
              field.onBlur();
            }}
            error={!!error}
            helperText={error?.message}
            InputProps={{
              endAdornment: suggestions.length > 0 && (
                <InputAdornment position="end" sx={{ mr: -0.5 }}>
                  <GhostButton
                    aria-haspopup="menu"
                    aria-expanded={!!menuAnchor}
                    onClick={(event) => setMenuAnchor(event.currentTarget)}
                  >
                    <Iconify icon={ICONS.quickSet} width={14} />
                    Suggest
                    <Iconify icon={ICONS.chevronDown} width={12} />
                  </GhostButton>
                </InputAdornment>
              ),
            }}
            {...other}
            label={undefined}
          />
        )}
      />

      <CustomPopover
        open={menuAnchor}
        onClose={closeMenu}
        arrow="top-right"
        sx={{
          p: 0.75,
          minWidth: 260,
          bgcolor: '#FFFFFF',
          backgroundImage: 'none',
          border: `1px solid ${COLORS.border}`,
          borderBottom: `3px solid ${COLORS.border}`,
        }}
      >
        <MenuList autoFocusItem disablePadding>
          {suggestions.map((suggestion) => (
            <MenuItem
              key={suggestion.label}
              onClick={() => applySuggestion(suggestion.value)}
              sx={{ display: 'block', borderRadius: 1, px: 1.25, py: 1 }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                  {suggestion.label}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  {suggestion.value}
                </Typography>
              </Stack>
              {suggestion.hint && (
                <Typography
                  sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25, whiteSpace: 'normal' }}
                >
                  {suggestion.hint}
                </Typography>
              )}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}

RHFVersionField.propTypes = {
  name: PropTypes.string.isRequired,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      hint: PropTypes.string,
    })
  ),
};
