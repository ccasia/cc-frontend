export const getMetricValue = (insight, metricName) => {
  if (!insight || !Array.isArray(insight)) return 0;
  const metric = insight.find(item => item.name === metricName);
  return metric ? metric.value : 0;
};

export const calculateSummaryStats = (insightsData) => {
  if (insightsData.length === 0) return null;

  const totalViews = insightsData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'views'), 0);
  const totalLikes = insightsData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'likes'), 0);
  const totalComments = insightsData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'comments'), 0);
  const totalShares = insightsData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'shares'), 0);
  const totalSaved = insightsData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'saved'), 0);
  const totalInteractions = insightsData.reduce((sum, item) => 
    sum + getMetricValue(item.insight, 'total_interactions'), 0);

  const avgEngagementRate = insightsData.length > 0 ? 
    insightsData.reduce((sum, item) => {
      const views = getMetricValue(item.insight, 'views');
      const likes = getMetricValue(item.insight, 'likes');
      const comments = getMetricValue(item.insight, 'comments');
      const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
      return sum + engagementRate;
    }, 0) / insightsData.length : 0;

  return {
    totalPosts: insightsData.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalSaved,
    totalInteractions,
    avgEngagementRate: avgEngagementRate.toFixed(2),
  };
};

export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

export const calculateEngagementRate = (insight) => {
  const views = getMetricValue(insight, 'views');
  const likes = getMetricValue(insight, 'likes');
  const comments = getMetricValue(insight, 'comments');
  
  if (views === 0) return 0;
  return (((likes + comments) / views) * 100).toFixed(2);
};