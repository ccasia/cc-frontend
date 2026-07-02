import useSWR from 'swr';
import axios from 'axios';

import { DEMO_CAMPAIGN_ID, demoEngagementHeatmap } from 'src/_mock/_demo-campaign';

const noop = () => {};

/**
 * Hook to fetch engagement rate heatmap data for a campaign
 * @param {string} campaignId - Campaign ID
 * @param {object} options - Configuration options
 * @param {string} options.platform - Platform filter ('Instagram', 'TikTok', 'All')
 * @param {number} options.weeks - Number of weeks to fetch (default: 6)
 * @returns {object} SWR data object with heatmap data
 */
export const useGetEngagementHeatmap = (
  campaignId,
  { platform = 'All', weeks = 6 } = {}
) => {
  // Demo campaign: serve mocked heatmap data (no live API call).
  const isDemoCampaign = campaignId === DEMO_CAMPAIGN_ID;

  const url =
    campaignId && !isDemoCampaign
      ? `/api/campaign/${campaignId}/trends/engagement-heatmap?platform=${platform}&weeks=${weeks}`
      : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    async (apiUrl) => {
      const response = await axios.get(apiUrl);
      return response.data.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  if (isDemoCampaign) {
    return {
      heatmapData: demoEngagementHeatmap,
      isLoading: false,
      error: undefined,
      mutate: noop,
    };
  }

  return {
    heatmapData: data,
    isLoading,
    error,
    mutate,
  };
};
