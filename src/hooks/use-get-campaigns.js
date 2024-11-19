import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCampaigns = (type) => {
  // const [campaigns, setCampaigns] = useState();
  // const [endpoint, setEndPoint] = useState();

  const endpoint =
    type === 'creator'
      ? endpoints.campaign.getMatchedCampaign
      : endpoints.campaign.getCampaignsByAdminId;

  const { data, isLoading, mutate } = useSWR(endpoint, fetcher, {
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  const memoizedValue = useMemo(
    () => ({
      campaigns: data,
      isLoading,
      mutate,
    }),
    [data, isLoading, mutate]
  );

  return memoizedValue;

  // const getCampaigns = useCallback(async () => {
  //   try {
  //     const res = await axiosInstance.get(endpoint);
  //     setCampaigns(res?.data);
  //   } catch (error) {
  //     enqueueSnackbar('Failed fetching campaign', {
  //       variant: 'error',
  //     });
  //   }
  // }, [endpoint]);

  // useEffect(() => {
  //   if (type && type.toLowerCase() === 'creator') {
  //     setEndPoint(endpoints.campaign.getAllActiveCampaign);
  //   } else {
  //     setEndPoint(endpoints.campaign.getCampaignsByAdminId);
  //   }
  // }, [type]);

  // useEffect(() => {
  //   if (!endpoint) {
  //     return;
  //   }

  //   getCampaigns();
  // }, [getCampaigns, endpoint]);

  // useEffect(() => {
  //   const socket = io();

  //   socket?.on('campaignStatus', (value) => {
  //     getCampaigns();
  //     enqueueSnackbar(`${value.name} is now ${value.status}`);
  //   });

  //   return () => {
  //     socket?.off('campaignStatus');
  //     socket.close();
  //   };
  // }, [campaigns, getCampaigns]);

  // return {
  //   // campaigns,
  // };
};

export default useGetCampaigns;
