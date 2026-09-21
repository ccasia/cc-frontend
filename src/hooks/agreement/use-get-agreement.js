import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

export const useGetAgreement = (campaignId, userId) => {
  const query = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ['agreement', userId, campaignId],
    queryFn: async () => {
      const res = await axiosInstance.get(endpoints.campaign.agreement(campaignId, userId));
      return res.data;
    },
    enabled: !!campaignId && !!userId,
  });

  const mutate = useCallback(() => {
    query.invalidateQueries({ queryKey: ['agreement', userId, campaignId] });
  }, [query, userId, campaignId]);

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading: isPending,
      mutate,
    }),
    [data, isPending, mutate]
  );

  return memoizedValue;
};
