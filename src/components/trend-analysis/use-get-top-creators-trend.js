import useSWR from 'swr';
import axios from 'axios';

import { DEMO_CAMPAIGN_ID, getDemoTopCreatorsTrend } from 'src/_mock/_demo-campaign';

const noop = () => {};

/**
 * Hook to fetch top creators trend data for a campaign
 * @param {string} campaignId - Campaign ID
 * @param {object} options - Configuration options
 * @param {string} options.platform - Platform filter ('Instagram', 'TikTok', 'All')
 * @param {number} options.days - Number of days to fetch (default: 7)
 * @returns {object} SWR data object with trend data
 */
export const useGetTopCreatorsTrend = (
  campaignId,
  { platform = 'All', days = 7 } = {}
) => {
  // Demo campaign: serve mocked trend data (no live API call).
  const isDemoCampaign = campaignId === DEMO_CAMPAIGN_ID;

  const url =
    campaignId && !isDemoCampaign
      ? `/api/campaign/${campaignId}/trends/top-creators?platform=${platform}&days=${days}`
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
      trendData: getDemoTopCreatorsTrend(),
      isLoading: false,
      error: undefined,
      mutate: noop,
    };
  }

  return {
    trendData: data,
    isLoading,
    error,
    mutate,
  };
};
