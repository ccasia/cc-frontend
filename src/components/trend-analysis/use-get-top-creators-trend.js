import useSWR from 'swr';
import axios from 'axios';

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
  const url = campaignId
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

  return {
    trendData: data,
    isLoading,
    error,
    mutate,
  };
};
