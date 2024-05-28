import { useEffect, useState, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useCompany } from './zustands/useCompany';

const useGetCompany = () => {
  const { setCompany } = useCompany();

  const getCompany = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.company.getAll);
      setCompany(res?.data);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }, [setCompany]);

  useEffect(() => {
    getCompany();
  }, [getCompany]);

  return { getCompany };
};

export default useGetCompany;
