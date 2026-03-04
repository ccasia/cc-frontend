import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { trackJourneyStep } from 'src/utils/trackJourneyStep';

export const useJourneyTracker = (flow, step) => {
  const { user } = useAuthContext();
  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);

  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const markCompleted = useCallback(
    async (metaData = {}) => {
      isCompleted.current = true;
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

      if (userIdRef.current) {
        await trackJourneyStep({
          userId: userIdRef.current,
          sessionId,
          flow,
          step,
          status: metaData.status || 'COMPLETED',
          timeSpentSeconds: timeSpent,
          meta: metaData,
        });
      }
    },
    [flow, step, sessionId]
  );

  useEffect(() => {
    startTime.current = Date.now();
    isCompleted.current = false;

    return () => {
      if (!isCompleted.current && userIdRef.current) {
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
        
        if (timeSpent > 2) {
          trackJourneyStep({
            userId: userIdRef.current,
            sessionId,
            flow,
            step,
            status: 'ABANDONED',
            timeSpentSeconds: timeSpent,
          });
        }
      }
    };
  }, [flow, step, sessionId]);

  return { markCompleted };
};
