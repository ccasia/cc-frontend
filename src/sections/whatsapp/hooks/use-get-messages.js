import useSWR from 'swr';

import { fetcher } from 'src/utils/axios';

const useGetWhatsappMessage = () => {
  const { data, isLoading, mutate } = useSWR('/api/system-settings/whatsapp-message', fetcher, {
    revalidateIfStale: false,
  });

  return {
    inboundMessages: data?.message?.inbound ?? [],
    outboundMessages: data?.message?.outbound ?? [],
    isLoading,
    mutate,
  };
};

export default useGetWhatsappMessage;
