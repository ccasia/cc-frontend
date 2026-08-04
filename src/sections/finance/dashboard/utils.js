// Shared helpers for the finance dashboard.

export const CARD_BORDER = '#E8ECEE';

export const formatAmount = (value) =>
  (value || 0).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Utilisation severity colors: red when nearly exhausted, amber when high.
export const utilisationColor = (pct) => {
  if (pct === null || pct === undefined) return '#919EAB';
  if (pct >= 90) return '#FF5630';
  if (pct >= 75) return '#FFAB00';
  return '#22C55E';
};

export const maxUtilisation = (client) => Math.max(client.ugc.pct ?? 0, client.budget.pct ?? 0);
