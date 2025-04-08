import { Helmet } from 'react-helmet-async';

import { useAuthContext } from 'src/auth/hooks';

import DashboardAdmin from 'src/sections/admin/dashboard';
import Overview from 'src/sections/creator/overview/overview';

// ----------------------------------------------------------------------

export default function Page() {
  const { user } = useAuthContext();

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      {user?.role?.includes('admin') && <DashboardAdmin />}

      {user?.role === 'creator' && <Overview />}
    </>
  );
}
