import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

/**
 * Finance dashboard aggregate: stat cards, active packages list and
 * per-client credit utilisation.
 * @param {object} options - { startDate, endDate } as ISO strings
 */
export const useGetFinanceDashboard = ({ startDate, endDate } = {}) => {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  const queryString = queryParams.toString();
  const url = `${endpoints.finance.dashboard}${queryString ? `?${queryString}` : ''}`;

  const { data, isLoading, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const memoizedValue = useMemo(
    () => ({
      stats: data?.data?.stats || null,
      activePackagesList: data?.data?.activePackagesList || [],
      clients: data?.data?.clients || [],
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );

  return memoizedValue;
};

export const useGetFinanceInvoices = ({ status, startDate, endDate, enabled = false } = {}) => {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  const queryString = queryParams.toString();
  const url = enabled
    ? `${endpoints.finance.invoices}${queryString ? `?${queryString}` : ''}`
    : null;

  const { data, isLoading, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return useMemo(
    () => ({
      invoices: data?.data || [],
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );
};

export const useGetNewPackageClients = ({ startDate, endDate, enabled = false } = {}) => {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  const queryString = queryParams.toString();
  const url = enabled
    ? `${endpoints.finance.newClients}${queryString ? `?${queryString}` : ''}`
    : null;

  const { data, isLoading, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return useMemo(
    () => ({
      clients: data?.data || [],
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );
};

/**
 * Campaign breakdown for one client's drawer. Pass a falsy companyId to skip
 * fetching (drawer closed).
 */
export const useGetClientCampaignBreakdown = (companyId) => {
  const { data, isLoading, error } = useSWR(
    companyId ? endpoints.finance.campaignBreakdown(companyId) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      campaigns: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
};
