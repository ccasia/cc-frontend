import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingScreen } from 'src/components/loading-screen';

const PublicMediaKitPage = lazy(() => import('src/pages/public/creator/mediaKit'));
const PublicValidate = lazy(() => import('src/sections/public-access/validation'));
const PublicAccessPage = lazy(() => import('src/sections/public-access/public-access-page'));
const BDBriefPage = lazy(() => import('src/pages/public/bd-brief'));

const PublicManageCreatorView = lazy(
  () => import('src/sections/public-access/publicCreatorManage')
);

const ApprovalPage = lazy(() => import('src/pages/public/approval'));

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
        path: 'campaign/discover/detail/:campaignId/creator/:creatorId',
        element: <PublicManageCreatorView />,
      },
      {
        path: 'access/:id',
        element: <PublicValidate />,
      },
      {
        path: 'view/:id',
        element: <PublicAccessPage />,
      },
      {
        path: 'approval/:token',
        element: <ApprovalPage />,
      },
    ],
  },
  {
    path: 'bd/:token',
    element: <BDBriefPage />,
  },
];
