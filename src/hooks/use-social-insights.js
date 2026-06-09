// import { useMemo, useState, useEffect, useCallback } from 'react';

// import axiosInstance, { endpoints } from 'src/utils/axios';

// // Global cache for insights data
// const insightsCache = new Map();
// const campaignAveragesCache = new Map();

// // Cache utilities
// const createCacheKey = (postingSubmissions, campaignId) => {
//   const urls = postingSubmissions
//     .map((s) => `${s.platform}_${s.postUrl}_${s.user}`)
//     .sort()
//     .join('|');
//   return `${campaignId}_${btoa(urls).slice(0, 20)}`;
// };

// const isCacheValid = (
//   timestamp,
//   ttl = 300_000 // 5 minutes default TTL
// ) => Date.now() - timestamp < ttl;

// const cleanOldCache = (cache, maxSize = 20) => {
//   if (cache.size > maxSize) {
//     const entries = Array.from(cache.entries());
//     // Sort by timestamp and remove oldest
//     entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
//     const toRemove = entries.slice(0, cache.size - maxSize);
//     toRemove.forEach(([key]) => cache.delete(key));
//   }
// };

// export const useSocialInsights = (postingSubmissions, campaignId) => {
//   const [data, setData] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [failedUrls, setFailedUrls] = useState([]);
//   const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });

//   const cacheKey = useMemo(
//     () => createCacheKey(postingSubmissions, campaignId),
//     [postingSubmissions, campaignId]
//   );

//   const fetchInsights = useCallback(async () => {
//     if (!postingSubmissions || postingSubmissions.length === 0) {
//       setData([]);
//       setFailedUrls([]);
//       setIsLoading(false);
//       setLoadingProgress({ loaded: 0, total: 0 });
//       return;
//     }

//     // Check cache first
//     if (insightsCache.has(cacheKey)) {
//       const cached = insightsCache.get(cacheKey);
//       if (isCacheValid(cached.timestamp)) {
//         console.log('📦 Using cached insights data');
//         setData(cached.data);
//         setFailedUrls(cached.failedUrls);
//         setIsLoading(false);
//         setLoadingProgress({ loaded: cached.data.length, total: postingSubmissions.length });
//         return;
//       }
//       // Remove expired cache
//       insightsCache.delete(cacheKey);
//     }

//     setIsLoading(true);
//     setError(null);
//     setLoadingProgress({ loaded: 0, total: postingSubmissions.length });
//     const insights = [];
//     const failed = [];

//     try {
//       // Create individual submission cache keys for granular caching
//       const submissionCacheKeys = postingSubmissions.map(
//         (submission) =>
//           `${submission.platform}_${submission.user}_${encodeURIComponent(submission.postUrl)}_${campaignId}`
//       );

//       // Check which submissions are already cached
//       const cachedSubmissions = [];
//       const uncachedSubmissions = [];

//       postingSubmissions.forEach((submission, index) => {
//         const subCacheKey = submissionCacheKeys[index];
//         if (insightsCache.has(subCacheKey)) {
//           const cached = insightsCache.get(subCacheKey);
//           if (isCacheValid(cached.timestamp, 600000)) {
//             // 10 minutes TTL for individual insights
//             cachedSubmissions.push(cached.data);
//           } else {
//             insightsCache.delete(subCacheKey);
//             uncachedSubmissions.push({ submission, cacheKey: subCacheKey });
//           }
//         } else {
//           uncachedSubmissions.push({ submission, cacheKey: subCacheKey });
//         }
//       });

//       console.log(
//         `📊 Found ${cachedSubmissions.length} cached, ${uncachedSubmissions.length} need fetching`
//       );

//       // Add cached data immediately
//       insights.push(...cachedSubmissions);
//       setData([...insights]);
//       setLoadingProgress({ loaded: insights.length, total: postingSubmissions.length });

//       // Process uncached submissions in batches
//       if (uncachedSubmissions.length > 0) {
//         const batchSize = 3;
//         const batches = [];

//         for (let i = 0; i < uncachedSubmissions.length; i += batchSize) {
//           batches.push(uncachedSubmissions.slice(i, i + batchSize));
//         }

//         // Process batches sequentially to respect rate limits
//         // eslint-disable-next-line no-restricted-syntax
//         for (const batch of batches) {
//           // eslint-disable-next-line no-await-in-loop
//           const batchPromises = batch.map(async ({ submission, cacheKey: submissionCacheKey }) => {
//             if (!submission.user || !submission.postUrl) {
//               return {
//                 failed: {
//                   submissionId: submission.id,
//                   reason: 'Missing user ID or post URL',
//                   url: submission.postUrl,
//                 },
//               };
//             }

