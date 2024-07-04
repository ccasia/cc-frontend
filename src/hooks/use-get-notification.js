import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useNotification } from './zustands/useNotification';

const useGetNotification = () => {
  const { setNotification } = useNotification();
  const [notification, setNotifications] = useState();

  const getNotification = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.notification.getNotification);
      setNotifications(res?.data);
      setNotification(res?.data);
    } catch (error) {
     console.log(error);
    }
  }, [setNotification]);

  useEffect(() => {
    getNotification();
  }, [getNotification]);

  return { getNotification, notification };
};


export default useGetNotification;