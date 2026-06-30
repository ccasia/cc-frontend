import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

import { demoInvoices, DEMO_CAMPAIGN_ID } from 'src/_mock/_demo-campaign';

const noop = () => {};

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

  // Demo campaign: serve mocked invoices from the editable mock file.
  const isDemoCampaign = id === DEMO_CAMPAIGN_ID;

  const queryString = queryParams.toString();
  const url =
    id && !isDemoCampaign
      ? `${endpoints.invoice.getInvoicesByCampaignId(id)}${queryString ? `?${queryString}` : ''}`
      : null;

  const { data, isLoading, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const memoizedValue = useMemo(
    () => ({
      campaigns: isDemoCampaign ? demoInvoices : data?.data || [],
      pagination: isDemoCampaign
        ? { total: demoInvoices.length, page: 1, limit: 50, totalPages: 1 }
        : data?.pagination,
      isLoading: isDemoCampaign ? false : isLoading,
      error: isDemoCampaign ? undefined : error,
      mutate: isDemoCampaign ? noop : mutate,
    }),
    [isDemoCampaign, data, isLoading, error, mutate]
  );

  return memoizedValue;
};
export default useGetInvoicesByCampId;