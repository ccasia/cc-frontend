import useSWR from 'swr';

import { fetcher } from 'src/utils/axios';

const useGetWhatsappSetting = () => {
  const { data, isLoading, error, mutate } = useSWR('/api/system-settings/whatsapp', fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return { data: data?.data, isLoading, error, mutate };
};

export default useGetWhatsappSetting;
