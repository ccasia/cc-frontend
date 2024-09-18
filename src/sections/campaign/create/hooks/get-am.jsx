import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

export const useGetAdmins = (target) => {
  const { data, isLoading } = useSWR(
    `${endpoints.users.admins}${target === 'active' && `?target=active`}`,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;

  // const [admins, setAdmins] = useState();

  // const getAdmins = useCallback(async () => {
  //   try {
  //     const res = await axiosInstance.get(endpoints.users.getAdmins);

  //     setAdmins(res?.data);
  //     return res;
  //   } catch (error) {
  //     return error;
  //   }
  // }, []);

  // useEffect(() => {
  //   getAdmins();
  // }, [getAdmins]);

  // return { admins };
};
