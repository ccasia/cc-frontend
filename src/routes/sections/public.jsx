import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingScreen } from 'src/components/loading-screen';


const PublicMediaKitPage = lazy(() => import('src/pages/public/creator/mediaKit'));
const PublicValidate = lazy(() => import('src/sections/public-access/validation' ));
const PublicAccessPage = lazy(() => import('src/sections/public-access/public-access-page'))

const PublicManageCreatorView = lazy (() => import('src/sections/public-access/publicCreatorManage'))


const CampaignManageCreatorView = lazy(
  () => import('src/pages/dashboard/campaign/admin/creator/campaign-manage-creator')
);

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
        element: (
        <Suspense fallback={<LoadingScreen />}>
         <PublicManageCreatorView/> 
        </Suspense>
        ),
      },
      {
        path: 'access/:id', 
        element: (
        <Suspense fallback={<LoadingScreen />}>
         <PublicValidate/>
        </Suspense>
        ),
      },
      {
        path: 'view/:id', 
        element: (
        <Suspense fallback={<LoadingScreen />}>
         <PublicAccessPage/>
        </Suspense>
        ),
      },
    ],
  },
];
