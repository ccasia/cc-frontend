import { Helmet } from 'react-helmet-async';

import { useAuthContext } from 'src/auth/hooks';

import DashboardAdmin from 'src/sections/admin/dashboard';
import DashboardCreator from 'src/sections/creator/dashboard';

// ----------------------------------------------------------------------

export default function Page() {
  const { user } = useAuthContext();

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      {user?.role?.includes('admin') && <DashboardAdmin />}
      {user?.role === 'creator' && <DashboardCreator />}

      {/* <CreatorView /> */}

      {/* {user?.creator?.firstName && (
        <Typography variant="h1" gutterBottom>
          Hi, {user?.creator?.firstName}
        </Typography>
      )} */}
    </>
  );
}
