import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCreatorsByCountry = ({ country, creditTiers = [] } = {}) => {
  const url = useMemo(() => {
    if (!country) return null;
    const params = new URLSearchParams({ country });
    creditTiers.forEach((t) => params.append('creditTiers', t));
    return `${endpoints.analytics.creatorsByCountry}?${params}`;
  }, [country, creditTiers]);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      creators: data?.data?.creators || [],
      genderBreakdown: data?.data?.genderBreakdown || { male: 0, female: 0, nonBinary: 0 },
      count: data?.data?.count || 0,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetCreatorsByCountry;
