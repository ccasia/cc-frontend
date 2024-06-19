import { useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAdmins } from './zustands/useAdmins';

const useGetAdmins = () => {
  const { setAdmin } = useAdmins();

  const getAdmins = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.users.admins);

      setAdmin(res?.data);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }, [setAdmin]);

  useEffect(() => {
    getAdmins();
  }, [getAdmins]);

  return { getAdmins };
};

export default useGetAdmins;
