import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAdmins } from './zustands/useAdmins';

const useGetAdmins = () => {
  const { setAdmin } = useAdmins();
  const [admins, setAdmins] = useState();

  const getAdmins = useCallback(async () => {
    try {
      // const res = await axiosInstance.get(endpoints.users.admins);
      const res = await axiosInstance.get(endpoints.users.getAdmins);
      setAdmins(res?.data);
      setAdmin(res?.data);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }, [setAdmin]);

  useEffect(() => {
    getAdmins();
  }, [getAdmins]);

  return { getAdmins, admins };
};

export default useGetAdmins;
