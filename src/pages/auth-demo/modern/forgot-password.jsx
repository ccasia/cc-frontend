import { Helmet } from 'react-helmet-async';

import { ModernForgotPasswordView } from 'src/sections/auth-demo/modern';

// ----------------------------------------------------------------------

export default function ModernForgotPasswordPage() {
  return (
    <>
      <Helmet>
        <title> Auth Classic: Forgot Password</title>
      </Helmet>

      <ModernForgotPasswordView />
    </>
  );
}
