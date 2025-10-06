/**
 * Shared utilities for Media Kit social media components
 */

/**
 * Formats numbers for display with K, M, G suffixes
 * Handles undefined, null, and non-numeric values safely
 */
export const formatNumber = (num) => {
  // Handle undefined, null, or non-numeric values
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  
  // Convert to number if it's a string
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) {
    return '0';
  }
  
  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)}G`;
  }
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return Math.floor(number).toString();
};

/**
 * Calculates engagement rate as a percentage
 */
export const calculateEngagementRate = (engagement, followers) => {
  if (!followers || followers <= 0) return 0;
  return parseFloat(((engagement / followers) * 100).toFixed(2));
};

/**
 * Calculates total engagement from individual metrics
 */
export const calculateTotalEngagement = (metrics) => {
  const {
    likes = 0,
    comments = 0,
    shares = 0,
    saves = 0,
    like_count = 0,
    comments_count = 0,
    share_count = 0,
    saved = 0,
    like = 0,
    comment = 0
  } = metrics;

  // Handle different field name patterns (Instagram vs TikTok)
  return (
    (likes || like_count || like || 0) +
    (comments || comments_count || comment || 0) +
    (shares || share_count || 0) +
    (saves || saved || 0)
  );
};

/**
 * Gets the last N months in chronological order
 */
export const getLastNMonths = (n = 3) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11

  const lastNMonths = [];
  for (let i = n - 1; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    lastNMonths.push(months[monthIndex]);
  }
  return lastNMonths;
};

/**
 * Processes analytics data for engagement rate charts
 */
export const processEngagementRateData = (dataSource, platform = 'instagram') => {
  // Use real analytics data if available
  const engagementRates = dataSource?.analytics?.engagementRates || [];

  if (engagementRates.length > 0) {
    return engagementRates;
  }

  // Calculate from recent posts if no analytics data
  const posts = dataSource?.medias?.sortedVideos || [];
  if (posts.length >= 3) {
    return posts.slice(0, 3).map(post => {
      const engagement = calculateTotalEngagement(post);
      const followers = platform === 'instagram' 
        ? dataSource?.overview?.followers_count || 1
        : dataSource?.overview?.follower_count || 1;
      return calculateEngagementRate(engagement, followers);
    });
  }

  // Default fallback
  return [2.1, 2.8, 3.2];
};

/**
 * Processes analytics data for monthly interactions charts
 */
export const processMonthlyInteractionsData = (dataSource) => {
  // Use real analytics data if available
  const monthlyInteractions = dataSource?.analytics?.monthlyInteractions || [];

  if (monthlyInteractions.length > 0) {
    return monthlyInteractions.map(data => ({
      month: data.month,
      interactions: data.interactions || 0,
    }));
  }

  // Calculate from recent posts if no analytics data
  const posts = dataSource?.medias?.sortedVideos || [];
  if (posts.length >= 3) {
    const months = dataSource?.analytics?.months || getLastNMonths(3);
    return posts.slice(0, 3).map((post, index) => {
      const interactions = calculateTotalEngagement(post);
      return {
        month: months[index],
        interactions,
      };
    });
  }

  // Default fallback
  const fallbackMonths = getLastNMonths(3);
  return fallbackMonths.map(month => ({
    month,
    interactions: 1200 + Math.floor(Math.random() * 800),
  }));
};

/**
 * Gets months data for charts
 */
export const getMonthsData = (dataSource) => {
  const analyticsMonths = dataSource?.analytics?.months || [];
  return analyticsMonths.length > 0 ? analyticsMonths : getLastNMonths(3);
};

/**
 * Common chart styling configurations
 */
export const chartStyles = {
  lineChart: {
    '& .MuiChartsAxis-line': {
      display: 'none',
    },
    '& .MuiChartsAxis-tick': {
      display: 'none',
    },
    '& .MuiChartsGrid-line': {
      stroke: 'black',
      strokeWidth: 1,
    },
    '& .MuiChartsGrid-root .MuiChartsGrid-line': {
      strokeDasharray: 'none',
    },
    '& .MuiChartsGrid-root .MuiChartsGrid-line:not(:first-child)': {
      display: 'none',
    },
    '& .MuiLineElement-root': {
      strokeWidth: 1,
    },
    '& .MuiChartsAxisHighlight-root': {
      display: 'none !important',
    },
  },
  markStyles: {
    base: {
      fill: '#1340FF',
      stroke: '#1340FF',
      strokeWidth: 2,
      cursor: 'pointer',
    },
    hover: {
      fill: '#0F2FE6',
      stroke: '#0F2FE6',
      strokeWidth: 3,
      transform: 'scale(1.1)',
    }
  }
};

/**
 * Common responsive dimension configurations
 */
export const responsiveDimensions = {
  mobile: {
    card: {
      minWidth: 200,
      maxWidth: 240,
      minHeight: 520,
      imageHeight: 420,
      captionMaxHeight: 120,
    },
    chart: {
      width: 208,
      height: 160,
      containerWidth: '240px',
      containerHeight: '240px',
    },
  },
  tablet: {
    card: {
      minWidth: 250,
      maxWidth: 350,
      minHeight: 580,
      imageHeight: 500,
      captionMaxHeight: 120,
    },
    chart: {
      width: 310,
      height: 200,
      containerWidth: '350px',
      containerHeight: '300px',
    },
  },
  desktop: {
    card: {
      minWidth: 320,
      maxWidth: 350,
      width: 350,
      minHeight: 650,
      imageHeight: 580,
      captionMaxHeight: 60,
    },
    chart: {
      width: 450,
      height: 227,
      containerWidth: '400px',
      containerMinHeight: '311px',
    },
  }
};

/**
 * Caption styling helper based on content length and responsive state
 */
export const getCaptionStyles = (contentLength, isMobile) => {
  const isLongCaption = contentLength > 120;
  
  if (isLongCaption) {
    return {
      display: '-webkit-box',
      WebkitLineClamp: isMobile ? 4 : 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    };
  }
  
  return {
    display: '-webkit-box',
    WebkitLineClamp: isMobile ? 3 : 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
};