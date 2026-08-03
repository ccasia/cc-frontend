import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

import { getDemoCreatorById } from 'src/_mock/_demo-campaign';

const useGetCreatorById = (id) => {
  // Demo creators: resolve from the mock file instead of the live API.
  const demoCreator = getDemoCreatorById(id);

  const { data, error, isLoading } = useSWR(
    demoCreator ? null : endpoints.creators.getCreatorFullInfo(id),
    fetcher
  );

  const memoizedValue = useMemo(
    () =>
      demoCreator
        ? { data: demoCreator, error: undefined, isLoading: false }
        : { data, error, isLoading },
    [demoCreator, data, error, isLoading]
  );

  return memoizedValue;
};

export default useGetCreatorById;
