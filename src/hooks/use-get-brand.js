import { useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useBrand } from './zustands/useBrand';

const useGetBrand = () => {
  const { setBrand } = useBrand();

  const getBrand = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.company.getBrands);
      setBrand(res?.data);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }, [setBrand]);

  useEffect(() => {
    getBrand();
  }, [getBrand]);

  return { getBrand };
};

export default useGetBrand;
