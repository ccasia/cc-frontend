import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

/**
 * OPTIMIZED: Get all invoices with pagination and filtering
 * @param {object} options - Query options (page, limit, status, currency, search, campaignName, startDate, endDate)
 */
export const useGetAllInvoices = (options = {}) => {
  const {
    page = 1,
    limit = 50,
    status,
    currency,
    search,
    campaignName,
    startDate,
    endDate,
    ids,
  } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  if (page) queryParams.append('page', page);
  if (limit) queryParams.append('limit', limit);
  if (status) queryParams.append('status', status);
  if (currency) queryParams.append('currency', currency);
  if (search) queryParams.append('search', search);
  if (campaignName) queryParams.append('campaignName', campaignName);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (ids?.length) queryParams.append('invoiceIds', ids);

  const queryString = queryParams.toString();
  const url = `${endpoints.invoice.getAll}${queryString ? `?${queryString}` : ''}`;

  const { data, isLoading, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Cache for 30 seconds
  });

  const memoizedValue = useMemo(
    () => ({
      data: data?.data || [],
      pagination: data?.pagination,
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );

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
