import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetInvoiceById = (id) => {
 
  const { data, isLoading } = useSWR(endpoints.invoice.getInvoiceById(id), fetcher);

  const memoizedValue = useMemo(
    () => ({
      campaigns: data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
};
export default useGetInvoiceById;