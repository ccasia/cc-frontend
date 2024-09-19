import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

export const useGetSocialMedia = () => {
  const { data, isLoading } = useSWR(endpoints.creators.getCreatorSocialMediaData, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
  });

  const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return memoizedValue;
};

const crawlSocialMediaData = async (instagramUsername, tiktokUsername) => {
  const crawlPlatform = async (platform, username) => {
    if (!username) return null;
    try {
      const response = await axiosInstance.post(endpoints.creators.getCreatorCrawler, {
        identifier: username,
        platform,
      });
      return response.data;
    } catch (err) {
      console.error(`Error crawling ${platform} data:`, err.response?.data || err.message);
      return null; // Return null instead of throwing, so we can still process other platforms
    }
  };

  const [instagramData, tiktokData] = await Promise.all([
    crawlPlatform('Instagram', instagramUsername),
    crawlPlatform('TikTok', tiktokUsername),
  ]);

  return {
    instagram: instagramData,
    tiktok: tiktokData,
  };
};

export const fetchSocialMediaData = async () => {
  const res = await axiosInstance.get(endpoints.auth.getCurrentUser);

  if (!res.data.user || !res.data.user.creator) {
    throw new Error('Creator profile not found. Please complete your profile setup.');
  }

  const { instagram, tiktok } = res.data.user.creator;

  if (!instagram && !tiktok) {
    throw new Error(
      'No social media usernames found. Please add your Instagram or TikTok username in your profile.'
    );
  }

  const newSocialMediaData = await crawlSocialMediaData(instagram, tiktok);

  if (!newSocialMediaData) {
    return;
  }

  await axiosInstance.put(endpoints.auth.updateCreator, {
    id: res.data.user.id,
    socialMediaData: newSocialMediaData,
  });

  mutate(endpoints.creators.getCreatorSocialMediaData);
};
