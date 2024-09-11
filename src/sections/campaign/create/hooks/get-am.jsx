import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

export const useGetAdmins = () => {
  const [admins, setAdmins] = useState();

  const getAdmins = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.users.getAdmins);

      setAdmins(res?.data);
      return res;
    } catch (error) {
      return error;
    }
  }, []);

  useEffect(() => {
    getAdmins();
  }, [getAdmins]);

  return { admins };
};
