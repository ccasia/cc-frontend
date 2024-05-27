import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import DashboardLayout from 'src/layouts/dashboard';
import { AuthGuard, RoleBasedGuard } from 'src/auth/guard';

import { LoadingScreen } from 'src/components/loading-screen';

import { CalendarView } from 'src/sections/calendar/view';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/one'));
const ProfilePage = lazy(() => import('src/pages/dashboard/profile'));
const ManagersPage = lazy(() => import('src/pages/dashboard/admin'));
const CreatorList = lazy(() => import('src/pages/dashboard/creator/list'));
const CreatorMediaKit = lazy(() => import('src/pages/dashboard/creator/mediaKit'));
const MeditKitsCards = lazy(() => import('src/pages/dashboard/creator/mediaKitCards'));

// Landing Page temporary
const CreatorLists = lazy(() => import('src/pages/dashboard/landing/creator'));
const BrandLists = lazy(() => import('src/pages/dashboard/landing/brand'));
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
      // For admin/superadmin
      {
        path: 'creator',
        children: [
          {
            path: 'lists',
            element: (
              <RoleBasedGuard roles={['god']} hasContent>
                <CreatorList />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'media-kits',
            children: [
              {
                element: (
                  <RoleBasedGuard roles={['god']} hasContent>
                    <MeditKitsCards />
                  </RoleBasedGuard>
                ),
                index: true,
              },
              {
                path: ':id',
                element: (
                  <RoleBasedGuard roles={['god']} hasContent>
                    <CreatorMediaKit />
                  </RoleBasedGuard>
                ),
              },
            ],
          },
        ],
      },
      // For Creator
      {
        path: 'mediakit',
        element: (
          <RoleBasedGuard roles={['creator']} hasContent>
            <CreatorMediaKit />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'landing',
        children: [
          {
            path: 'creator',
            element: <CreatorLists />,
          },
          {
            path: 'brand',
            element: <BrandLists />,
          },
        ],
      },
      {
        path: 'calendar',
        element: <CalendarView />,
      },
    ],
  },
];
