import { Navigate, useRoutes } from 'react-router-dom';

import { PATH_AFTER_LOGIN } from 'src/config-global';
import Agreement from "src/pages/dashboard/template/view"

import Verify from 'src/sections/creator/verify';
import VerfiyXero from 'src/sections/finance/verfiyXero';
import CreatorFormView from 'src/sections/creator/form/creatorForm';
import VerifyConfirmation from 'src/sections/creator/verifyConfirmation';

import { mainRoutes } from './main';
import { authRoutes } from './auth';
import { adminRoutes } from './admin';
import { publicRoutes } from './public';
import { dashboardRoutes } from './dashboard';
import { publicCampaingRoute } from './publicCampaign';

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <Navigate to={PATH_AFTER_LOGIN} replace />,
    },

    // Auth routes
    ...authRoutes,

    // Dashboard routes
    ...dashboardRoutes,

    // Main routes
    ...mainRoutes,

    ...adminRoutes,

    ...publicRoutes,

    ...publicCampaingRoute,

    { path: '/auth/creator-form-view', element: <CreatorFormView /> },
    { path: '/auth/verify', element: <Verify /> },
    { path: '/auth/verify/:token', element: <VerifyConfirmation /> },
    { path: '/dashboard/invoice/xeroVerfiy', element: <VerfiyXero /> },

    {path: "/template", element: <Agreement />},

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
    { path: '/adminInvite', element: <Navigate to="/404" replace /> },

    // { path: '/calendar', element: <Calendar /> },
  ]);
}
