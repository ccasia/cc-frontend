import { useState, useEffect } from 'react';

import axios, { endpoints } from 'src/utils/axios';

export const useGetCampaignBrandOption = () => {
  const [options, setOptions] = useState();

  useEffect(() => {
    const getOptions = async () => {
      try {
        const res = await axios.get(endpoints.company.getOptions);
        setOptions(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    getOptions();
  }, []);

  return { options };
};
