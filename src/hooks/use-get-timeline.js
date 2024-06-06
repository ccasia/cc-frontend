import { useState, useEffect, useCallback } from 'react'; // Make sure to import axios
import axiosInstance from 'src/utils/axios';

export const useGetTimeline = () => {
  const [defaultTimeline, setDefaultTimeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getDefaultTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('http://localhost/api/campaign/defaultTimeline');
      setDefaultTimeline(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getDefaultTimeline();
  }, [getDefaultTimeline]);

  return { defaultTimeline, loading, error };
};
