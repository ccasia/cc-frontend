import useSWR from 'swr';

import { fetcher } from 'src/utils/axios';

const useOtpCooldown = () => {
  const { data, isLoading } = useSWR('/api/auth/otp-status', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    secondsLeft: data?.secondsLeft ?? 60,
    phoneNumber: data?.phoneNumber ?? '',
    isLoading,
  };
};

export default useOtpCooldown;
