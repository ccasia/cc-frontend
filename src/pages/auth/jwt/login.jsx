import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';

import { AuthLayoutContext } from 'src/layouts/auth/general';

import { JwtLoginView } from 'src/sections/auth/jwt';
import { ModernLoginView } from 'src/sections/auth-demo/modern';

// ----------------------------------------------------------------------

export default function LoginPage() {
  const option = useContext(AuthLayoutContext);

  return (
    <>
      <Helmet>
        <title> Jwt: Login</title>
      </Helmet>

      {option === 'admin' ? <JwtLoginView /> : <ModernLoginView />}
    </>
  );
}
