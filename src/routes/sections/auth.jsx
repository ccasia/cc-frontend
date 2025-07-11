/* eslint-disable jsx-a11y/aria-role */
import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { GuestGuard } from 'src/auth/guard';
import CompactLayout from 'src/layouts/compact';
import AuthModernLayout from 'src/layouts/auth/creator';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// JWT
const JwtLoginPage = lazy(() => import('src/pages/auth/jwt/login'));
// const JwtRegisterPage = lazy(() => import('src/pages/auth/jwt/register'));
const AdminForm = lazy(() => import('src/pages/auth/jwt/adminForm'));
const ClientSetupPassword = lazy(() => import('src/pages/auth/client-setup-password'));
// ----------------------------------------------------------------------

// CLASSIC
// const CreatorLogin = lazy(() => import('src/pages/auth-demo/modern/login'));
// const CreatorRegister = lazy(() => import('src/pages/auth-demo/modern/register'));
// const ForgotPasswordClassicPage = lazy(() => import('src/pages/auth-demo/classic/forgot-password'));
const VerifyClassicPage = lazy(() => import('src/pages/auth-demo/classic/verify'));
const NewPasswordClassicPage = lazy(() => import('src/pages/auth-demo/classic/new-password'));

const NewLoginPage = lazy(() => import('src/pages/auth-demo/new-login'));
const NewRegisterPage = lazy(() => import('src/pages/auth-demo/new-register'));
const ForgotPasswordClassicPage = lazy(() => import('src/pages/auth-demo/forget-password'));

const authAdmin = {
  path: 'jwt',
  element: (
    <Suspense fallback={<SplashScreen />}>
      <Outlet />
    </Suspense>
  ),
  children: [
    {
      path: 'admin',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      ),
      children: [
        {
          path: 'login',
          element: (
            <GuestGuard>
              <AuthModernLayout>
                <JwtLoginPage />
              </AuthModernLayout>
            </GuestGuard>
          ),
        },
        {
          element: (
            <CompactLayout>
              <Outlet />
            </CompactLayout>
          ),
          children: [
            { path: 'forgot-password', element: <ForgotPasswordClassicPage /> },
            { path: 'new-password', element: <NewPasswordClassicPage /> },
            { path: 'verify', element: <VerifyClassicPage /> },
          ],
        },
      ],
    },
  ],
};

const authCreator = {
  path: 'jwt',
  element: (
    <Suspense fallback={<SplashScreen />}>
      <Outlet />
    </Suspense>
  ),
  children: [
    {
      path: 'login',
      element: (
        <GuestGuard>
          <AuthModernLayout>
            <NewLoginPage />
            {/* <CreatorLogin /> */}
          </AuthModernLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'register',
      element: (
        <GuestGuard>
          <AuthModernLayout title="Cult Creative">
            <NewRegisterPage />
            {/* <CreatorRegister /> */}
          </AuthModernLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'adminForm',
      element: (
        <GuestGuard>
          <AuthModernLayout title="admin Form">
            <AdminForm />
          </AuthModernLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'forgot-password',
      element: (
        <AuthModernLayout>
          <ForgotPasswordClassicPage />
        </AuthModernLayout>
      ),
    },
    {
      path: 'new-password',
      element: (
        <AuthModernLayout>
          <NewPasswordClassicPage />
        </AuthModernLayout>
      ),
    },
  ],
};

const authClient = {
  path: 'client',
  children: [
    {
      path: 'setup-password',
      element: (
        <GuestGuard>
          <AuthModernLayout title="Client Setup">
            <ClientSetupPassword />
          </AuthModernLayout>
        </GuestGuard>
      ),
    },
  ],
};

export const authRoutes = [
  {
    path: 'auth',
    children: [authAdmin, authCreator, authClient],
  },
];
