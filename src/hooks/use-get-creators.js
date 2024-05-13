import { useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useCreator } from './zustands/useCreator';

const useGetAdmins = () => {
    
  const { setCreators } = useCreator();

  const getCreators = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.creators.getCreators);
      setCreators(res?.data);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }, [setCreators]);

  useEffect(() => {
    getCreators();
  }, [getCreators]);

  return { getCreators };
};
export default useGetAdmins;
