// Cache monitoring utility for development
import { getCacheStats, clearAllCaches } from 'src/hooks/use-social-insights';

export const CacheMonitor = {
  // Get cache statistics
  getStats: () => {
    const stats = getCacheStats();
    console.table(stats);
    return stats;
  },

  // Clear all caches
  clear: () => {
    clearAllCaches();
    console.log('🗑️ All caches cleared');
  },

  // Log cache hit/miss ratio
  logCachePerformance: () => {
    const stats = getCacheStats();
    console.log('📊 Cache Performance:', {
      insightsCacheSize: stats.insightsCacheSize,
      campaignAveragesCacheSize: stats.campaignAveragesCacheSize,
      memoryUsage: `${(JSON.stringify(stats).length / 1024).toFixed(2)} KB`,
    });
  },

  // Create a cache warmup function for popular campaigns
  warmupCache: async (campaignIds = []) => {
    console.log('🔥 Warming up cache for campaigns:', campaignIds);
    // This would trigger prefetching for specified campaigns
    // Implementation would depend on your specific use case
  },

  // Monitor cache performance over time
  startMonitoring: (intervalMs = 30000) => {
    const interval = setInterval(() => {
      CacheMonitor.logCachePerformance();
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }
};

// Add to window for easy debugging in development
if (process.env.NODE_ENV === 'development') {
  window.CacheMonitor = CacheMonitor;
  console.log('🛠️ CacheMonitor available on window.CacheMonitor');
}

export default CacheMonitor;