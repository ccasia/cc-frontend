import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingScreen } from 'src/components/loading-screen';

const PublicMediaKitPage = lazy(() => import('src/pages/public/creator/mediaKit'));
// ----------------------------------------------------------------------

export const publicRoutes = [
  {
    path: '/public',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        path: 'media-kits/creator/:id',
        element: <PublicMediaKitPage />,
      },
    ],
  },
];
