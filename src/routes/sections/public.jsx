import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingScreen } from 'src/components/loading-screen';

const PublicMediaKitPage = lazy(() => import('src/pages/public/creator/mediaKit'));
const PublicValidate = lazy(() => import('src/sections/public-access/validation'));
const PublicAccessPage = lazy(() => import('src/sections/public-access/public-access-page'));
const BDBriefPage = lazy(() => import('src/pages/public/bd-brief'));
const ClientBriefPage = lazy(() => import('src/pages/public/client-brief'));
const ClientDemoPage = lazy(() => import('src/pages/public/client-demo'));

const PublicManageCreatorView = lazy(
  () => import('src/sections/public-access/publicCreatorManage')
);

const ApprovalPage = lazy(() => import('src/pages/public/approval'));
const HuntLinkPage = lazy(() => import('src/pages/public/hunt-link'));

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
    path: 'campaign-brief/:token',
    element: <BDBriefPage />,
  },
  {
    path: 'campaign-brief/client/:magicToken',
    element: <ClientBriefPage />,
  },
  {
    path: 'client-demo/:token',
    element: <ClientDemoPage />,
  },
  {
    // Public web fallback for treasure-hunt QR codes when the app isn't
    // installed / the Universal Link didn't open. Matches the canonical
    // /hunt/{token} path that Bitly redirects to.
    path: 'hunt/:token',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <HuntLinkPage />
      </Suspense>
    ),
  },
];
