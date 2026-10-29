import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import axiosInstance from 'src/utils/axios';
import { canonicalizePostUrl } from 'src/utils/extractPostingLinks';

const insightQueryKey = (campaignId) => ['socialInsightSnapshots', campaignId];
const SNAPSHOT_CACHE_TIME = 24 * 60 * 60 * 1000;

const getSnapshotKey = ({ platform, postUrl }) =>
  `${platform || ''}:${canonicalizePostUrl(postUrl)}`;

// A TikTok short link (vt./vm.tiktok.com) is stored resolved, so the snapshot
// is also keyed by its short code to match the link in the submission.
const getSnapshotKeys = (snapshot) =>
  snapshot.platform === 'TikTok' && snapshot.shortCode
    ? [
        getSnapshotKey(snapshot),
        getSnapshotKey({ ...snapshot, postUrl: `https://tiktok.com/${snapshot.shortCode}` }),
      ]
    : [getSnapshotKey(snapshot)];

const toInsightData = (submission, snapshot) => ({
  submissionId: submission.id,
  platform: submission.platform,
  user: submission.user,
  postUrl: submission.postUrl,
  thumbnail: snapshot.thumbnailUrl || null,
  insight: [
    { name: 'views', value: snapshot.views || 0 },
    { name: 'likes', value: snapshot.likes || 0 },
    { name: 'comments', value: snapshot.comments || 0 },
    { name: 'shares', value: snapshot.shares || 0 },
    { name: 'saved', value: snapshot.saved || 0 },
    { name: 'reach', value: snapshot.reach || 0 },
    { name: 'engagementRate', value: snapshot.engagementRate || 0 },
  ],
  video: { timestamp: snapshot.postDate },
  createdAt: submission.createdAt,
  capturedAt: snapshot.capturedAt,
  snapshotDate: snapshot.snapshotDate,
  source: snapshot.source,
});

export const useSocialInsights = (postingSubmissions, campaignId) => {
  const queryClient = useQueryClient();

  const submissions = useMemo(() => postingSubmissions ?? [], [postingSubmissions]);

  const submissionSignature = useMemo(
    () =>
      submissions
        .map((submission) => getSnapshotKey(submission))
        .sort()
        .join('|'),
    [submissions]
  );

  const query = useQuery({
    queryKey: [...insightQueryKey(campaignId), submissionSignature],
    queryFn: async () => {
      const { data: response } = await axiosInstance.get(
        `/api/campaign/${campaignId}/post-engagement-snapshots/latest`
      );

      return response.data || [];
    },
    enabled: Boolean(campaignId && submissions.length),
    staleTime: SNAPSHOT_CACHE_TIME,
    gcTime: SNAPSHOT_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retryOnMount: false,
    retry: 1,
  });

  const { data, failedUrls, loadingProgress, isLoading, error } = useMemo(() => {
    const snapshotsByPost = (query.data || []).reduce((latestByPost, snapshot) => {
      const snapshotTime = new Date(snapshot.capturedAt || snapshot.snapshotDate).getTime();

      getSnapshotKeys(snapshot).forEach((key) => {
        const current = latestByPost.get(key);
        const currentTime = new Date(current?.capturedAt || current?.snapshotDate || 0).getTime();
        if (!current || snapshotTime > currentTime) latestByPost.set(key, snapshot);
      });
      return latestByPost;
    }, new Map());

    const ok = submissions.flatMap((submission) => {
      const snapshot = snapshotsByPost.get(getSnapshotKey(submission));
      return snapshot ? [toInsightData(submission, snapshot)] : [];
    });

    const failed = submissions
      .filter((submission) => !snapshotsByPost.has(getSnapshotKey(submission)))
      .map((submission) => ({
        submissionId: submission.id,
        platform: submission.platform,
        user: submission.user,
        reason: 'No stored analytics snapshot is available yet',
        url: submission.postUrl,
        requiresReconnection: false,
      }));

    return {
      data: ok,
      failedUrls: failed,
      loadingProgress: {
        loaded: query.isFetched ? submissions.length : 0,
        total: submissions.length,
      },
      isLoading: query.isLoading && !query.isFetched,
      error: query.error ?? null,
    };
  }, [query.data, query.error, query.isFetched, query.isLoading, submissions]);

  // Explicit refreshes read the newest database snapshots without calling social APIs.
  const mutate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: insightQueryKey(campaignId) }),
    [queryClient, campaignId]
  );

  const clearCache = useCallback(
    () => queryClient.removeQueries({ queryKey: insightQueryKey(campaignId) }),
    [queryClient, campaignId]
  );

  return useMemo(
    () => ({ data, isLoading, error, failedUrls, loadingProgress, mutate, clearCache }),
    [data, isLoading, error, failedUrls, loadingProgress, mutate, clearCache]
  );
};
