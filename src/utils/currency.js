const CURRENCY_PREFIXES = {
  SGD: {
    prefix: '$',
    label: 'SGD',
  },
  MYR: {
    prefix: 'RM',
    label: 'MYR',
  },
  AUD: {
    prefix: '$',
    label: 'AUD',
  },
  JPY: {
    prefix: '¥',
    label: 'JPY',
  },
  IDR: {
    prefix: 'Rp',
    label: 'IDR',
  },
  USD: {
    prefix: '$',
    label: 'USD',
  },
};

export const getCurrencyPrefix = (currencyCode) => CURRENCY_PREFIXES[currencyCode]?.prefix || '';

export const getCurrencyLabel = (currencyCode) => CURRENCY_PREFIXES[currencyCode]?.label || currencyCode;

export const formatCurrencyAmount = (amount, currencyCode) => {
  const prefix = getCurrencyPrefix(currencyCode);
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${prefix} ${formattedAmount}`;
};

export const getCurrencyData = (currencyCode) => CURRENCY_PREFIXES[currencyCode] || { prefix: '', label: currencyCode };

export { CURRENCY_PREFIXES };