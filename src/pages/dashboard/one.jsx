import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';

import DashboardAdmin from 'src/sections/admin/dashboard';
import Overview from 'src/sections/creator/overview/overview';
// Removed import to avoid circular reference

// ----------------------------------------------------------------------

export default function Page() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Redirect client users to the client dashboard
    if (user && user.role.includes('client')) { // Check for client role directly
      router.push(paths.dashboard.client); // Ensure this path points to the client dashboard
    }
  }, [user, router]);

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      {user?.role?.includes('admin') && <DashboardAdmin />}

      {user?.role === 'creator' && <Overview />}

      {/* Client dashboard is now handled by a separate route */}
    </>
  );
}
