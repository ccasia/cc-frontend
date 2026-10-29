import React from 'react';
import PropTypes from 'prop-types';

import { Box, Grid } from '@mui/material';

import RenderEngagementCard from './RenderEngagementCard';
import { useAnalyticsStore } from '../stores/analytics.store';

const CoreMetricsSection = ({
  summaryStats: stats,
  availablePlatforms,
  filteredInsightsData,
  filteredSubmissions,
  findTopPerformerByMetric,
}) => {
  const selectedPlatform = useAnalyticsStore((state) => state.selectedPlatform);

  // Define metrics configuration
  const metricsConfig = [
    {
      key: 'views',
      label: 'Views',
      value: stats.totalViews,
      metricKey: 'views',
    },
    {
      key: 'likes',
      label: 'Likes',
      value: stats.totalLikes,
      metricKey: 'likes',
    },
    {
      key: 'shares',
      label: 'Shares',
      value: stats.totalShares,
      metricKey: 'shares',
    },
    {
      key: 'saved',
      label: 'Saves',
      value: stats.totalSaved,
      metricKey: 'saved',
      // Only show for Instagram (not for TikTok)
      condition:
        selectedPlatform !== 'TikTok' &&
        (selectedPlatform === 'Instagram' ||
          (selectedPlatform === 'ALL' && availablePlatforms.includes('Instagram'))),
    },
  ].filter((metric) => metric.condition !== false);

  if (!stats) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {metricsConfig.map((metric) => (
          <Grid item xs={6} sm={6} md={3} key={metric.key}>
            <RenderEngagementCard
              title={metric.label}
              value={metric.value}
              metricKey={metric.metricKey}
              filteredInsightsData={filteredInsightsData}
              filteredSubmissions={filteredSubmissions}
              findTopPerformerByMetric={findTopPerformerByMetric}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CoreMetricsSection;

CoreMetricsSection.propTypes = {
  summaryStats: PropTypes.object,
  availablePlatforms: PropTypes.array,
  filteredInsightsData: PropTypes.array,
  filteredSubmissions: PropTypes.array,
  findTopPerformerByMetric: PropTypes.array,
};
