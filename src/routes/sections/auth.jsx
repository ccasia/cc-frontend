/* eslint-disable jsx-a11y/aria-role */
import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { GuestGuard } from 'src/auth/guard';
import CompactLayout from 'src/layouts/compact';
import AuthLayoutProvider from 'src/layouts/auth/general';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// JWT
const JwtLoginPage = lazy(() => import('src/pages/auth/jwt/login'));
const JwtRegisterPage = lazy(() => import('src/pages/auth/jwt/register'));
const AdminForm = lazy(() => import('src/pages/auth/jwt/adminForm'));
// ----------------------------------------------------------------------

// CLASSIC
// const LoginPage = lazy(() => import('src/pages/auth-demo/classic/login'));
// const RegisterClassicPage = lazy(() => import('src/pages/auth-demo/classic/register'));
const ForgotPasswordClassicPage = lazy(() => import('src/pages/auth-demo/classic/forgot-password'));
const VerifyClassicPage = lazy(() => import('src/pages/auth-demo/classic/verify'));
const NewPasswordClassicPage = lazy(() => import('src/pages/auth-demo/classic/new-password'));

// MODERN
// const LoginModernPage = lazy(() => import('src/pages/auth-demo/modern/login'));
// const RegisterModernPage = lazy(() => import('src/pages/auth-demo/modern/register'));
// const ForgotPasswordModernPage = lazy(() => import('src/pages/auth-demo/modern/forgot-password'));
// const VerifyModernPage = lazy(() => import('src/pages/auth-demo/modern/verify'));
// const NewPasswordModernPage = lazy(() => import('src/pages/auth-demo/modern/new-password'));

const authAdmin = {
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
          <AuthLayoutProvider>
            <JwtLoginPage />
          </AuthLayoutProvider>
        </GuestGuard>
      ),
    },
    {
      path: 'register',
      element: (
        <GuestGuard>
          <AuthLayoutProvider title="Cult Creative">
            <JwtRegisterPage />
          </AuthLayoutProvider>
        </GuestGuard>
      ),
    },
    // {
    //   path: 'adminForm',
    //   element: (
    //     <GuestGuard>
    //       <AuthLayoutProvider title="admin Form">
    //         <AdminForm />
    //       </AuthLayoutProvider>
    //     </GuestGuard>
    //   ),
    // },
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
};

// const authAdmin = {
//   path: 'jwt',
//   element: (
//     <Suspense fallback={<SplashScreen />}>
//       <Outlet />
//     </Suspense>
//   ),
//   children: [
//     {
//       path: 'login',
//       element: (
//         <GuestGuard>
//           <AuthClassicLayout>
//             {/* <h1>dawd</h1> */}

//             <JwtLoginPage />
//           </AuthClassicLayout>
//         </GuestGuard>
//       ),
//     },
//     {
//       path: 'register',
//       element: (
//         <GuestGuard>
//           <AuthClassicLayout title="Manage the job more effectively with Minimal">
//             <JwtRegisterPage />
//           </AuthClassicLayout>
//         </GuestGuard>
//       ),
//     },
//     {
//       element: (
//         <CompactLayout>
//           <Outlet />
//         </CompactLayout>
//       ),
//       children: [
//         { path: 'forgot-password', element: <ForgotPasswordClassicPage /> },
//         { path: 'new-password', element: <NewPasswordClassicPage /> },
//         { path: 'verify', element: <VerifyClassicPage /> },
//       ],
//     },
//   ],
// };

// const authModern = {
//   path: 'modern',
//   element: (
//     <Suspense fallback={<SplashScreen />}>
//       <Outlet />
//     </Suspense>
//   ),
//   children: [
//     {
//       path: 'login',
//       element: (
//         <AuthModernLayout>
//           <LoginModernPage />
//         </AuthModernLayout>
//       ),
//     },
//     {
//       path: 'register',
//       element: (
//         <AuthModernLayout>
//           <RegisterModernPage />
//         </AuthModernLayout>
//       ),
//     },
//     {
//       element: (
//         <AuthModernCompactLayout>
//           <Outlet />
//         </AuthModernCompactLayout>
//       ),
//       children: [
//         { path: 'forgot-password', element: <ForgotPasswordModernPage /> },
//         { path: 'new-password', element: <NewPasswordModernPage /> },
//         { path: 'verify', element: <VerifyModernPage /> },
//       ],
//     },
//   ],
// };

export const authRoutes = [
  {
    path: 'auth',
    children: [authAdmin],
  },
];