//             try {
//               let endpoint;
//               if (submission.platform === 'Instagram') {
//                 endpoint = endpoints.creators.social.getInstagramMediaInsight(
//                   submission.user,
//                   encodeURIComponent(submission.postUrl),
//                   campaignId
//                 );
//               } else if (submission.platform === 'TikTok') {
//                 endpoint = endpoints.creators.social.getTikTokMediaInsight(
//                   submission.user,
//                   encodeURIComponent(submission.postUrl),
//                   campaignId
//                 );
//               }

//               if (endpoint) {
//                 const response = await axiosInstance.get(endpoint);
//                 const insightData = {
//                   submissionId: submission.id,
//                   platform: submission.platform,
//                   user: submission.user,
//                   postUrl: submission.postUrl,
//                   thumbnail: response.data.video?.thumbnail_url || response.data.video?.media_url,
//                   insight: response.data.insight || [],
//                   video: response.data.video || null,
//                   createdAt: submission.createdAt,
//                   // Include campaign comparison data if available
//                   campaignAverages: response.data.campaignAverages || null,
//                   campaignComparison: response.data.campaignComparison || null,
//                   hasCampaignData: response.data.hasCampaignData || false,
//                 };

//                 // Cache individual insight
//                 insightsCache.set(submissionCacheKey, {
//                   data: insightData,
//                   timestamp: Date.now(),
//                 });

//                 return { insight: insightData };
//               }
//               return {
//                 failed: {
//                   submissionId: submission.id,
//                   reason: 'No endpoint found',
//                   url: submission.postUrl,
//                 },
//               };
//             } catch (fetchError) {
//               console.error(`Error fetching insight for ${submission.postUrl}:`, fetchError);
//               return {
//                 failed: {
//                   submissionId: submission.id,
//                   platform: submission.platform,
//                   user: submission.user,
//                   reason: fetchError.response?.data?.message || fetchError.message,
//                   url: submission.postUrl,
//                   requiresReconnection: fetchError.response?.data?.requiresReconnection || false,
//                 },
//               };
//             }
//           });

//           // eslint-disable-next-line no-await-in-loop
//           const batchResults = await Promise.all(batchPromises);
//           const batchInsights = [];
//           const batchFailed = [];

//           batchResults.forEach((result) => {
//             if (result.insight) {
//               batchInsights.push(result.insight);
//             } else if (result.failed) {
//               batchFailed.push(result.failed);
//             }
//           });

//           // Update state with new batch data
//           insights.push(...batchInsights);
//           failed.push(...batchFailed);
//           setData([...insights]);
//           setFailedUrls([...failed]);
//           setLoadingProgress({ loaded: insights.length, total: postingSubmissions.length });

//           // Small delay between batches to respect rate limits
//           if (batches.indexOf(batch) < batches.length - 1) {
//             // eslint-disable-next-line no-await-in-loop
//             await new Promise((resolve) => {
//               setTimeout(resolve, 200);
//             });
//           }
//         }
//       }

//       // Cache the complete result
//       insightsCache.set(cacheKey, {
//         data: insights,
//         failedUrls: failed,
//         timestamp: Date.now(),
//       });

//       // Clean old cache entries
//       cleanOldCache(insightsCache);

//       setData(insights);
//       setFailedUrls(failed);

//       console.log(`✅ Completed fetching ${insights.length} insights (${failed.length} failed)`);
//     } catch (err) {
//       console.error('Error fetching social insights:', err);
//       setError(err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [postingSubmissions, campaignId, cacheKey]);

//   useEffect(() => {
//     fetchInsights();
//   }, [fetchInsights]);

//   // Function to clear cache for this campaign
//   const clearCache = useCallback(() => {
//     console.log('🗑️ Clearing cache for campaign:', campaignId);
//     insightsCache.delete(cacheKey);
//     // Also clear individual submission caches for this campaign
//     const keysToDelete = [];
//     // eslint-disable-next-line no-restricted-syntax
//     for (const [key] of insightsCache.entries()) {
//       if (key.includes(campaignId)) {
//         keysToDelete.push(key);
//       }
//     }
//     keysToDelete.forEach((key) => insightsCache.delete(key));
//   }, [cacheKey, campaignId]);

//   const memoizedValue = useMemo(
//     () => ({
//       data,
//       isLoading,
//       error,
//       failedUrls,
//       loadingProgress,
//       mutate: fetchInsights, // For manual refresh
//       clearCache, // Expose cache clearing function
//     }),
//     [data, isLoading, error, failedUrls, loadingProgress, fetchInsights, clearCache]
//   );

//   return memoizedValue;
// };

// // Export cache utilities for debugging/monitoring
// export const getCacheStats = () => ({
//   insightsCacheSize: insightsCache.size,
//   campaignAveragesCacheSize: campaignAveragesCache.size,
//   insightsCacheKeys: Array.from(insightsCache.keys()),
//   campaignAveragesCacheKeys: Array.from(campaignAveragesCache.keys()),
// });

// export const clearAllCaches = () => {
//   insightsCache.clear();
//   campaignAveragesCache.clear();
//   console.log('🗑️ All caches cleared');
// };

