import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance, { endpoints } from 'src/utils/axios';

export const useSocialInsights = (postingSubmissions, campaignId) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedUrls, setFailedUrls] = useState([]);

  const fetchInsights = useCallback(async () => {
    if (!postingSubmissions || postingSubmissions.length === 0) {
      setData([]);
      setFailedUrls([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const insights = [];
    const failed = [];
    
    try {
      for (const submission of postingSubmissions) {
        if (!submission.user || !submission.postUrl) {
          failed.push({
            submissionId: submission.id,
            reason: 'Missing user ID or post URL',
            url: submission.postUrl,
          });
          continue;
        }
        
        try {
          let endpoint;
          if (submission.platform === 'Instagram') {
            endpoint = endpoints.creators.social.getInstagramMediaInsight(
              submission.user,
              encodeURIComponent(submission.postUrl),
              campaignId
            );
          } else if (submission.platform === 'TikTok') {
            endpoint = endpoints.creators.social.getTikTokMediaInsight(
              submission.user,
              encodeURIComponent(submission.postUrl),
              campaignId
            );
          }
          
          if (endpoint) {
            const response = await axiosInstance.get(endpoint);
            insights.push({
              submissionId: submission.id,
              platform: submission.platform,
              user: submission.user,
              postUrl: submission.postUrl,
              thumbnail: response.data.video.thumbnail_url,
              insight: response.data.insight || [],
              video: response.data.video || null,
              createdAt: submission.createdAt,
            });
          }
        } catch (fetchError) {
          console.error(`Error fetching insights for ${submission.platform} post:`, fetchError);
          failed.push({
            submissionId: submission.id,
            platform: submission.platform,
            user: submission.user,
            reason: fetchError.response?.data?.message || fetchError.message,
            url: submission.postUrl,
            requiresReconnection: fetchError.response?.data?.requiresReconnection || false,
          });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setData(insights);
      setFailedUrls(failed);
    } catch (err) {
      console.error('Error fetching social insights:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [postingSubmissions, campaignId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
      error,
      failedUrls,
      mutate: fetchInsights, // For manual refresh
    }),
    [data, isLoading, error, failedUrls, fetchInsights]
  );

  return memoizedValue;
};
