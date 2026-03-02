import useSWR from 'swr';
import axios from 'axios';

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
  const url = campaignId
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

  return {
    heatmapData: data,
    isLoading,
    error,
    mutate,
  };
};
