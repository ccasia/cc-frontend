// import useSWR from 'swr';
// import { useMemo } from 'react';

// import { fetcher, endpoints } from 'src/utils/axios';

// const useGetPitchByCampaignId = () => {
//   const { data, error, isLoading } = useSWR(endpoints.campaign.pitch.detail(id), fetcher, {
//     revalidateIfStale: false,
//     revalidateOnFocus: false,
//     revalidateOnReconnect: false,
//   });

//   const memoizedValue = useMemo(
//     () => ({
//       data,
//       error,
//       isLoading,
//     }),
//     [data, error, isLoading]
//   );

//   return memoizedValue;
// };

// export default useGetPitchByCampaignId;
