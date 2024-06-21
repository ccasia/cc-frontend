import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

const useGetCampaigns = () => {
  const [campaigns, setCampaigns] = useState();

  useEffect(() => {
    const getCampaigns = async () => {
      try {
        const res = await axiosInstance.get(endpoints.campaign.getCampaignsByAdminId);
        setCampaigns(res?.data);
      } catch (error) {
        enqueueSnackbar('Failed fetching campaign', {
          variant: 'error',
        });
      }
    };
    getCampaigns();
  }, []);

  return {
    campaigns,
  };
};

export default useGetCampaigns;
