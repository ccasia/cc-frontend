import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthGuard } from 'src/auth/guard';
import DashboardLayout from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/one'));
const ProfilePage = lazy(() => import('src/pages/dashboard/profile'));
const ManagersPage = lazy(() => import('src/pages/dashboard/managers'));
// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      { path: 'managers', element: <ManagersPage /> },
      {
        path: 'user',
        children: [
          { element: <ProfilePage />, index: true },
        
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
];
