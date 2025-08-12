import useSWR from 'swr';

import axiosInstance from 'src/utils/axios';

export const useGetSubmissionsV3 = (userId, campaignId) => {
  const url = userId && campaignId ? `/api/submission/v3?userId=${userId}&campaignId=${campaignId}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    async (url) => {
      const response = await axiosInstance.get(url);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
};

export const useGetSubmissionByIdV3 = (submissionId) => {
  const url = submissionId ? `/api/submission/v3/${submissionId}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    async (url) => {
      const response = await axiosInstance.get(url);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}; 