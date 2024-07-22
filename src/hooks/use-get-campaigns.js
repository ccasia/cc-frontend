import { io } from 'socket.io-client';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

const useGetCampaigns = (type) => {
  const [campaigns, setCampaigns] = useState();
  const [endpoint, setEndPoint] = useState();

  const getCampaigns = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoint);
      setCampaigns(res?.data);
    } catch (error) {
      enqueueSnackbar('Failed fetching campaign', {
        variant: 'error',
      });
    }
  }, [endpoint]);

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

    getCampaigns();
  }, [getCampaigns, endpoint]);

  useEffect(() => {
    const socket = io();

    socket.on('campaignStatus', (data) => {
      getCampaigns();
      enqueueSnackbar(`${data.name} is now ${data.status}`);
    });

    return () => {
      socket.off('campaignStatus');
      socket.close();
    };
  }, [campaigns, getCampaigns]);

  return {
    campaigns,
  };
};

export default useGetCampaigns;
