import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import { PlatformOverviewMobile, PlatformOverviewDesktop } from 'src/components/campaign-analytics';

import { useAnalyticsStore } from '../stores/analytics.store';

const getPlatformLabel = (platform) => {
  if (platform === 'ALL') return 'Total Creators';
  if (platform === 'Instagram') return 'Instagram Posts';
  if (platform === 'TikTok') return 'TikTok Posts';
  return '';
};

const PlatformOverviewLayout = ({
  postCount,
  insightsData,
  summaryStats,
  platformCounts,
  availablePlatforms,
  filteredInsightsData,
  filteredSubmissions,
}) => {
  const selectedPlatform = useAnalyticsStore((state) => state.selectedPlatform);

  return (
    <Box sx={{ pb: selectedPlatform === 'TikTok' ? 4 : 0 }}>
      {/* Mobile Layout */}
      <PlatformOverviewMobile
        platformCounts={platformCounts}
        selectedPlatform={selectedPlatform}
        filteredInsightsData={filteredInsightsData}
        filteredSubmissions={filteredSubmissions}
        insightsData={insightsData}
        summaryStats={summaryStats}
        availablePlatforms={availablePlatforms}
        getPlatformLabel={getPlatformLabel}
      />

      {/* Desktop Layout */}
      <PlatformOverviewDesktop
        platformCounts={platformCounts}
        selectedPlatform={selectedPlatform}
        summaryStats={summaryStats}
        availablePlatforms={availablePlatforms}
        filteredInsightsData={filteredInsightsData}
        filteredSubmissions={filteredSubmissions}
        insightsData={insightsData}
        getPlatformLabel={getPlatformLabel}
      />
    </Box>
  );
};

export default PlatformOverviewLayout;

PlatformOverviewLayout.propTypes = {
  postCount: PropTypes.number,
  insightsData: PropTypes.any,
  summaryStats: PropTypes.object,
  platformCounts: PropTypes.number,
  availablePlatforms: PropTypes.any,
  filteredInsightsData: PropTypes.array,
  filteredSubmissions: PropTypes.array,
};
