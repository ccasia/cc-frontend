import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { Box, Alert, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { setSession } from 'src/auth/context/jwt/utils';

export default function ClientDemoPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token;

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const startDemoSession = async () => {
      try {
        const response = await axiosInstance.post(endpoints.clientDemo.session(token));
        if (cancelled) return;

        setSession(response.data.accessToken);
        router.replace(paths.dashboard.discoveryTool.root);
      } catch (error) {
        if (cancelled) return;
        router.replace(`${paths.auth.jwt.login}?returnTo=${encodeURIComponent(paths.dashboard.discoveryTool.root)}`);
      }
    };

    startDemoSession();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  return (
    <>
      <Helmet>
        <title>Client Demo</title>
      </Helmet>

      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
        {token ? (
          <CircularProgress size={28} />
        ) : (
          <Alert severity="error">Demo link is missing.</Alert>
        )}
      </Box>
    </>
  );
}
