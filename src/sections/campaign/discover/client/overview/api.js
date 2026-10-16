import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

export const overviewKey = (campaignId) => ['clientCampaignOverview', campaignId];

/** Counts for the client Overview tab and header; see GET /campaign/:id/overview in cc-backend. */
export function useClientCampaignOverview(campaignId, { enabled = true } = {}) {
  return useQuery({
    queryKey: overviewKey(campaignId),
    queryFn: () =>
      axiosInstance.get(endpoints.campaign.clientOverview(campaignId)).then((res) => res.data),
    enabled: enabled && !!campaignId,
  });
}

/**
 * @typedef {Object} FeaturedVideo
 * @property {string} id
 * @property {string} thumbnailUrl
 * @property {string} postUrl
 * @property {'TikTok'|'Instagram'} platform
 * @property {number} views
 * @property {number} likes
 * @property {number} engagementRate  percent, e.g. 4.2
 * @property {string} postedAt
 * @property {{ name: string, photoURL?: string }} creator
 */

/**
 * TODO: no `featured` flag exists on posts yet. Admins will star videos in Campaign Analytics
 * (design 4a); return those here, sorted by views, once the backend stores them.
 * @returns {Promise<FeaturedVideo[]>}
 */
// eslint-disable-next-line no-unused-vars
export async function getFeaturedVideos(campaignId) {
  return [];
}

export function useFeaturedVideos(campaignId) {
  return useQuery({
    queryKey: ['featuredVideos', campaignId],
    queryFn: () => getFeaturedVideos(campaignId),
    enabled: !!campaignId,
  });
}
