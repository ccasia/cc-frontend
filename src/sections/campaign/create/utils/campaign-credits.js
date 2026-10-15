// Error text when the requested credits exceed the client's remaining package credits, else ''.
export const getCreditLimitError = (client, campaignCredits) => {
  const available = client?.creditSummary?.remainingCredits ?? 0;
  return Number(campaignCredits || 0) > available
    ? `Exceeds limit - credits available: ${available}`
    : '';
};