import pLimit from 'p-limit';
import { useMemo, useCallback } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

// Cap concurrent insight requests to respect the API's rate limits.
// Shared at module scope so the limit holds across EVERY query in the hook,
// not per-component. This replaces the manual batch-of-3 + 200ms delay.
const limit = pLimit(3);

const INSIGHT_STALE_TIME = 10 * 60 * 1000; // 10 min — was the per-submission TTL
const INSIGHT_GC_TIME = 15 * 60 * 1000; // 15 min — keep in cache a bit past stale

const buildEndpoint = (submission, campaignId) => {
  const url = encodeURIComponent(submission.postUrl);
  if (submission.platform === 'Instagram') {
    return endpoints.creators.social.getInstagramMediaInsight(submission.user, url, campaignId);
  }
  if (submission.platform === 'TikTok') {
    return endpoints.creators.social.getTikTokMediaInsight(submission.user, url, campaignId);
  }
  return null;
};

const fetchInsight = (submission, campaignId) =>
  limit(async () => {
    const endpoint = buildEndpoint(submission, campaignId);
    if (!endpoint) {
      throw new Error(`Unsupported platform: ${submission.platform}`);
    }

    const { data: res } = await axiosInstance.get(endpoint);

    return {
      submissionId: submission.id,
      platform: submission.platform,
      user: submission.user,
      postUrl: submission.postUrl,
      thumbnail: res.video?.thumbnail_url || res.video?.media_url,
      insight: res.insight || [],
      video: res.video || null,
      createdAt: submission.createdAt,
      campaignAverages: res.campaignAverages || null,
      campaignComparison: res.campaignComparison || null,
      hasCampaignData: res.hasCampaignData || false,
    };
  });

const insightQueryKey = (campaignId, submission) => [
  'socialInsight',
  campaignId,
  submission.platform,
  submission.user,
  submission.postUrl,
];

export const useSocialInsights = (postingSubmissions, campaignId) => {
  const queryClient = useQueryClient();
  const submissions = postingSubmissions ?? [];

  const queries = useQueries({
    queries: submissions.map((submission) => {
      const hasRequiredFields = Boolean(submission.user && submission.postUrl);
      return {
        queryKey: insightQueryKey(campaignId, submission),
        queryFn: () => fetchInsight(submission, campaignId),
        // Disabled queries never run; missing-field submissions are surfaced
        // as failures in the derivation below, matching the old behaviour.
        enabled: hasRequiredFields,
        staleTime: INSIGHT_STALE_TIME,
        gcTime: INSIGHT_GC_TIME,
        // Don't retry auth/reconnection failures — they won't fix themselves.
        retry: (failureCount, error) => {
          if (error?.response?.data?.requiresReconnection) return false;
          return failureCount < 2;
        },
      };
    }),
  });

  // Stable signal so the derivations below only recompute when query state
  // (or the submission set) actually changes, not on every render.
  const signal = submissions
    .map(
      (s, i) =>
        `${s.id}:${queries[i]?.status ?? 'idle'}:${queries[i]?.dataUpdatedAt ?? 0}:${
          queries[i]?.errorUpdatedAt ?? 0
        }`
    )
    .join('|');

  const { data, failedUrls, loadingProgress, isLoading, error } = useMemo(() => {
    const ok = [];
    const failed = [];
    let settled = 0;

    submissions.forEach((submission, i) => {
      const q = queries[i];

      if (!submission.user || !submission.postUrl) {
        failed.push({
          submissionId: submission.id,
          reason: 'Missing user ID or post URL',
          url: submission.postUrl,
        });
        settled += 1;
        return;
      }

      if (!q) return;

      if (q.isSuccess) {
        ok.push(q.data);
        settled += 1;
      } else if (q.isError) {
        failed.push({
          submissionId: submission.id,
          platform: submission.platform,
          user: submission.user,
          reason: q.error?.response?.data?.message || q.error?.message,
          url: submission.postUrl,
          requiresReconnection: q.error?.response?.data?.requiresReconnection || false,
        });
        settled += 1;
      }
    });

    return {
      data: ok,
      failedUrls: failed,
      loadingProgress: { loaded: settled, total: submissions.length },
      isLoading: queries.some((q) => q?.isLoading),
      error: queries.find((q) => q?.isError)?.error ?? null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal]);

  // Manual refresh — refetch everything for this campaign.
  const mutate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['socialInsight', campaignId] }),
    [queryClient, campaignId]
  );

  // Drop all cached insights for this campaign.
  const clearCache = useCallback(
    () => queryClient.removeQueries({ queryKey: ['socialInsight', campaignId] }),
    [queryClient, campaignId]
  );

  return useMemo(
    () => ({ data, isLoading, error, failedUrls, loadingProgress, mutate, clearCache }),
    [data, isLoading, error, failedUrls, loadingProgress, mutate, clearCache]
  );
};
