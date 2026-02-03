import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

/**
 * OPTIMIZED: Get invoices by campaign ID with pagination and filtering
 * @param {string} id - Campaign ID
 * @param {object} options - Query options (page, limit, status, currency, search, startDate, endDate)
 */
const useGetInvoicesByCampId = (id, options = {}) => {
  const { page = 1, limit = 50, status, currency, search, startDate, endDate } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  if (page) queryParams.append('page', page);
  if (limit) queryParams.append('limit', limit);
  if (status) queryParams.append('status', status);
  if (currency) queryParams.append('currency', currency);
  if (search) queryParams.append('search', search);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  const queryString = queryParams.toString();
  const url = id
    ? `${endpoints.invoice.getInvoicesByCampaignId(id)}${queryString ? `?${queryString}` : ''}`
    : null;

  const { data, isLoading, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const memoizedValue = useMemo(
    () => ({
      campaigns: data?.data || [],
      pagination: data?.pagination,
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );

  return memoizedValue;
};
export default useGetInvoicesByCampId;