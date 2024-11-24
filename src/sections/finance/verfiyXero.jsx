import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import axiosInstance, { endpoints } from 'src/utils/axios';

function VerfiyXero() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const code = searchParams.get('code');
  const session = searchParams.get('session_state');

  const xeroCode = useCallback(async () => {
    try {
      // Call the backend to exchange the authorization code for the access token
      await axiosInstance.get(endpoints.invoice.xeroCallback, {
        withCredentials: true,
        params: {
          code,
          session,
        },
      });

      // Navigate to another page or update the state after getting the token
      navigate('/dashboard/user/profile'); // Example navigation after success
    } catch (error) {
      console.error('DASDSA', error);
    }
  }, [code, session, navigate]);

  useEffect(() => {
    xeroCode();
  }, [xeroCode]);

  // Change the UI
  return <div>to Dashboard</div>;
}

export default VerfiyXero;
