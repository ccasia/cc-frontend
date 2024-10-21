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
};

export default useGetCompany;
