import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { countries } from 'src/assets/data';

// ----------------------------------------------------------------------

const DIAL_CODES = [
  ...new Set(countries.map((c) => c.phone.replace(/\D/g, '')).filter(Boolean)),
].sort((a, b) => b.length - a.length);

const PRIMARY_ISO = {
  1: 'US',
  7: 'RU',
  44: 'GB',
  47: 'NO',
  61: 'AU',
  212: 'MA',
  262: 'RE',
  358: 'FI',
  500: 'FK',
  590: 'GP',
  672: 'NF',
};

const DIGITS_TO_ISO = new Map(
  countries.filter((c) => c.phone).map((c) => [c.phone.replace(/\D/g, ''), c.code])
);

const DEFAULT_ISO = 'MY';

function isoForDigits(digits) {
  return PRIMARY_ISO[digits] ?? DIGITS_TO_ISO.get(digits);
}

export function parseStoredPhone(stored) {
  if (!stored) return { iso: DEFAULT_ISO, nationalNumber: '' };

  const isExplicitCode = stored.trim().startsWith('+');
  const digits = stored.replace(/\D/g, '');

  if (!digits) return { iso: DEFAULT_ISO, nationalNumber: '' };

  if (digits.startsWith('0')) {
    return { iso: DEFAULT_ISO, nationalNumber: digits.slice(1) };
  }

  const match = DIAL_CODES.find((code) => digits.startsWith(code));

  if (!match) return { iso: DEFAULT_ISO, nationalNumber: digits };

  if (match === '1' && !isExplicitCode && digits.length <= 10) {
    return { iso: DEFAULT_ISO, nationalNumber: digits };
  }

  let nationalNumber = digits.slice(match.length);
  if (nationalNumber.startsWith('0')) nationalNumber = nationalNumber.slice(1);

  return { iso: isoForDigits(match) ?? DEFAULT_ISO, nationalNumber };
}

export function dialCodeFromIso(iso) {
  return countries.find((c) => c.code === iso)?.phone ?? '';
}

export function isoFromCountryLabel(label) {
  if (!label) return undefined;
  return countries.find((c) => c.label === label)?.code;
}

export function toE164(iso, nationalNumber) {
  if (!nationalNumber) return '';

  if (String(nationalNumber).trim().startsWith('+')) {
    const direct = parsePhoneNumberFromString(String(nationalNumber).replace(/[^\d+]/g, ''));
    if (direct?.isValid()) return direct.number;
  }

  const dialCode = dialCodeFromIso(iso);
  const raw = `+${String(dialCode).replace(/\D/g, '')}${String(nationalNumber).replace(/\D/g, '')}`;
  const parsed = parsePhoneNumberFromString(raw);

  return parsed?.isValid() ? parsed.number : raw;
}
