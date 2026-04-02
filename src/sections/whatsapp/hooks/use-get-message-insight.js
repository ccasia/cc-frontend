import useSWR from 'swr';

import { fetcher } from 'src/utils/axios';

const useGetMessageInsights = () => {
  const { data, isLoading, error } = useSWR('/api/system-settings/whatsapp-insight', fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return { data: data?.data, isLoading, error };
};

export default useGetMessageInsights;
