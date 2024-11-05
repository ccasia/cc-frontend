import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

export const useGetAllInvoices = () => {
  const { data, isLoading } = useSWR(endpoints.invoice.getAll, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
  });

  const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return memoizedValue;
};

export const useGetCreatorInvoice = ({ invoiceId }) => {
  const { data, isLoading, error } = useSWR(
    `${endpoints.invoice.getCreatorInvoice}/${invoiceId}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(() => ({ data, isLoading, error }), [data, isLoading, error]);

  return memoizedValue;
};
