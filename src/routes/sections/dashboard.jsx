import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import DashboardLayout from 'src/layouts/dashboard';
import { AuthGuard, RoleBasedGuard } from 'src/auth/guard';

import { LoadingScreen } from 'src/components/loading-screen';

// import CreatorList from 'src/sections/creator/creator-list';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/one'));
const ProfilePage = lazy(() => import('src/pages/dashboard/profile'));
const ManagersPage = lazy(() => import('src/pages/dashboard/managers'));
const CreatorList = lazy(() => import('src/sections/creator/creator-list'));

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
      {
        path: 'admins',
        element: (
          <RoleBasedGuard roles={['god']} hasContent>
            <ManagersPage />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'user',
        children: [
          { element: <ProfilePage />, index: true },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      {
        path: 'creator',
        element: (
          <RoleBasedGuard roles={['god']} hasContent>
            <CreatorList />
          </RoleBasedGuard>
        ),
      },
    ],
  },
];
