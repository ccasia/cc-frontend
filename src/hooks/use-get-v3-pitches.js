import useSWR from 'swr';

import axiosInstance from 'src/utils/axios';

const fetcher = (url) => {
  return axiosInstance.get(url).then((res) => {
    return res.data;
  }).catch((error) => {
    throw error;
  });
};

export default function useGetV3Pitches(campaignId = null, status = null) {
  let url = '/api/pitch/v3';
  
  const params = new URLSearchParams();
  if (campaignId) params.append('campaignId', campaignId);
  if (status) params.append('status', status);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    pitches: data || [],
    isLoading,
    isError: error,
    mutate,
  };
} 