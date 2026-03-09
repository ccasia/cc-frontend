import axiosInstance, { endpoints } from './axios';

export const trackJourneyStep = async (payload) => {
  try {
    const url = `${endpoints.analytics.tracker}`;

    if (payload.status === 'ABANDONED') {
      const apiBase = axiosInstance.defaults.baseURL || window.location.origin;

      const fullUrl = `${apiBase}${url}`;

      fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: 'include',
      }).catch((err) => console.error('Abandon tracking failed', err));
    } else {
      await axiosInstance.post(url, payload);
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
};
