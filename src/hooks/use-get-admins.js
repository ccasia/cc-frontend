import { useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAdmins } from './zustands/useAdmins';

const useGetAdmins = () => {
  const { setAdmin } = useAdmins();

  const getAdmins = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.users.admins);
      setAdmin(res.data);
    } catch (error) {
      // return error;
      alert(error);
    }
  }, [setAdmin]);

  // const getAdmins = async () => {
  //   try {
  //     const res = await axiosInstance.get(endpoints.users.admins);
  //     setAdmin(res.data);
  //   } catch (error) {
  //     // return error;
  //     alert(error);
  //   }
  // };

  useEffect(() => {
    const controller = new AbortController();

    getAdmins();

    return () => {
      controller.abort();
    };
  }, [getAdmins]);

  return { getAdmins };
};

export default useGetAdmins;
