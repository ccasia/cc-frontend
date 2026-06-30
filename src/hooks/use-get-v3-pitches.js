import useSWR from 'swr';

import axiosInstance from 'src/utils/axios';

import { DEMO_CAMPAIGN_ID } from 'src/_mock/_demo-campaign';

const fetcher = (url) => axiosInstance.get(url).then((res) => res.data).catch((error) => {
    throw error;
  });

const noop = () => {};

export default function useGetV3Pitches(campaignId = null, status = null) {
  // Demo campaign: no V3 pitches — the master list falls back to
  // campaign.shortlisted (the mocked creator). Skip the network call.
  const isDemoCampaign = campaignId === DEMO_CAMPAIGN_ID;

  let url = '/api/pitch/v3';

  const params = new URLSearchParams();
  if (campaignId) params.append('campaignId', campaignId);
  if (status) params.append('status', status);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const { data, error, isLoading, mutate } = useSWR(isDemoCampaign ? null : url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  if (isDemoCampaign) {
    return { pitches: [], isLoading: false, isError: undefined, mutate: noop };
  }

  return {
    pitches: data || [],
    isLoading,
    isError: error,
    mutate,
  };
} 