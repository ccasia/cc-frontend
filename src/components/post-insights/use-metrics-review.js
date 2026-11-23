import { enqueueSnackbar } from 'notistack';

import { METRIC_LABELS } from 'src/components/campaign-analytics/scrape-metrics';

import { useReviewPostInsightMetrics } from './use-post-insights';

export const formatCount = (value) =>
  typeof value === 'number' ? value.toLocaleString('en-US') : '–';

// The lower screenshot numbers, each with the number it would replace.
export const lowerMetrics = (pending) =>
  Object.keys(METRIC_LABELS)
    .filter((key) => typeof pending?.values?.[key] === 'number')
    .map((key) => ({
      key,
      label: METRIC_LABELS[key],
      value: pending.values[key],
      current: pending.current?.[key],
    }));

/** An admin uses the lower screenshot numbers, or keeps the current ones. */
export default function useMetricsReview(campaignId, insightId, onDone) {
  const review = useReviewPostInsightMetrics(campaignId);

  const decide = (approve) =>
    review.mutate(
      { id: insightId, approve },
      {
        onSuccess: () => {
          enqueueSnackbar(approve ? 'Screenshot numbers applied.' : 'Kept the current numbers.');
          onDone?.();
        },
        onError: (error) =>
          enqueueSnackbar(error?.message || 'Could not save your choice.', { variant: 'error' }),
      }
    );

  return {
    decide,
    isPending: review.isPending,
    approving: review.isPending && !!review.variables?.approve,
    dismissing: review.isPending && !review.variables?.approve,
  };
}
