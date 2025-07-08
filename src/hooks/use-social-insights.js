import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance, { endpoints } from 'src/utils/axios';

// Global cache for insights data
const insightsCache = new Map();
const campaignAveragesCache = new Map();

// Cache utilities
const createCacheKey = (postingSubmissions, campaignId) => {
  const urls = postingSubmissions
    .map(s => `${s.platform}_${s.postUrl}_${s.user}`)
    .sort()
    .join('|');
  return `${campaignId}_${btoa(urls).slice(0, 20)}`;
};

const isCacheValid = (timestamp, ttl = 300000) => { // 5 minutes default TTL
  return Date.now() - timestamp < ttl;
};

const cleanOldCache = (cache, maxSize = 20) => {
  if (cache.size > maxSize) {
    const entries = Array.from(cache.entries());
    // Sort by timestamp and remove oldest
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, cache.size - maxSize);
    toRemove.forEach(([key]) => cache.delete(key));
  }
};

export const useSocialInsights = (postingSubmissions, campaignId) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedUrls, setFailedUrls] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });

  const cacheKey = useMemo(() => 
    createCacheKey(postingSubmissions, campaignId), 
    [postingSubmissions, campaignId]
  );

  const fetchInsights = useCallback(async () => {
    if (!postingSubmissions || postingSubmissions.length === 0) {
      setData([]);
      setFailedUrls([]);
      setIsLoading(false);
      setLoadingProgress({ loaded: 0, total: 0 });
      return;
    }

    // Check cache first
    if (insightsCache.has(cacheKey)) {
      const cached = insightsCache.get(cacheKey);
      if (isCacheValid(cached.timestamp)) {
        console.log('📦 Using cached insights data');
        setData(cached.data);
        setFailedUrls(cached.failedUrls);
        setIsLoading(false);
        setLoadingProgress({ loaded: cached.data.length, total: postingSubmissions.length });
        return;
      } else {
        // Remove expired cache
        insightsCache.delete(cacheKey);
      }
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress({ loaded: 0, total: postingSubmissions.length });
    const insights = [];
    const failed = [];

    try {
      // Create individual submission cache keys for granular caching
      const submissionCacheKeys = postingSubmissions.map(submission => 
        `${submission.platform}_${submission.user}_${encodeURIComponent(submission.postUrl)}_${campaignId}`
      );

      // Check which submissions are already cached
      const cachedSubmissions = [];
      const uncachedSubmissions = [];
      
      postingSubmissions.forEach((submission, index) => {
        const subCacheKey = submissionCacheKeys[index];
        if (insightsCache.has(subCacheKey)) {
          const cached = insightsCache.get(subCacheKey);
          if (isCacheValid(cached.timestamp, 600000)) { // 10 minutes TTL for individual insights
            cachedSubmissions.push(cached.data);
          } else {
            insightsCache.delete(subCacheKey);
            uncachedSubmissions.push({ submission, cacheKey: subCacheKey });
          }
        } else {
          uncachedSubmissions.push({ submission, cacheKey: subCacheKey });
        }
      });

      console.log(`📊 Found ${cachedSubmissions.length} cached, ${uncachedSubmissions.length} need fetching`);

      // Add cached data immediately
      insights.push(...cachedSubmissions);
      setData([...insights]);
      setLoadingProgress({ loaded: insights.length, total: postingSubmissions.length });

      // Process uncached submissions in batches
      if (uncachedSubmissions.length > 0) {
        const batchSize = 3;
        const batches = [];

        for (let i = 0; i < uncachedSubmissions.length; i += batchSize) {
          batches.push(uncachedSubmissions.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          const batchPromises = batch.map(async ({ submission, cacheKey }) => {
            if (!submission.user || !submission.postUrl) {
              return {
                failed: {
                  submissionId: submission.id,
                  reason: 'Missing user ID or post URL',
                  url: submission.postUrl,
                }
              };
            }

            try {
              let endpoint;
              if (submission.platform === 'Instagram') {
                endpoint = endpoints.creators.social.getInstagramMediaInsight(
                  submission.user,
                  encodeURIComponent(submission.postUrl),
                  campaignId
                );
              } else if (submission.platform === 'TikTok') {
                endpoint = endpoints.creators.social.getTikTokMediaInsight(
                  submission.user,
                  encodeURIComponent(submission.postUrl),
                  campaignId
                );
              }

              if (endpoint) {
                const response = await axiosInstance.get(endpoint);
                const insightData = {
                  submissionId: submission.id,
                  platform: submission.platform,
                  user: submission.user,
                  postUrl: submission.postUrl,
                  thumbnail: response.data.video?.thumbnail_url || response.data.video?.media_url,
                  insight: response.data.insight || [],
                  video: response.data.video || null,
                  createdAt: submission.createdAt,
                  // Include campaign comparison data if available
                  campaignAverages: response.data.campaignAverages || null,
                  campaignComparison: response.data.campaignComparison || null,
                  hasCampaignData: response.data.hasCampaignData || false,
                };

                // Cache individual insight
                insightsCache.set(cacheKey, {
                  data: insightData,
                  timestamp: Date.now()
                });

                return { insight: insightData };
              }
            } catch (fetchError) {
              console.error(`Error fetching insight for ${submission.postUrl}:`, fetchError);
              return {
                failed: {
                  submissionId: submission.id,
                  platform: submission.platform,
                  user: submission.user,
                  reason: fetchError.response?.data?.message || fetchError.message,
                  url: submission.postUrl,
                  requiresReconnection: fetchError.response?.data?.requiresReconnection || false,
                }
              };
            }
          });

          const batchResults = await Promise.all(batchPromises);
          
          // Process batch results
          const batchInsights = [];
          const batchFailed = [];

          batchResults.forEach(result => {
            if (result.insight) {
              batchInsights.push(result.insight);
            } else if (result.failed) {
              batchFailed.push(result.failed);
            }
          });

          // Update state with new batch data
          insights.push(...batchInsights);
          failed.push(...batchFailed);
          
          setData([...insights]);
          setFailedUrls([...failed]);
          setLoadingProgress({ loaded: insights.length, total: postingSubmissions.length });

          // Small delay between batches to respect rate limits
          if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }

      // Cache the complete result
      insightsCache.set(cacheKey, {
        data: insights,
        failedUrls: failed,
        timestamp: Date.now()
      });

      // Clean old cache entries
      cleanOldCache(insightsCache);

      setData(insights);
      setFailedUrls(failed);
      
      console.log(`✅ Completed fetching ${insights.length} insights (${failed.length} failed)`);
    } catch (err) {
      console.error('Error fetching social insights:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [postingSubmissions, campaignId, cacheKey]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Function to clear cache for this campaign
  const clearCache = useCallback(() => {
    console.log('🗑️ Clearing cache for campaign:', campaignId);
    insightsCache.delete(cacheKey);
    // Also clear individual submission caches for this campaign
    const keysToDelete = [];
    for (const [key] of insightsCache.entries()) {
      if (key.includes(campaignId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => insightsCache.delete(key));
  }, [cacheKey, campaignId]);

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
      error,
      failedUrls,
      loadingProgress,
      mutate: fetchInsights, // For manual refresh
      clearCache, // Expose cache clearing function
    }),
    [data, isLoading, error, failedUrls, loadingProgress, fetchInsights, clearCache]
  );

  return memoizedValue;
};

// Export cache utilities for debugging/monitoring
export const getCacheStats = () => ({
  insightsCacheSize: insightsCache.size,
  campaignAveragesCacheSize: campaignAveragesCache.size,
  insightsCacheKeys: Array.from(insightsCache.keys()),
  campaignAveragesCacheKeys: Array.from(campaignAveragesCache.keys()),
});

export const clearAllCaches = () => {
  insightsCache.clear();
  campaignAveragesCache.clear();
  console.log('🗑️ All caches cleared');
};
