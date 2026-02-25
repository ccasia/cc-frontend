import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook to fetch post engagement snapshots (Day 7, 15, 30 ER tracking)
 * @param {string} campaignId - Campaign ID
 * @returns {object} { snapshots, loading, error, refetch }
 */
export const usePostEngagementSnapshots = (campaignId) => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSnapshots = useCallback(async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/campaign/${campaignId}/post-engagement-snapshots`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setSnapshots(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch snapshots');
      }
    } catch (err) {
      console.warn('Post engagement snapshots not available:', err.message);
      setError(err.message || 'Failed to fetch snapshots');
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  return {
    snapshots,
    loading,
    error,
    refetch: fetchSnapshots,
  };
};

/**
 * Manually trigger snapshot capture for a specific post
 * @param {string} campaignId - Campaign ID
 * @param {string} postUrl - Post URL
 * @param {number} snapshotDay - Snapshot day (7, 15, or 30)
 * @returns {Promise} Response from API
 */
export const captureManualSnapshot = async (campaignId, postUrl, snapshotDay) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/campaign/${campaignId}/post-engagement-snapshots/capture`,
      {
        postUrl,
        snapshotDay,
      },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (err) {
    console.error('Error capturing manual snapshot:', err);
    throw err;
  }
};
