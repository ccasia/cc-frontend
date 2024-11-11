import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetInvoicesByCreator = (id) => {
  const { data, isLoading } = useSWR(endpoints.invoice.getInvoicesByCreator, fetcher);

  const memoizedValue = useMemo(
    () => ({
      invoices: data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
};
export default useGetInvoicesByCreator;
