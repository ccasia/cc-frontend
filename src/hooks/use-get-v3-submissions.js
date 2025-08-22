import useSWR from 'swr';

import axiosInstance from 'src/utils/axios';

const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);

export default function useGetV3Submissions(status = null) {
  let url = '/api/submission/v3';

  const params = new URLSearchParams();
  if (status) params.append('status', status);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    submissions: data || [],
    isLoading,
    isError: error,
    mutate,
  };
} 