import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import AdminGuard from 'src/auth/admin/admin-guard';

import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const AdminForm = lazy(() => import('src/pages/admin/index'));

// ----------------------------------------------------------------------

export const adminRoutes = [
  {
    path: 'admin',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        path: 'form/:id',
        element: (
          <AdminGuard>
            <AdminForm />
          </AdminGuard>
        ),
      },
    ],
  },
];
