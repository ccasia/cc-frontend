import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

import { demoAgreements, DEMO_CAMPAIGN_ID } from 'src/_mock/_demo-campaign';

const noop = () => {};

export const useGetAgreements = (campaignId) => {
  // Demo campaign: serve mocked agreements from the editable mock file.
  const isDemoCampaign = campaignId === DEMO_CAMPAIGN_ID;

  const { data, isLoading, mutate } = useSWR(
    isDemoCampaign ? null : endpoints.campaign.creatorAgreement(campaignId),
    fetcher,
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data: isDemoCampaign ? demoAgreements : data,
      isLoading: isDemoCampaign ? false : isLoading,
      mutate: isDemoCampaign ? noop : mutate,
    }),
    [isDemoCampaign, data, isLoading, mutate]
  );

  return memoizedValue;
};
