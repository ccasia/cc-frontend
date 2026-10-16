import { useQuery } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

export const clientHomeKey = ['clientHome'];

export function useClientHome() {
  return useQuery({
    queryKey: clientHomeKey,
    queryFn: () => axiosInstance.get(endpoints.client.home).then((res) => res.data),
    // Tasks clear when the client acts on another screen, so refresh on return.
    refetchOnWindowFocus: true,
  });
}
