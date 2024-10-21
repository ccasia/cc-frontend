import useSWR from 'swr';
import { useMemo, useEffect, useCallback } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { useCreator } from './zustands/useCreator';

// Assuming you have a fetcher function defined somewhere
// const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);

const useGetCreators = () => {
  const { data, isLoading } = useSWR(endpoints.creators.getCreators, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
  });

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;

  // const { setCreators, creators } = useCreator();

  // const getCreators = useCallback(async () => {
  //   try {
  //     const res = await axiosInstance.get(endpoints.creators.getCreators);
  //     setCreators(res?.data);
  //   } catch (error) {
  //     alert(JSON.stringify(error));
  //   }
  // }, [setCreators]);

  // useEffect(() => {
  //   getCreators();
  // }, [getCreators]);

  // return { getCreators, creators };
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

export const useSWRGetCreatorByID = (id) => {
  const { data, error, isLoading } = useSWR(
    id ? `${endpoints.creators.getCreatorById}/${id}` : null,
    fetcher
  );

  return {
    creator: data,
    isLoading,
    isError: error,
  };
};

export default useGetCreators;
