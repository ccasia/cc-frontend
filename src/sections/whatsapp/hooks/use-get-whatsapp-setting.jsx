import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/utils/axios';

const useGetWhatsappSetting = async () => {
  const { data, isLoading } = useSWR('/api/system-settings/whatsapp', fetcher);

  const value = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return value;
};

export default useGetWhatsappSetting;
