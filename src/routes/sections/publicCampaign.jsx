import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingScreen } from 'src/components/loading-screen';

import PublicCampaignView from 'src/sections/campaign/public-view/view/view';

// ----------------------------------------------------------------------

export const publicCampaingRoute = [
  {
    path: 'campaign',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [{ index: true, element: <PublicCampaignView /> }],
  },
];
