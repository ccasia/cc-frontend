import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

const QUERY_KEY = ['app-version-policies'];

const getPolicies = async () => {
  const { data } = await axiosInstance.get(endpoints.appVersions.root);
  return data.data;
};

export const useAppVersionPolicies = () => {
  const { data, isPending, isError } = useQuery({ queryKey: QUERY_KEY, queryFn: getPolicies });

  return { policies: data ?? [], isPending, isError };
};

export const useUpdateAppVersionPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ platform, ...body }) => {
      const { data } = await axiosInstance.patch(
        endpoints.appVersions.platform(platform.toLowerCase()),
        body
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
