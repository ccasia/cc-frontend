import { useLocales as getLocales } from 'src/locales';

export function fData(inputValue) {
  if (!inputValue) return '';

  if (inputValue === 0) return '0 Bytes';

  const units = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];

  const decimal = 2;

  const baseValue = 1024;

  const number = Number(inputValue);

  const index = Math.floor(Math.log(number) / Math.log(baseValue));

  const fm = `${parseFloat((number / baseValue ** index).toFixed(decimal))} ${units[index]}`;

  return fm;
}

function getLocaleCode() {
  const {
    currentLang: {
      numberFormat: { code, currency },
    },
  } = getLocales();

  return {
    code: code ?? 'RM-MY',
    currency: currency ?? 'MYR',
  };
}

export function fNumber(inputValue) {
  const { code } = getLocaleCode();

  if (!inputValue) return '';

  const number = Number(inputValue);

  const fm = new Intl.NumberFormat(code, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);

  return fm;
}

export function fShortenNumber(inputValue) {
  const { code } = getLocaleCode();

  if (!inputValue) return '';

  const number = Number(inputValue);

  const fm = new Intl.NumberFormat(code, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(number);

  return fm.replace(/[A-Z]/g, (match) => match.toLowerCase());
}

export function fCurrency(inputValue) {
  const { code, currency } = getLocaleCode();

  if (!inputValue) return '';

  const number = Number(inputValue);

  const fm = new Intl.NumberFormat(code, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);

  return fm;
}
