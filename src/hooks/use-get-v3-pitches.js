import useSWR from 'swr';

import axiosInstance from 'src/utils/axios';

import { demoPitches, DEMO_CAMPAIGN_ID } from 'src/_mock/_demo-campaign';

const fetcher = (url) => axiosInstance.get(url).then((res) => res.data).catch((error) => {
    throw error;
  });

const noop = () => {};

export default function useGetV3Pitches(campaignId = null, status = null) {
  // Demo campaign: serve mocked pitches so the client master list shows the
  // real status spread (APPROVED for confirmed creators, REJECTED for the
  // rest) instead of falling back to shortlisted (which forces all APPROVED).
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
    return { pitches: demoPitches, isLoading: false, isError: undefined, mutate: noop };
  }

  return {
    pitches: data || [],
    isLoading,
    isError: error,
    mutate,
  };
} 