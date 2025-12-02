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

export const formatCurrencyAmount = (amount, currencyCode, currencySymbol) => {
  // Use the provided currencySymbol if available, otherwise use the prefix from the currency code
  // If neither is available, fall back to the currency code itself
  let prefix;
  
  if (currencySymbol) {
    // If explicit symbol is provided, use it
    prefix = currencySymbol;
  } else if (currencyCode && CURRENCY_PREFIXES[currencyCode]) {
    // Otherwise use the prefix from the currency code
    prefix = CURRENCY_PREFIXES[currencyCode].prefix;
  } else {
    // If all else fails, use the currency code itself
    prefix = currencyCode || '';
  }
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  
  return `${prefix} ${formattedAmount}`;
};

export const getCurrencyData = (currencyCode) => CURRENCY_PREFIXES[currencyCode] || { prefix: '', label: currencyCode };

export { CURRENCY_PREFIXES };
