import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCreatorById = (id) => {
  const { data, error, isLoading } = useSWR(endpoints.creators.getCreatorFullInfo(id), fetcher);

  const memoizedValue = useMemo(() => ({ data, error, isLoading }), [data, error, isLoading]);

  return memoizedValue;
};

export default useGetCreatorById;
