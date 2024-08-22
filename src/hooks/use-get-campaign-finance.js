import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCampaignsFinance = (type) => {
 
  const { data, isLoading } = useSWR(endpoints.campaign.getAllCampaigns, fetcher);

  const memoizedValue = useMemo(
    () => ({
      campaigns: data,
      isLoading,
    }),
    [data, isLoading]
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

  //   socket.on('campaignStatus', (value) => {
  //     getCampaigns();
  //     enqueueSnackbar(`${value.name} is now ${value.status}`);
  //   });

  //   return () => {
  //     socket.off('campaignStatus');
  //     socket.close();
  //   };
  // }, [campaigns, getCampaigns]);

  // return {
  //   // campaigns,
  // };
};
export default useGetCampaignsFinance;