import { useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useCreator } from './zustands/useCreator';

const useGetCreators = () => {
  const { setCreators, creators } = useCreator();

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

  return { getCreators, creators };
};

export const useGetCreatorByID = (id) => {
  const { setCreator, creator } = useCreator();

  const getCreatorByID = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`${endpoints.creators.getCreatorById}/${id}`);
      setCreator(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [id, setCreator]);

  useEffect(() => {
    getCreatorByID();
  }, [getCreatorByID]);

  return { creator };
};

export default useGetCreators;
