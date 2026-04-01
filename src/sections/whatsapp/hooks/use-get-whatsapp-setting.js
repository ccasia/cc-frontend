import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/utils/axios';

const useGetWhatsappSetting = () => {
  const { data, isLoading, mutate } = useSWR('/api/system-settings/whatsapp', fetcher);

  const memoizedValue = useMemo(
    () => ({ data: data?.data, isLoading, mutate }),
    [data, isLoading, mutate]
  );

  return memoizedValue;
};

export default useGetWhatsappSetting;
