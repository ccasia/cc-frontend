import axiosInstance, { endpoints } from 'src/utils/axios';

// export const useGetPaymentFormByUserId = () => {
//   const { data, isLoading } = useSWR(endpoints.creators.getCreators, fetcher, {
//     revalidateOnFocus: true,
//     revalidateOnReconnect: true,
//     revalidateOnMount: true,
//   });

//   const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

//   return memoizedValue;
// };

export const updatePaymentForm = async (data) => {
  const res = await axiosInstance.patch(endpoints.creators.updatePaymentForm, data);

  return res;
};
