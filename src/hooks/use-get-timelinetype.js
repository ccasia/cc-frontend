import { useState, useEffect, useCallback } from 'react'; // Make sure to import axios
import axiosInstance, { endpoints } from 'src/utils/axios';

export const useGetTimelineType = () => {
  const [timelineType, setTimelineType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getDefaultTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(endpoints.campaign.getTimelineType);
      setTimelineType(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getDefaultTimeline();
  }, [getDefaultTimeline]);

  return { timelineType, loading, error };
};
