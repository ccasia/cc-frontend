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

export const featuredVideosKey = (campaignId) => ['featuredVideos', campaignId];

/**
 * Posts admins starred in Campaign Analytics, sorted by views (no stats last). Stats come from
 * the daily snapshot, so they can be a day old and are null before the first capture.
 * @typedef {Object} FeaturedVideo
 * @property {string} id
 * @property {'submission'|'manual'} source  manual rows come from ManualCreatorEntry and have no media
 * @property {string|null} submissionId
 * @property {string|null} manualEntryId
 * @property {string|null} postUrl
 * @property {'TikTok'|'Instagram'} platform
 * @property {string|null} thumbnailUrl
 * @property {string|null} videoUrl  uploaded draft file, for the hover preview
 * @property {number|null} views
 * @property {number|null} likes
 * @property {number|null} engagementRate  percent, e.g. 4.2
 * @property {string|null} postedAt
 * @property {string|null} statsCapturedAt
 * @property {string} featuredAt
 * @property {{ name: string|null, photoURL: string|null }} creator
 */

/** @returns {Promise<FeaturedVideo[]>} */
export async function getFeaturedVideos(campaignId) {
  const res = await axiosInstance.get(endpoints.campaign.featuredVideos(campaignId));
  return res.data;
}

export function useFeaturedVideos(campaignId, { enabled = true } = {}) {
  return useQuery({
    queryKey: featuredVideosKey(campaignId),
    queryFn: () => getFeaturedVideos(campaignId),
    enabled: enabled && !!campaignId,
  });
}
