import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

/**
 * Hook to fetch and aggregate social media data for a creator
 * @param {string} creatorId - The creator's user ID
 * @param {Object} options - SWR options
 * @returns {Object} Combined social media data with engagement rate and follower count
 */
export function useCreatorSocialMediaData(creatorId, options = {}) {
  const { data: instagramData, error: instagramError, isLoading: instagramLoading } = useSWR(
    creatorId ? endpoints.creators.social.instagramV2(creatorId) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,        // do not revalidate just because cache is stale
      shouldRetryOnError: false,       // stop retrying on 4xx/any error
      errorRetryCount: 0,              // hard stop retries
      dedupingInterval: 300000,        // 5 min dedupe window (tune as needed)
      ...options,
    }
  );

  const { data: tiktokData, error: tiktokError, isLoading: tiktokLoading } = useSWR(
    creatorId ? endpoints.creators.social.tiktokV2(creatorId) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,        // do not revalidate just because cache is stale
      shouldRetryOnError: false,       // stop retrying on 4xx/any error
      errorRetryCount: 0,              // hard stop retries
      dedupingInterval: 300000,        // 5 min dedupe window (tune as needed)
      ...options,
    }
  );

  const aggregatedData = useMemo(() => {
    const hasInstagram = !!instagramData?.instagramUser;
    const hasTiktok = !!tiktokData?.tiktokUser;

    // If no social media connected
    if (!hasInstagram && !hasTiktok) {
      return {
        username: '',
        followerCount: null,
        engagementRate: null,
        platform: null,
        platforms: [],
        isConnected: false,
      };
    }

    // Get Instagram data
    const instagramUsername = instagramData?.instagramUser?.username || null;
    const instagramFollowers = instagramData?.instagramUser?.followers_count || 0;
    const instagramEngagement = instagramData?.instagramUser?.engagement_rate || 0;

    // Get TikTok data
    const tiktokUsername = tiktokData?.tiktokUser?.username || null;
    const tiktokFollowers = tiktokData?.overview?.follower_count || 0;
    const tiktokEngagement = tiktokData?.tiktokUser?.engagement_rate || 0;

    // Determine primary platform (one with more followers)
    let primaryPlatform = null;
    let username = null;
    let followerCount = 0;
    let engagementRate = 0;

    if (hasInstagram && hasTiktok) {
      if (instagramFollowers >= tiktokFollowers) {
        primaryPlatform = 'instagram';
        username = instagramUsername;
        followerCount = instagramFollowers;
        engagementRate = instagramEngagement;
      } else {
        primaryPlatform = 'tiktok';
        username = tiktokUsername;
        followerCount = tiktokFollowers;
        engagementRate = tiktokEngagement;
      }
    } else if (hasInstagram) {
      primaryPlatform = 'instagram';
      username = instagramUsername;
      followerCount = instagramFollowers;
      engagementRate = instagramEngagement;
    } else if (hasTiktok) {
      primaryPlatform = 'tiktok';
      username = tiktokUsername;
      followerCount = tiktokFollowers;
      engagementRate = tiktokEngagement;
    }

    return {
      username,
      followerCount,
      engagementRate: engagementRate ? parseFloat(engagementRate.toFixed(2)) : null,
      platform: primaryPlatform,
      platforms: [
        ...(hasInstagram ? ['instagram'] : []),
        ...(hasTiktok ? ['tiktok'] : []),
      ],
      isConnected: hasInstagram || hasTiktok,
      instagram: hasInstagram ? {
        followers: instagramFollowers,
        engagementRate: instagramEngagement ? parseFloat(instagramEngagement.toFixed(2)) : null,
      } : null,
      tiktok: hasTiktok ? {
        followers: tiktokFollowers,
        engagementRate: tiktokEngagement ? parseFloat(tiktokEngagement.toFixed(2)) : null,
      } : null,
    };
  }, [instagramData, tiktokData]);

  return {
    data: aggregatedData,
    isLoading: instagramLoading || tiktokLoading,
    error: instagramError || tiktokError,
    instagram: instagramData,
    tiktok: tiktokData,
  };
}

/**
 * Hook to fetch social media data for multiple creators at once
 * @param {Array<string>} creatorIds - Array of creator user IDs
 * @returns {Object} Map of creator IDs to their social media data
 */
export function useMultipleCreatorsSocialMediaData(creatorIds = []) {
  const results = {};
  
  creatorIds.forEach(id => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useCreatorSocialMediaData(id);
    results[id] = data;
  });

  return results;
}