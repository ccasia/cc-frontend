import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';

import DashboardAdmin from 'src/sections/admin/dashboard';
import Overview from 'src/sections/creator/overview/overview';
import DashboardClient from 'src/sections/admin/dashboard-client';

// ----------------------------------------------------------------------

export default function Page() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Redirect client users to the client dashboard
    if (user && (user.client || user.designation === 'Client')) {
      router.push(paths.dashboard.client);
    }
  }, [user, router]);

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      {user?.role?.includes('admin') && <DashboardAdmin />}

      {user?.role === 'creator' && <Overview />}

      {(user?.client || user?.designation === 'Client') && <DashboardClient />}
    </>
  );
}
