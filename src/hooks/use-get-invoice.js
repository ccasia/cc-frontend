import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetInvoiceById = (id) => {
  const { data, isLoading, mutate } = useSWR(id ? endpoints.invoice.getInvoiceById(id) : null, fetcher);

  const memoizedValue = useMemo(
    () => ({
      invoice: data,
      isLoading,
      mutate,
    }),
    [data, isLoading, mutate]
  );

  return memoizedValue;
};
export default useGetInvoiceById;
