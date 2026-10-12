import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import axiosInstance from 'src/utils/axios';

// Socket events are the main signal. The poll only covers a missed event.
const POLL_WHILE_PENDING_MS = 15_000;

export const pendingScrapeKey = (submissionId, platform) => `${submissionId}::${platform}`;

const fetchScrapes = (campaignId, kind) => async () => {
  const { data: res } = await axiosInstance.get(`/api/campaign/${campaignId}/post-scrapes/${kind}`);
  return res.data || [];
};

/**
 * Posting links whose Bright Data scrape is queued or running, and those whose
 * scrape failed, keyed by submission and platform. Keyed by platform, not URL:
 * a TikTok short link in the submission is stored resolved, so the URLs differ.
 */
export default function usePendingPostScrapes(campaignId) {
  const queryClient = useQueryClient();
  const baseKey = useMemo(() => ['postScrapes', campaignId], [campaignId]);
  const enabled = Boolean(campaignId);

  const { data: pending } = useQuery({
    queryKey: [...baseKey, 'pending'],
    queryFn: fetchScrapes(campaignId, 'pending'),
    enabled,
    refetchInterval: (query) => (query.state.data?.length ? POLL_WHILE_PENDING_MS : false),
  });

  const { data: failed } = useQuery({
    queryKey: [...baseKey, 'failed'],
    queryFn: fetchScrapes(campaignId, 'failed'),
    enabled,
  });

  const pendingByKey = useMemo(
    () =>
      new Map(
        (pending || []).map((scrape) => [
          pendingScrapeKey(scrape.submissionId, scrape.platform),
          // `status` feeds the loader's status line: QUEUED shows the "starting" copy.
          { status: scrape.status === 'QUEUED' ? 'QUEUED' : null, startedAt: scrape.startedAt },
        ])
      ),
    [pending]
  );

  const failedByKey = useMemo(
    () =>
      new Map(
        (failed || []).map((scrape) => [
          pendingScrapeKey(scrape.submissionId, scrape.platform),
          scrape,
        ])
      ),
    [failed]
  );

  const refetchPending = useCallback(
    () => queryClient.invalidateQueries({ queryKey: baseKey }),
    [queryClient, baseKey]
  );

  return { pendingByKey, failedByKey, refetchPending };
}
