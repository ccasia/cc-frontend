import useSWR from 'swr';
import axios from 'axios';

/**
 * Hook to fetch the daily engagement time series for a single post.
 *
 * Lookup key: pass either `submissionId` OR `postUrl` (postUrl wins if both
 * are given). The content performance report uses the URL form because it
 * has the post URL but not the submission ID.
 *
 *   - submissionId → GET /:campaignId/post-engagement-snapshots/daily/:submissionId
 *   - postUrl      → GET /:campaignId/post-engagement-snapshots/daily-by-url?postUrl=<encoded>
 *
 * @param {string} campaignId
 * @param {object} options
 * @param {string} [options.submissionId]
 * @param {string} [options.postUrl]
 * @param {number} [options.days] - default: every stored day, so a finished campaign keeps its history
 */
export const useGetPostDailyTrend = (campaignId, { submissionId, postUrl, days } = {}) => {
  const daysQuery = days ? `days=${days}` : '';
  let url = null;
  if (campaignId && postUrl) {
    url = `/api/campaign/${campaignId}/post-engagement-snapshots/daily-by-url?postUrl=${encodeURIComponent(
      postUrl
    )}${daysQuery ? `&${daysQuery}` : ''}`;
  } else if (campaignId && submissionId) {
    url = `/api/campaign/${campaignId}/post-engagement-snapshots/daily/${submissionId}${
      daysQuery ? `?${daysQuery}` : ''
    }`;
  }

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
      dedupingInterval: 60000,
    }
  );

  return {
    trendData: data,
    isLoading,
    error,
    mutate,
  };
};
