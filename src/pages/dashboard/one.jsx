import { Helmet } from 'react-helmet-async';

import { Typography } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import CreatorView from 'src/sections/creator/form/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { user } = useAuthContext();
  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      <CreatorView />

      {user?.creator?.firstName && (
        <Typography variant="h1" gutterBottom>
          Hi, {user?.creator?.firstName}
        </Typography>
      )}
    </>
  );
}
