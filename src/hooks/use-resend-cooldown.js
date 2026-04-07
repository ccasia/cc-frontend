import { useRef, useState, useEffect } from 'react';

import useOtpCooldown from './use-otp-cooldown';

export const useResendCooldown = () => {
  const { secondsLeft: initialSeconds, isLoading } = useOtpCooldown();

  const [cooldown, setCooldown] = useState(null); // null = not ready yet
  const intervalRef = useRef(null);

  // Once SWR resolves, initialise the countdown from the real value
  useEffect(() => {
    if (isLoading) return;
    setCooldown(initialSeconds);
  }, [isLoading, initialSeconds]);

  // Start ticking whenever cooldown is set and > 0
  useEffect(() => {
    if (cooldown === null || cooldown <= 0) return;

    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // eslint-disable-next-line consistent-return
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooldown === null ? null : cooldown > 0]); // only re-run when crossing 0

  const restart = () => {
    clearInterval(intervalRef.current);
    setCooldown(60);
  };

  return {
    cooldown,
    canResend: cooldown === 0,
    isLoading,
    restart,
  };
};
