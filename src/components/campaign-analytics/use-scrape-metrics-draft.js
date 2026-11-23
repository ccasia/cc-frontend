import { useSnackbar } from 'notistack';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';

import axiosInstance from 'src/utils/axios';

import { setScrapeDraft, clearScrapeDraft, useScrapeDraftsStore } from './scrape-drafts.store';
import { MAX_COUNT, missingFields, METRIC_LABELS, scrapeEngagementRate } from './scrape-metrics';

const EMPTY = {};

/**
 * The numbers of a failed scrape: what the scrape got, plus what an admin entered.
 * `saveField` saves one number. The server completes the post once every missing number is in.
 */
export default function useScrapeMetricsDraft({ scrapeFailure, isInstagram, campaignId, onSaved }) {
  const { enqueueSnackbar } = useSnackbar();
  const { failure, postingUrlId } = scrapeFailure;
  const partial = failure?.partial || null;
  const fields = missingFields(partial, isInstagram);

  const stored = useScrapeDraftsStore((state) => state.drafts[postingUrlId]);
  const entered = stored ?? failure?.entered ?? EMPTY;

  // New numbers from the server (a screenshot, another admin) replace this page's copy.
  const serverKey = JSON.stringify(failure?.entered ?? {});
  useEffect(() => clearScrapeDraft(postingUrlId), [serverKey, postingUrlId]);

  const saveMetric = useMutation({
    mutationFn: async ({ field, value }) => {
      const { data } = await axiosInstance.post(
        `/api/campaign/${campaignId}/post-scrapes/${postingUrlId}/metrics`,
        { [field]: value }
      );
      return data?.data;
    },
  });

  const [savingField, setSavingField] = useState(null);
  // One save at a time, so two quick saves cannot overwrite each other on the server.
  const queueRef = useRef(Promise.resolve());

  const numbers = Object.fromEntries(
    Object.keys(METRIC_LABELS).map((key) => [key, entered[key] ?? partial?.[key] ?? undefined])
  );
  const pending = fields.filter((field) => typeof entered[field] !== 'number');
  const engagementRate = pending.length ? null : scrapeEngagementRate(numbers);

  const save = async (field, value) => {
    const previous = useScrapeDraftsStore.getState().drafts[postingUrlId] ?? entered;
    if (previous[field] === value) return;

    const next = { ...previous, [field]: value };
    setScrapeDraft(postingUrlId, next);
    setSavingField(field);
    try {
      const result = await saveMetric.mutateAsync({ field, value });
      if (result?.complete) {
        enqueueSnackbar('Post metrics saved.', { variant: 'success' });
        onSaved?.();
      }
    } catch (error) {
      setScrapeDraft(postingUrlId, previous);
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || 'Could not save the number.',
        { variant: 'error' }
      );
    } finally {
      setSavingField(null);
    }
  };

  const saveField = (field, value) => {
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX_COUNT) {
      enqueueSnackbar(`${METRIC_LABELS[field]} must be a whole number up to 2 billion.`, {
        variant: 'warning',
      });
      return;
    }
    queueRef.current = queueRef.current.then(() => save(field, value));
  };

  return { fields, pending, entered, numbers, engagementRate, saveField, savingField };
}
