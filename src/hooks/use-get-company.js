import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCompany = () => {
  // const { setCompany } = useCompany();
  // const [companies, setCompanies] = useState([]);

  const { data, isLoading } = useSWR(endpoints.company.getAll, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
  });

  const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return memoizedValue;

  // const getCompany = useCallback(async () => {
  //   try {
  //     const res = await axiosInstance.get(endpoints.company.getAll);
  //     setCompanies(res?.data);
  //     setCompany(res?.data);
  //   } catch (error) {
  //     alert(JSON.stringify(error));
  //   }
  // }, [setCompany]);

  // useEffect(() => {
  //   getCompany();
  // }, [getCompany]);

  // return { getCompany, companies };
};

export default useGetCompany;
