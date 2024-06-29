import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

const useGetCampaigns = (type) => {
  const [campaigns, setCampaigns] = useState();
  const [endpoint, setEndPoint] = useState();

  useEffect(() => {
    if (type && type.toLowerCase() === 'creator') {
      setEndPoint(endpoints.campaign.getAllActiveCampaign);
    } else {
      setEndPoint(endpoints.campaign.getCampaignsByAdminId);
    }
  }, [type]);

  useEffect(() => {
    if (!endpoint) {
      return;
    }

    const getCampaigns = async () => {
      try {
        const res = await axiosInstance.get(endpoint);
        setCampaigns(res?.data);
      } catch (error) {
        enqueueSnackbar('Failed fetching campaign', {
          variant: 'error',
        });
      }
    };
    getCampaigns();
  }, [endpoint]);

  return {
    campaigns,
  };
};

export default useGetCampaigns;
