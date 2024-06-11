import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useCompany } from './zustands/useCompany';

const useGetCompany = () => {
  const { setCompany } = useCompany();
  const [companies, setCompanies] = useState([]);

  const getCompany = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.company.getAll);
      console.log(res.data);
      setCompanies(res?.data);
      setCompany(res?.data);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }, [setCompany]);

  useEffect(() => {
    getCompany();
  }, [getCompany]);

  return { getCompany, companies };
};

export default useGetCompany;
