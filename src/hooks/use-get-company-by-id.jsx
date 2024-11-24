import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCompanyById = (id) => {
  const { data, isLoading, mutate } = useSWR(`${endpoints.company.getCompany}/${id}`, fetcher, {
    revalidateIfStale: true,
    revalidateOnMount: true,
  });

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
      mutate,
    }),
    [data, isLoading, mutate]
  );

  return memoizedValue;
};

export default useGetCompanyById;
