export const getMetricValue = (insight, metricName) => {
  if (!insight || !Array.isArray(insight)) return 0;
  const metric = insight.find(item => item.name === metricName);
  return metric ? metric.value : 0;
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  const rounded = Math.round(num);
  if (rounded >= 1000000) return `${(rounded / 1000000).toFixed(1)  }M`;
  if (rounded >= 1000) return `${(rounded / 1000).toFixed(1)  }K`;
  return rounded.toLocaleString();
};

// Format number with commas for input fields (e.g., 2000 -> "2,000")
export const formatNumberWithCommas = (num) => {
  if (num === null || num === undefined || num === '') return '';
  const numStr = String(num).replace(/,/g, '');
  const numValue = Number(numStr);
  if (Number.isNaN(numValue)) return '';
  return numValue.toLocaleString('en-US');
};

// Parse formatted number string back to number (e.g., "2,000" -> 2000)
export const parseFormattedNumber = (str) => {
  if (str === '' || str === null || str === undefined) return '';
  // Remove all commas and non-numeric characters except decimal point
  const cleaned = String(str).replace(/[^\d.]/g, '');
  return cleaned;
};

export const calculateEngagementRate = (insight) => {
  const views = getMetricValue(insight, 'views');
  const likes = getMetricValue(insight, 'likes');
  const comments = getMetricValue(insight, 'comments');
  
  if (views === 0) return 0;
  return (((likes + comments) / views) * 100).toFixed(2);
};

/**
 * Transform a manual creator entry to match the insights data structure format
 * @param {Object} entry - Manual creator entry object
 * @returns {Object} Transformed entry in insights data format
 */
export const transformManualEntryToInsight = (entry) => ({
    submissionId: null, // Manual entries don't have submissionId
    platform: entry.platform,
    user: { 
      name: entry.creatorName, 
      username: entry.creatorUsername 
    },
    postUrl: entry.postUrl || '',
    insight: [
      { name: 'views', value: entry.views },
      { name: 'likes', value: entry.likes },
      { name: 'comments', value: 0 }, // Manual entries don't have comments
      { name: 'shares', value: entry.shares },
      { name: 'saved', value: entry.saved || 0 },
      { name: 'reach', value: 0 }, // Manual entries don't have reach
    ],
    createdAt: entry.createdAt,
  });

/**
 * Calculate summary statistics from insights data and optional manual entries
 * @param {Array} insightsData - Array of insights data from API
 * @param {Array} manualEntries - Optional array of manual creator entries
 * @returns {Object|null} Summary statistics object or null if no data
 */
export const calculateSummaryStats = (insightsData, manualEntries = []) => {
  // Transform manual entries to insights format
  const transformedManualEntries = manualEntries.map(transformManualEntryToInsight);
  
  // Combine insights and manual entries
  const allData = [...insightsData, ...transformedManualEntries];
  
  if (allData.length === 0) return null;

  const totalViews = allData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'views'), 0);
  const totalLikes = allData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'likes'), 0);
  const totalComments = allData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'comments'), 0);
  const totalShares = allData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'shares'), 0);
  const totalSaved = allData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'saved'), 0);
  const totalReach = allData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'reach'), 0);
  const totalInteractions = allData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'total_interactions'), 0);

  // Calculate average engagement rate
  // For Instagram: (likes + comments + shares + saved) / views
  // For TikTok: (likes + comments + shares) / views
  const avgEngagementRate = allData.length > 0
    ? allData.reduce((sum, item) => {
        const views = getMetricValue(item.insight, 'views');
        const likes = getMetricValue(item.insight, 'likes');
        const comments = getMetricValue(item.insight, 'comments');
        const shares = getMetricValue(item.insight, 'shares');
        const saved = getMetricValue(item.insight, 'saved');
        const {platform} = item;

        let engagementRate = 0;
        if (views > 0) {
          if (platform === 'Instagram') {
            // Instagram: (likes + comments + shares + saved) / views
            engagementRate = ((likes + comments + shares + saved) / views) * 100;
          } else {
            // TikTok or other: (likes + comments + shares) / views
            engagementRate = ((likes + comments + shares) / views) * 100;
          }
        }
        return sum + engagementRate;
      }, 0) / allData.length
    : 0;

  return {
    totalPosts: allData.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalSaved,
    totalReach,
    totalInteractions,
    avgEngagementRate: avgEngagementRate.toFixed(2),
  };
};