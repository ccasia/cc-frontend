import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

export const useGetAdminsForSuperadmin = () => {
  const { data } = useSWR(endpoints.users.admins, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    admins: data,
  };
};

export const editAdmin = async (data) => {
  await axiosInstance.patch(endpoints.auth.updateProfileAdmin, data);

  mutate(endpoints.users.admins, (currentData) => {
    const admins = currentData.map((admin) =>
      admin.id === data.userId ? { ...admin, name: data?.name } : admin
    );

    return admins;
  });
};
