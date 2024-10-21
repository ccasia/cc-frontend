import useSWR from 'swr';

import axiosInstance, { endpoints } from 'src/utils/axios';

export const useGetLogisticById = (userId, campaignId) => {
  const { data } = useSWR(endpoints);
};

export const useGetAllLogistics = () => {};

export const createLogistics = async (data) => {
  const res = await axiosInstance.post(endpoints.campaign.logistics.admin.create, data);
  return res;
};

export const changeStatus = async (status, id) => {
  const res = await axiosInstance.patch(endpoints.campaign.logistics.admin.changeStatus, {
    status,
    logisticId: id,
  });

  return res;
};

export const confirmItemDelivered = async (id) => {
  const res = await axiosInstance.patch(endpoints.campaign.logistics.creator.receiveLogistic, {
    logisticId: id,
  });

  return res;
};
