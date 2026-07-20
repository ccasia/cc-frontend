import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetInvoiceById = (id) => {
  const { data, isLoading, error, mutate } = useSWR(
    id ? endpoints.invoice.getInvoiceById(id) : null,
    fetcher
  );

  const memoizedValue = useMemo(
    () => ({
      invoice: data,
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );

  return memoizedValue;
};
export default useGetInvoiceById;
