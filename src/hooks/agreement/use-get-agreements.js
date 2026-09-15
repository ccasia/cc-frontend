import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { demoAgreements, DEMO_CAMPAIGN_ID } from 'src/_mock/_demo-campaign';

const noop = () => {};

export const useGetAgreements = (campaignId) => {
  // Demo campaign: serve mocked agreements from the editable mock file.
  const isDemoCampaign = campaignId === DEMO_CAMPAIGN_ID;
  const query = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ['agreements', campaignId],
    queryFn: async () => {
      const res = await axiosInstance.get(endpoints.campaign.creatorAgreement(campaignId));
      return res.data;
    },
    enabled: !!campaignId,
  });

  const mutate = useCallback(() => {
    query.invalidateQueries({ queryKey: ['agreements', campaignId] });
  }, [query, campaignId]);

  const memoizedValue = useMemo(
    () => ({
      data: isDemoCampaign ? demoAgreements : data,
      isLoading: isDemoCampaign ? false : isPending,
      mutate: isDemoCampaign ? noop : mutate,
    }),
    [isDemoCampaign, data, isPending, mutate]
  );

  return memoizedValue;
};
