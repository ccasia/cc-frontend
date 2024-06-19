import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

export const useGetAdmins = () => {
  const [admins, setAdmins] = useState();

  const getAdmins = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.users.getAdmins);
      console.log(res?.data);
      setAdmins(res?.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    getAdmins();
  }, [getAdmins]);

  return { admins };
};
