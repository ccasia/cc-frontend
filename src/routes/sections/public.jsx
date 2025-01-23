import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingScreen } from 'src/components/loading-screen';


const PublicMediaKitPage = lazy(() => import('src/pages/public/creator/mediaKit'));
const PublicAccessDummyPage = lazy(() => import('src/sections/public-access/dummy'));
const PublicAccessPage = lazy(() => import('src/sections/public-access/public-access-page'))

// ----------------------------------------------------------------------

export const publicRoutes = [
  {
    path: 'public',
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
      {
        path: 'access', 
        element: (
        <Suspense fallback={<LoadingScreen />}>
         {/* <PublicAccessPage/> */}
          <PublicAccessDummyPage/> 
        </Suspense>
        ),
      },
      {
        path: 'access/:id', 
        element: (
        <Suspense fallback={<LoadingScreen />}>
         <PublicAccessPage/>
        </Suspense>
        ),
      },
    ],
  },
];
