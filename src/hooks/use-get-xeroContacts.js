import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetContacts = () => {
  const { data, isLoading } = useSWR(endpoints.auth.xeroGetContacts, fetcher);

  const memoizedValue = useMemo(
    () => ({
      contacts: data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
};

export default useGetContacts;

