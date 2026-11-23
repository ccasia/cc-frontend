import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import { Box, Stack, Tooltip, InputBase, Typography } from '@mui/material';

import { formatNumber } from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';

import { CC } from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/creator-field-tokens';
import { barTipProps } from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/engagement-breakdown';

import { scrapeFailureMessage, scrapeFailureHeadline } from './scrape-failure-copy';

const WARNING = '#FFAB00';
const BLUE = '#1340FF';
const AUTOSAVE_DELAY_MS = 1200;

/** Same height as a metric number, so every slot lines up with the numbers beside it. */
export const NUMBER_HEIGHT = { md: 31, lg: 40, xl: 44 };

const numberSx = {
  fontFamily: 'Instrument Serif',
  fontSize: { xs: 24, md: 28, lg: 36, xl: 40 },
  fontWeight: 400,
  lineHeight: 1.1,
};

const withCommas = (digits) => (digits === '' ? '' : Number(digits).toLocaleString('en-US'));
const toText = (value) => (typeof value === 'number' ? String(value) : '');

function FailureTooltipTitle({ failure }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Iconify icon="eva:alert-triangle-fill" width={16} sx={{ color: WARNING, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: '18px', color: CC.onyx }}>
          {scrapeFailureHeadline(failure)}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.5, fontSize: 13, lineHeight: '18px', color: CC.grey50 }}>
        {scrapeFailureMessage(failure)}
      </Typography>
    </Box>
  );
}

FailureTooltipTitle.propTypes = { failure: PropTypes.object };

/** Warning icon beside a metric label. The tooltip says why the number is missing. */
export function MissingMetricIcon({ label, failure }) {
  return (
    <Tooltip
      title={<FailureTooltipTitle failure={failure} />}
      arrow
      placement="top"
      componentsProps={barTipProps}
    >
      <Box
        component="span"
        tabIndex={0}
        aria-label={`${label} missing. ${scrapeFailureMessage(failure)}`}
        sx={{
          display: 'inline-flex',
          verticalAlign: 'middle',
          ml: 0.5,
          cursor: 'help',
          borderRadius: '50%',
          outline: 'none',
          '&:focus-visible': { boxShadow: `0 0 0 2px ${WARNING}` },
        }}
      >
        <Iconify icon="eva:alert-triangle-fill" width={16} sx={{ color: WARNING }} />
      </Box>
    </Tooltip>
  );
}

MissingMetricIcon.propTypes = { label: PropTypes.string, failure: PropTypes.object };

/**
 * One counter of a failed scrape. While the admin can still enter it, it is an open
 * input that saves when it loses focus. Otherwise it shows the number, or "–".
 */
export default function MissingMetricField({ label, value, editable, saving, onSave }) {
  const [text, setText] = useState(toText(value));
  const focusedRef = useRef(false);
  const cancelledRef = useRef(false);

  // A saved or reloaded value shows unless the admin is typing in this field.
  useEffect(() => {
    if (!focusedRef.current) setText(toText(value));
  }, [value]);

  // Also save after a pause in typing, so a refresh does not lose a number still in focus.
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  useEffect(() => {
    if (!editable || !focusedRef.current || text === '' || Number(text) === value) return undefined;
    const timer = setTimeout(() => onSaveRef.current(Number(text)), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, value, editable]);

  if (!editable) {
    const known = typeof value === 'number';
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: NUMBER_HEIGHT }}>
        <Typography sx={{ ...numberSx, color: known ? BLUE : '#B0B0B0' }}>
          {known ? formatNumber(value) : '–'}
        </Typography>
      </Box>
    );
  }

  const commit = () => {
    focusedRef.current = false;
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setText(toText(value));
      return;
    }
    if (text === '' || Number(text) === value) {
      setText(toText(value));
      return;
    }
    onSave(Number(text));
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: NUMBER_HEIGHT }}>
      <InputBase
        value={withCommas(text)}
        placeholder="Enter"
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(event) => setText(event.target.value.replace(/\D/g, '').slice(0, 10))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            cancelledRef.current = true;
            event.currentTarget.blur();
          }
        }}
        inputProps={{ inputMode: 'numeric', 'aria-label': `Enter ${label.toLowerCase()}` }}
        sx={{
          width: '100%',
          maxWidth: 120,
          height: { xs: 32, md: 28, lg: 34 },
          px: 1,
          borderRadius: 1,
          bgcolor: '#FFFFFF',
          border: '1px solid #E7E7E7',
          fontSize: { md: 14, lg: 16 },
          fontWeight: 600,
          color: CC.onyx,
          fontVariantNumeric: 'tabular-nums',
          opacity: saving ? 0.5 : 1,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
          '&:hover': { borderColor: '#B0B0B0' },
          '&.Mui-focused': { borderColor: BLUE, boxShadow: '0 0 0 2px rgba(19, 64, 255, 0.12)' },
          '& input::placeholder': { color: '#B0B0B0', opacity: 1, fontWeight: 400 },
        }}
      />
    </Box>
  );
}

MissingMetricField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  /** The admin may still type this number. */
  editable: PropTypes.bool,
  saving: PropTypes.bool,
  onSave: PropTypes.func,
};
