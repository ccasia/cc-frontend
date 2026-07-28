import React, { lazy, Suspense } from 'react';

import { LoadingScreen } from 'src/components/loading-screen';

const FinanceDashboardView = lazy(() => import('./dashboard/view'));

function FinanceDiscover() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FinanceDashboardView />
    </Suspense>
  );
}

export default FinanceDiscover;
